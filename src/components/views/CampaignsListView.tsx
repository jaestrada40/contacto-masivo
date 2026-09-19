import React, { useState } from 'react';
import { 
  Send, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Smartphone, 
  Layers, 
  Calendar,
  ChevronRight,
  Sparkles,
  BarChart3,
  Eye
} from 'lucide-react';
import { Campaign, User } from '../../types';
import { ActiveView } from '../layout/Sidebar';

interface CampaignsListViewProps {
  campaigns: Campaign[];
  currentUser: User;
  onNavigate: (view: ActiveView, extraId?: string) => void;
}

export const CampaignsListView: React.FC<CampaignsListViewProps> = ({
  campaigns,
  currentUser,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = campaigns.filter(c => {
    if (searchTerm && !c.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterChannel !== 'all' && c.canal !== filterChannel) return false;
    if (filterMode !== 'all' && c.modo !== filterMode) return false;
    if (filterType !== 'all' && c.tipo !== filterType) return false;
    return true;
  });

  const getChannelBadge = (canal: Campaign['canal']) => {
    switch (canal) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        );
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Smartphone className="w-3 h-3" /> SMS
          </span>
        );
      case 'ambos':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Layers className="w-3 h-3" /> Ambos
          </span>
        );
    }
  };

  const getStatusBadge = (estado: Campaign['estado']) => {
    switch (estado) {
      case 'completada':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Completada
          </span>
        );
      case 'programada':
        return (
          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Programada
          </span>
        );
      case 'enviando':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
            Enviando...
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campañas de Mensajería</h1>
          <p className="text-xs text-slate-500">
            Registro histórico y monitoreo de difusiones masivas ejecutadas y programadas
          </p>
        </div>

        {currentUser.rol !== 'consulta' && (
          <button
            onClick={() => onNavigate('nueva_campana')}
            className="flex items-center gap-2 bg-[#0C2A5A] hover:bg-[#123875] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Crear Nueva Campaña</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de campaña..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <select
          value={filterChannel}
          onChange={e => setFilterChannel(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Todos los canales</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="ambos">Ambos</option>
        </select>

        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Todos los modos</option>
          <option value="demo">Modo Demo</option>
          <option value="twilio_test">Modo Prueba Twilio</option>
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Todos los tipos</option>
          <option value="recordatorio">Recordatorio</option>
          <option value="aviso">Aviso</option>
          <option value="informativa">Informativa</option>
          <option value="promocion">Promoción</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-900">
              <tr>
                <th className="py-3 px-4">Nombre de Campaña</th>
                <th className="py-3 px-3">Canal</th>
                <th className="py-3 px-3">Modo</th>
                <th className="py-3 px-3">Destinatarios</th>
                <th className="py-3 px-3">Efectividad</th>
                <th className="py-3 px-3">Costo Est.</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron campañas con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filtered.map(cmp => {
                  const total = cmp.estadisticas.total || cmp.totalDestinatarios || 1;
                  const deliveredPct = Math.round(((cmp.estadisticas.entregados || 0) / total) * 100);

                  return (
                    <tr key={cmp.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {cmp.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className="capitalize">{cmp.tipo}</span>
                          <span>•</span>
                          <span>{cmp.segmentoNombre || 'Segmento activo'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {getChannelBadge(cmp.canal)}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cmp.modo === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {cmp.modo === 'demo' ? 'Demo (Simulada)' : 'Twilio Sandbox'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 font-mono">
                          {cmp.totalDestinatarios.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ width: `${deliveredPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-[11px]">{deliveredPct}%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {cmp.estadisticas.entregados} entregados
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-slate-800">
                        ${cmp.estadisticas.costoEstimado.toFixed(2)} USD
                      </td>

                      <td className="py-3.5 px-3">
                        {getStatusBadge(cmp.estado)}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {cmp.fechaCreacion.split('T')[0]}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigate('campana_detalle', cmp.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#0C2A5A] hover:text-white rounded-lg text-xs font-semibold text-slate-700 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver reporte</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
