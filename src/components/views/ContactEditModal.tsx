import React, { useState } from 'react';
import { X, Save, Phone, Smartphone } from 'lucide-react';
import { Contact } from '../../types';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';

interface ContactEditModalProps {
  contact: Contact | null; // null means creating a new contact
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export const ContactEditModal: React.FC<ContactEditModalProps> = ({
  contact,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(contact);

  const [nombres, setNombres] = useState(contact?.nombres || '');
  const [apellidos, setApellidos] = useState(contact?.apellidos || '');
  const [dpi, setDpi] = useState(contact?.dpi || '');
  const [telefono, setTelefono] = useState(contact?.telefono || '+502 ');
  const [email, setEmail] = useState(contact?.email || '');
  const [departamento, setDepartamento] = useState(contact?.departamento || '');
  const [zona, setZona] = useState(contact?.zona || '');
  const [grupo, setGrupo] = useState(contact?.grupo || '');
  const [consentimientoWhatsApp, setConsentimientoWhatsApp] = useState(contact?.consentimientoWhatsApp || false);
  const [consentimientoSMS, setConsentimientoSMS] = useState(contact?.consentimientoSMS || false);
  const [fuenteConsentimiento, setFuenteConsentimiento] = useState(contact?.fuenteConsentimiento || '');
  const [estado, setEstado] = useState<Contact['estado']>(contact?.estado || 'activo');
  const [esNumeroPruebaTwilio, setEsNumeroPruebaTwilio] = useState(contact?.esNumeroPruebaTwilio || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim()) {
      showToast('Por favor ingrese nombres y apellidos completos.', 'error');
      return;
    }

    // Phone format check (must start with + and country code, e.g. +502)
    const cleanedPhone = telefono.replace(/\s+/g, '');
    if (!cleanedPhone.startsWith('+') || cleanedPhone.length < 9) {
      showToast('El teléfono debe tener formato internacional válido (ejemplo: +50255555555 o +502 5555 1234).', 'error');
      return;
    }

    try {
      const contactData = {
        firstName: nombres.trim(), lastName: apellidos.trim(), documentId: dpi.trim() || undefined,
        phone: cleanedPhone, email: email.trim() || undefined, department: departamento.trim() || undefined, zone: zona.trim() || undefined,
        groupName: grupo.trim() || undefined, status: estado === 'activo' ? 'ACTIVE' : estado === 'bloqueado' ? 'BLOCKED' : 'INACTIVE',
        whatsappOptIn: consentimientoWhatsApp, smsOptIn: consentimientoSMS,
        consentSource: fuenteConsentimiento.trim() || undefined, isTwilioTestNumber: esNumeroPruebaTwilio,
      };
      if (contact) await api.updateContact(contact.id, contactData);
      else await api.createContact(contactData);
      await onSaved();
      showToast(contact ? 'Contacto actualizado.' : 'Contacto creado.', 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar el contacto.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Editar Contacto' : 'Nuevo Contacto con Consentimiento'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Modifique los datos y canales autorizados' : 'Registre un nuevo afiliado con opt-in verificado'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                placeholder="Ej. Ana Victoria"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                placeholder="Ej. Salazar Gómez"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Teléfono y DPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teléfono Internacional (E.164) *
              </label>
              <input
                type="text"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="+502 5555 1234"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">DPI / Documento</label>
              <input
                type="text"
                value={dpi}
                onChange={e => setDpi(e.target.value)}
                placeholder="2450 12345 0101"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Correo y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.gt"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
              <input
                type="text"
                value={departamento}
                onChange={e => setDepartamento(e.target.value)}
                placeholder="Guatemala"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Zona / Municipio</label>
              <input
                type="text"
                value={zona}
                onChange={e => setZona(e.target.value)}
                placeholder="Zona 1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Grupo y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grupo / Segmento</label>
              <input
                type="text"
                value={grupo}
                onChange={e => setGrupo(e.target.value)}
                placeholder="Comité Central, Taller 2026..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="activo">Activo (Receptor de campañas)</option>
                <option value="inactivo">Inactivo (Dado de baja)</option>
                <option value="bloqueado">Bloqueado (Restringido por políticas)</option>
              </select>
            </div>
          </div>

          {/* Consentimiento Canales */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
            <h4 className="font-bold text-[#0C2A5A] text-xs">Autorizaciones de Difusión (Opt-in)</h4>
            
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentimientoWhatsApp}
                  onChange={e => setConsentimientoWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="font-semibold text-slate-800">Consentimiento WhatsApp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentimientoSMS}
                  onChange={e => setConsentimientoSMS(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">Consentimiento SMS</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fuente y origen del consentimiento *</label>
              <input
                type="text"
                value={fuenteConsentimiento}
                onChange={e => setFuenteConsentimiento(e.target.value)}
                placeholder="Ej. Formulario de registro en asamblea presencial"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Test-provider allowlist flag */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={esNumeroPruebaTwilio}
                onChange={e => setEsNumeroPruebaTwilio(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded mt-0.5"
              />
              <div>
                <span className="font-bold text-indigo-950 block">
                  Autorizar para pruebas de mensajería
                </span>
                <span className="text-[11px] text-indigo-700">
                  Permite incluir este número en los modos de prueba de Twilio o Meta. Además, Meta exige autorizar el destinatario en su panel de API Setup.
                </span>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0C2A5A] text-white rounded-lg font-bold hover:bg-blue-900 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Contacto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
