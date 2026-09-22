import { CampaignChannel } from '@prisma/client';
import { MetaWhatsAppMessagingProvider } from '../src/meta-whatsapp.provider';

describe('Meta WhatsApp Cloud API provider', () => {
  const originalToken = process.env.META_WA_ACCESS_TOKEN;
  const originalPhoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalToken === undefined) delete process.env.META_WA_ACCESS_TOKEN;
    else process.env.META_WA_ACCESS_TOKEN = originalToken;
    if (originalPhoneNumberId === undefined) delete process.env.META_WA_PHONE_NUMBER_ID;
    else process.env.META_WA_PHONE_NUMBER_ID = originalPhoneNumberId;
  });

  it('envía hello_world al número E.164 y devuelve el wamid sin llamar a Meta realmente', async () => {
    process.env.META_WA_ACCESS_TOKEN = 'test-token';
    process.env.META_WA_PHONE_NUMBER_ID = '123456789';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.test' }] }),
    } as Response);

    const result = await new MetaWhatsAppMessagingProvider().send(CampaignChannel.WHATSAPP, '+502 376-0859', 'ignorado en plantilla de prueba');

    expect(result).toEqual({ id: 'wamid.test' });
    expect(fetchMock).toHaveBeenCalledWith('https://graph.facebook.com/v26.0/123456789/messages', expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: '5023760859', type: 'template', template: { name: 'hello_world', language: { code: 'en_US' } } }),
    }));
  });

  it('rechaza SMS en modo Meta antes de llamar a la API', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    await expect(new MetaWhatsAppMessagingProvider().send(CampaignChannel.SMS, '+5023760859', 'mensaje')).rejects.toThrow('solo admite el canal WhatsApp');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
