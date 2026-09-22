import { BadRequestException, Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CampaignChannel, CampaignStatus, ExecutionMode, RecipientStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { MetaWhatsAppMessagingProvider } from './meta-whatsapp.provider';

export interface MessagingProvider {
  send(channel: CampaignChannel, to: string, body: string, options?: { templateName?: string }): Promise<{ id: string }>;
}

@Injectable()
export class TwilioMessagingProvider implements MessagingProvider {
  async send(channel: CampaignChannel, to: string, body: string) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new BadRequestException('Faltan credenciales de Twilio para el modo TWILIO_TEST');
    }
    const Twilio = (await import('twilio')).default;
    const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const from = channel === CampaignChannel.SMS ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM;
    if (!from) throw new BadRequestException('Falta el remitente Twilio del canal seleccionado');
    const result = await client.messages.create({
      to: channel === CampaignChannel.WHATSAPP ? `whatsapp:${to.replace(/^whatsapp:/i, '')}` : to,
      from: channel === CampaignChannel.WHATSAPP ? `whatsapp:${from.replace('whatsapp:', '')}` : from,
      body,
    });
    return { id: result.sid };
  }
}

@Injectable()
export class UltraMsgMessagingProvider implements MessagingProvider {
  async send(channel: CampaignChannel, to: string, body: string) {
    if (channel !== CampaignChannel.WHATSAPP) throw new BadRequestException('UltraMsg solo admite el canal WhatsApp');
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instanceId || !token) throw new BadRequestException('Faltan ULTRAMSG_INSTANCE_ID o ULTRAMSG_TOKEN');
    const response = await fetch(`https://api.ultramsg.com/${encodeURIComponent(instanceId)}/messages/chat`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token, to: to.replace(/^whatsapp:/i, ''), body }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) throw new Error(`UltraMsg rechazó el envío (${response.status}): ${result.error || result.message || 'respuesta inválida'}`);
    return { id: String(result.id) };
  }
}

@Processor('campaigns')
export class CampaignProcessor extends WorkerHost {
  constructor(private prisma: PrismaService, private twilio: TwilioMessagingProvider, private meta: MetaWhatsAppMessagingProvider, private ultramsg: UltraMsgMessagingProvider) { super(); }

  async process(job: Job<{ campaignId: string }>) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: job.data.campaignId }, include: { segment: true } });
    if (!campaign || campaign.status === CampaignStatus.CANCELLED) return;

    const filters = (campaign.segment?.filters || {}) as Record<string, unknown>;
    const selectedContactIds = Array.isArray(campaign.contactIds) ? campaign.contactIds.filter((id): id is string => typeof id === 'string') : [];
    const contacts = await this.prisma.contact.findMany({
      where: {
        id: campaign.contactIds !== null ? { in: selectedContactIds } : campaign.segment ? undefined : { in: [] },
        status: 'ACTIVE',
        optOutAt: null,
        zone: filters.zone ? { equals: String(filters.zone), mode: 'insensitive' } : undefined,
        groupName: filters.group ? { contains: String(filters.group), mode: 'insensitive' } : undefined,
        isTwilioTestNumber: campaign.executionMode === ExecutionMode.TWILIO_TEST || campaign.executionMode === ExecutionMode.META_TEST ? true : filters.isTwilioTestNumber ? true : undefined,
        whatsappOptIn: campaign.channel === CampaignChannel.WHATSAPP || filters.whatsappOptIn ? true : undefined,
        smsOptIn: campaign.channel === CampaignChannel.SMS || filters.smsOptIn ? true : undefined,
        OR: campaign.channel === CampaignChannel.BOTH ? [{ whatsappOptIn: true }, { smsOptIn: true }] : undefined,
      },
    });
    const existing = await this.prisma.campaignRecipient.findMany({ where: { campaignId: campaign.id, channel: campaign.channel, status: { in: [RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.READ] } }, select: { contactId: true } });
    const alreadySent = new Set(existing.map(item => item.contactId));
    const pendingContacts = contacts.filter(contact => !alreadySent.has(contact.id));

    try {
      for (let index = 0; index < pendingContacts.length; index++) {
        const contact = pendingContacts[index];
        const channel = campaign.channel;
        const message = campaign.executionMode === ExecutionMode.META_TEST ? 'Hello World' : campaign.message.replace(/{{\s*nombre\s*}}/gi, contact.firstName);
        if (campaign.executionMode === ExecutionMode.DEMO) {
          const hash = (index * 37 + campaign.id.length * 17) % 100;
          const failed = hash < 4;
          const read = !failed && channel !== CampaignChannel.SMS && hash < 67;
          const delivered = !failed && hash < 90;
          await this.prisma.campaignRecipient.upsert({
            where: { campaignId_contactId_channel: { campaignId: campaign.id, contactId: contact.id, channel } },
            create: {
              campaignId: campaign.id,
              contactId: contact.id,
              channel,
              status: failed ? RecipientStatus.FAILED : read ? RecipientStatus.READ : delivered ? RecipientStatus.DELIVERED : RecipientStatus.SENT,
              renderedMessage: message,
              errorMessage: failed ? 'Fallo simulado en modo DEMO' : undefined,
              sentAt: failed ? undefined : new Date(),
              deliveredAt: delivered ? new Date() : undefined,
              readAt: read ? new Date() : undefined,
            },
            update: {},
          });
        } else {
          const result = campaign.executionMode === ExecutionMode.META_TEST
            ? await this.meta.send(channel, contact.phone, message, { templateName: campaign.whatsappTemplate || 'hello_world' })
            : campaign.executionMode === ExecutionMode.ULTRAMSG
              ? await this.ultramsg.send(channel, contact.phone, message)
              : await this.twilio.send(channel, contact.phone, message);
          await this.prisma.campaignRecipient.upsert({
            where: { campaignId_contactId_channel: { campaignId: campaign.id, contactId: contact.id, channel } },
            create: { campaignId: campaign.id, contactId: contact.id, channel, status: RecipientStatus.SENT, renderedMessage: message, providerMessageId: result.id, sentAt: new Date() },
            update: {},
          });
        }
        if (campaign.executionMode === ExecutionMode.ULTRAMSG && index < pendingContacts.length - 1) await new Promise(resolve => setTimeout(resolve, 40_000));
        await job.updateProgress(Math.round((index + 1) * 100 / Math.max(1, pendingContacts.length)));
      }
      await this.prisma.campaign.update({ where: { id: campaign.id }, data: { status: CampaignStatus.COMPLETED, sentAt: new Date() } });
    } catch (error) {
      await this.prisma.campaign.update({ where: { id: campaign.id }, data: { status: CampaignStatus.FAILED } });
      throw error;
    }
  }
}
