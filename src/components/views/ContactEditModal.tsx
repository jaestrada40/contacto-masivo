import React, { useState } from 'react';
import { X, Save, AlertCircle, Phone, Smartphone } from 'lucide-react';
import { Contact, User } from '../../types';
import { storageService } from '../../services/storageService';

interface ContactEditModalProps {
  contact: Contact | null; // null means creating a new contact
  onClose: () => void;
  currentUser: User;
}

export const ContactEditModal: React.FC<ContactEditModalProps> = ({
  contact,
  onClose,
  currentUser,
}) => {
  const isEditing = Boolean(contact);

  const [nombres, setNombres] = useState(contact?.nombres || '');
  const [apellidos, setApellidos] = useState(contact?.apellidos || '');
  const [dpi, setDpi] = useState(contact?.dpi || '');
  const [telefono, setTelefono] = useState(contact?.telefono || '+502 ');
  const [email, setEmail] = useState(contact?.email || '');
  const [departamento, setDepartamento] = useState(contact?.departamento || 'Guatemala');
  const [zona, setZona] = useState(contact?.zona || 'Zona 1');
  const [grupo, setGrupo] = useState(contact?.grupo || 'Afiliados Zona 1');
  const [consentimientoWhatsApp, setConsentimientoWhatsApp] = useState(contact ? contact.consentimientoWhatsApp : true);
  const [consentimientoSMS, setConsentimientoSMS] = useState(contact ? contact.consentimientoSMS : true);
  const [fuenteConsentimiento, setFuenteConsentimiento] = useState(contact?.fuenteConsentimiento || 'Formulario digital de consentimiento voluntario');
  const [estado, setEstado] = useState<Contact['estado']>(contact?.estado || 'activo');
  const [esNumeroPruebaTwilio, setEsNumeroPruebaTwilio] = useState(contact?.esNumeroPruebaTwilio || false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombres.trim() || !apellidos.trim()) {
      setErrorMsg('Por favor ingrese nombres y apellidos completos.');
      return;
    }

    // Phone format check (must start with + and country code, e.g. +502)
    const cleanedPhone = telefono.replace(/\s+/g, '');
    if (!cleanedPhone.startsWith('+') || cleanedPhone.length < 9) {
      setErrorMsg('El teléfono debe tener formato internacional válido (ejemplo: +50255555555 o +502 5555 1234).');
      return;
    }

    if (!consentimientoWhatsApp && !consentimientoSMS && estado === 'activo') {
      setErrorMsg('Debe registrar al menos un canal autorizado (WhatsApp o SMS) para dar de alta el contacto como activo.');
      return;
    }

    const contactData: Contact = {
      id: contact ? contact.id : `cnt-${Date.now().toString().slice(-4)}`,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      dpi: dpi.trim() || 'No especificado',
      telefono: telefono.trim(),
      email: email.trim() || `${nombres.toLowerCase().split(' ')[0]}@correo.gt`,
      departamento: departamento.trim(),
      zona: zona.trim(),
      grupo: grupo.trim(),
      fechaRegistro: contact ? contact.fechaRegistro : new Date().toISOString().split('T')[0],
      consentimientoWhatsApp,
      consentimientoSMS,
      estado,
      fechaConsentimiento: contact ? contact.fechaConsentimiento : new Date().toISOString().split('T')[0],
      fuenteConsentimiento: fuenteConsentimiento.trim(),
      esNumeroPruebaTwilio,
      fechaBaja: estado === 'inactivo' ? (contact?.fechaBaja || new Date().toISOString().split('T')[0]) : undefined,
    };

    storageService.saveContact(contactData, currentUser);
    onClose();
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

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

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

          {/* Twilio Test Number Flag */}
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
                  Autorizar como Número de Prueba Twilio (Sandbox)
                </span>
                <span className="text-[11px] text-indigo-700">
                  Habilita este número para recibir difusiones reales cuando se ejecute en <strong>Modo Prueba Twilio</strong>.
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
