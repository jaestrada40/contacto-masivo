import { CampaignChannel } from '@prisma/client';

export class MetaWhatsAppMessagingProvider {
  async send(channel: CampaignChannel, to: string, _body: string, options?: { templateName?: string }) {
    if (channel !== CampaignChannel.WHATSAPP) throw new Error('Meta WhatsApp de prueba solo admite el canal WhatsApp');
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) throw new Error('Faltan META_WA_ACCESS_TOKEN o META_WA_PHONE_NUMBER_ID');
    const version = (process.env.META_WA_API_VERSION || 'v26.0').replace(/^v?/, 'v');
    const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: to.replace(/\D/g, ''), type: 'template', template: { name: options?.templateName || 'hello_world', language: { code: 'en_US' } } }),
    });
    const result = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } };
    if (!response.ok || !result.messages?.[0]?.id) throw new Error(`Meta WhatsApp API rechazó el envío (${result.error?.code ?? response.status}): ${result.error?.message || 'respuesta inválida'}`);
    return { id: result.messages[0].id };
  }
}
