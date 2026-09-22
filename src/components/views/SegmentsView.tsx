import React, { useState } from 'react';
import { 
  Layers, 
  Users, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  Send, 
  Filter, 
  Sparkles,
  MapPin,
  MessageSquare,
  Smartphone,
  Calendar,
  X,
  Trash2
} from 'lucide-react';
import { Segment, Contact, User } from '../../types';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';
import { ActiveView } from '../layout/Sidebar';
import { ConfirmDialog } from '../layout/ConfirmDialog';

interface SegmentsViewProps {
  segments: Segment[];
  contacts: Contact[];
  currentUser: User;
  onNavigate: (view: ActiveView, extraId?: string) => void;
  onStartCampaignWithSegment: (segmentId: string) => void;
  onDataChanged: () => Promise<void>;
}

export const SegmentsView: React.FC<SegmentsViewProps> = ({
  segments,
  contacts,
  currentUser,
  onNavigate,
  onStartCampaignWithSegment,
  onDataChanged,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newZona, setNewZona] = useState('');
  const [newSoloWA, setNewSoloWA] = useState(false);
  const [newSoloSMS, setNewSoloSMS] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);

  const getSegmentCount = (seg: Segment) => {
    return contacts.filter(c => c.estado === 'activo' && (!seg.criterio.zona || c.zona === seg.criterio.zona) && (!seg.criterio.grupo || c.grupo.includes(seg.criterio.grupo)) && (!seg.criterio.soloWhatsApp || c.consentimientoWhatsApp) && (!seg.criterio.soloSMS || c.consentimientoSMS)).length;
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    try {
      await api.createSegment({ name: newNombre.trim(), description: newDescripcion.trim() || undefined, isDynamic: true,
        filters: { status: 'ACTIVE', zone: newZona.trim() || undefined, whatsappOptIn: newSoloWA || undefined, smsOptIn: newSoloSMS || undefined } });
      await onDataChanged();
      showToast('Segmento creado.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'No se pudo crear el segmento.', 'error'); return; }
    setShowCreateModal(false);
    setNewNombre('');
    setNewDescripcion('');
    setNewZona('');
    setNewSoloWA(false);
    setNewSoloSMS(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Segmentos Dinámicos</h1>
          <p className="text-xs text-slate-500">
            Filtros inteligentes que agrupan automáticamente destinatarios según sus consentimientos y perfil
          </p>
        </div>

        {currentUser.rol !== 'consulta' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0C2A5A] hover:bg-[#123875] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Crear Segmento</span>
          </button>
        )}
      </div>

      {/* Grid of Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => {
          const matchCount = getSegmentCount(seg);
          const sampleMembers = contacts.filter(c => c.estado === 'activo' && (!seg.criterio.zona || c.zona === seg.criterio.zona) && (!seg.criterio.soloWhatsApp || c.consentimientoWhatsApp) && (!seg.criterio.soloSMS || c.consentimientoSMS)).slice(0, 3);

          return (
            <div
              key={seg.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{seg.nombre}</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0">
                    {matchCount} personas
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {seg.descripcion}
                </p>

                {/* Criteria Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4 text-[11px]">
                  {seg.criterio.soloActivos && (
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Solo activos
                    </span>
                  )}
                  {seg.criterio.zona && (
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-600" /> {seg.criterio.zona}
                    </span>
                  )}
                  {seg.criterio.soloWhatsApp && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" /> Opt-in WhatsApp
                    </span>
                  )}
                  {seg.criterio.soloSMS && (
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-amber-600" /> Opt-in SMS
                    </span>
                  )}
                  {seg.criterio.soloPruebaTwilio && (
                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Sandbox Twilio
                    </span>
                  )}
                </div>

                {/* Sample contacts */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                    Muestra de destinatarios:
                  </span>
                  <div className="space-y-1">
                    {sampleMembers.map(m => (
                      <div key={m.id} className="text-xs text-slate-600 flex items-center justify-between">
                        <span className="truncate">{m.nombres} {m.apellidos}</span>
                        <span className="font-mono text-[10px] text-slate-400">{m.telefono}</span>
                      </div>
                    ))}
                    {matchCount > 3 && (
                      <p className="text-[10px] text-slate-400 italic">... y {matchCount - 3} contactos más</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                {currentUser.rol !== 'consulta' ? (
                  <button
                    onClick={() => onStartCampaignWithSegment(seg.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#EAF3FF] hover:bg-blue-100 text-[#0C2A5A] py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    <span>Crear Campaña con este Segmento</span>
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-400 font-medium py-1">
                    Modo solo lectura
                  </div>
                )}
                {currentUser.rol === 'admin' && <button onClick={() => setSegmentToDelete(seg)} className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" />Eliminar segmento</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Custom Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Crear Segmento Dinámico</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Segmento *</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  placeholder="Ej. Líderes Comunitarios Altiplano"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newDescripcion}
                  onChange={e => setNewDescripcion(e.target.value)}
                  placeholder="Breve detalle del propósito de este grupo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filtrar por Zona / Ubicación</label>
                <input
                  type="text"
                  value={newZona}
                  onChange={e => setNewZona(e.target.value)}
                  placeholder="Ej. Zona 1, Quetzaltenango..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">Condición de Consentimiento:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSoloWA}
                    onChange={e => setNewSoloWA(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Requiere WhatsApp Autorizado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSoloSMS}
                    onChange={e => setNewSoloSMS(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Requiere SMS Autorizado</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0C2A5A] text-white font-bold rounded-lg hover:bg-blue-900"
                >
                  Guardar Segmento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {segmentToDelete && <ConfirmDialog
        title="Eliminar segmento"
        description={`¿Eliminar el segmento “${segmentToDelete.nombre}”? Las campañas que ya lo referencian conservarán su historial.`}
        confirmLabel="Eliminar segmento"
        destructive
        onCancel={() => setSegmentToDelete(null)}
        onConfirm={async () => {
          try { await api.deleteSegment(segmentToDelete.id); await onDataChanged(); showToast('Segmento eliminado.', 'success'); }
          catch (error) { showToast(error instanceof Error ? error.message : 'No se pudo eliminar el segmento.', 'error'); }
          setSegmentToDelete(null);
        }}
      />}
    </div>
  );
};
