import 'reflect-metadata';
import { validate } from 'class-validator';
import { ContactDto } from '../src/dto';

describe('reglas de contactos', () => {
  it('rechaza teléfonos que no estén en E.164', async () => {
    const dto = Object.assign(new ContactDto(), { firstName: 'Demo', lastName: 'Contacto', phone: '5555 0000' });
    expect((await validate(dto)).some(error => error.property === 'phone')).toBe(true);
  });

  it('acepta teléfonos E.164 para contactos con consentimiento', async () => {
    const dto = Object.assign(new ContactDto(), { firstName: 'Demo', lastName: 'Contacto', phone: '+50255550000', whatsappOptIn: true });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('acepta por separado departamento y zona, manteniendo compatibilidad con el campo anterior', async () => {
    const current = Object.assign(new ContactDto(), { firstName: 'Demo', lastName: 'Contacto', phone: '+50255550000', department: 'Antigua Guatemala', zone: 'zona 1' });
    const legacy = Object.assign(new ContactDto(), { firstName: 'Demo', lastName: 'Contacto', phone: '+50255550001', departmentOrZone: 'Antigua Guatemala / zona 1' });
    expect(await validate(current)).toHaveLength(0);
    expect(await validate(legacy)).toHaveLength(0);
  });
});
