import React from 'react';
import { 
  X, 
  UserCheck, 
  Smartphone, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  PhoneCall, 
  FileText, 
  AlertTriangle,
  History,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Contact, MessageLog } from '../../types';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  messageLogs: MessageLog[];
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  messageLogs,
}) => {
  if (!contact) return null;

  const contactLogs = messageLogs.filter(m => m.contactoId === contact.id);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0C2A5A] font-bold text-lg flex items-center justify-center border border-blue-100">
              {contact.nombres.charAt(0)}{contact.apellidos.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {contact.nombres} {contact.apellidos}
                </h3>
                {contact.esNumeroPruebaTwilio && (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    Twilio Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">DPI: {contact.dpi} • ID: {contact.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Consent Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado Operativo</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                contact.estado === 'activo' ? 'bg-emerald-500' :
                contact.estado === 'inactivo' ? 'bg-rose-500' : 'bg-slate-500'
              }`} />
              <span className="text-xs font-bold text-slate-900 capitalize">{contact.estado}</span>
            </div>
            {contact.fechaBaja && (
              <p className="text-[10px] text-rose-600 mt-0.5">Baja: {contact.fechaBaja}</p>
            )}
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Consentimiento WhatsApp</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-950">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{contact.consentimientoWhatsApp ? 'Autorizado (Opt-in)' : 'No Autorizado'}</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Vía {contact.fuenteConsentimiento.slice(0, 22)}...</p>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Consentimiento SMS</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-blue-950">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>{contact.consentimientoSMS ? 'Autorizado (Opt-in)' : 'No Autorizado'}</span>
            </div>
            <p className="text-[10px] text-blue-700 mt-0.5">Vigente desde {contact.fechaConsentimiento}</p>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5 mb-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block text-[11px]">Teléfono Móvil (E.164):</span>
              <span className="font-bold text-slate-800 font-mono">{contact.telefono}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Correo Electrónico:</span>
              <span className="font-semibold text-slate-800">{contact.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ubicación:</span>
              <span className="font-semibold text-slate-800">{contact.zona}, {contact.departamento}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Grupo / Segmento:</span>
              <span className="font-semibold text-slate-800">{contact.grupo}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80">
            <span className="text-slate-400 block text-[11px]">Trazabilidad de Consentimiento:</span>
            <p className="text-slate-700 mt-0.5">
              Registrado el <strong>{contact.fechaConsentimiento}</strong> mediante <em>"{contact.fuenteConsentimiento}"</em>.
              Cumple con el requerimiento de opt-in explícito.
            </p>
          </div>

          {contact.motivoBaja && (
            <div className="pt-2 border-t border-rose-200 text-rose-800">
              <span className="font-bold">Motivo de revocación / baja:</span> {contact.motivoBaja}
            </div>
          )}
        </div>

        {/* Recent Message Dispatch History for this Contact */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Mensajes Enviados a Este Contacto ({contactLogs.length})</span>
            </h4>
          </div>

          {contactLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No hay registros de envíos directos para este contacto en el historial reciente.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {contactLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        log.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.canal}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{log.campanaNombre}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.mensajeTexto}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      log.estado === 'leido' ? 'bg-sky-100 text-sky-800' :
                      log.estado === 'entregado' ? 'bg-emerald-100 text-emerald-800' :
                      log.estado === 'fallido' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {log.estado}
                    </span>
                    <div className="text-[9px] text-slate-400 mt-1">{log.fechaHora}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0C2A5A] text-white text-xs font-semibold hover:bg-blue-900 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
