import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Eye, 
  AlertTriangle, 
  Clock, 
  Download, 
  RotateCw, 
  MessageSquare, 
  Smartphone, 
  DollarSign, 
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Campaign, MessageLog, User } from '../../types';
import { ActiveView } from '../layout/Sidebar';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';

interface CampaignDetailViewProps {
  campaignId: string;
  campaigns: Campaign[];
  messageLogs: MessageLog[];
  currentUser: User;
  onNavigate: (view: ActiveView, extraId?: string) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaignId,
  campaigns,
  messageLogs,
  currentUser,
  onNavigate,
}) => {
  const campaign = campaigns.find(c => c.id === campaignId) || campaigns[0];
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  if (!campaign) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Campaña no encontrada.</p>
        <button onClick={() => onNavigate('campanas')} className="mt-2 text-blue-600 font-bold text-xs">
          Volver a campañas
        </button>
      </div>
    );
  }

  // Logs for this campaign
  const campaignLogs = messageLogs.filter(m => m.campanaId === campaign.id);

  const filteredLogs = campaignLogs.filter(log => {
    if (statusFilter !== 'all' && log.estado !== statusFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = log.contactoNombre.toLowerCase().includes(s);
      const matchPhone = (log.telefono || log.contactoTelefono || '').includes(s);
      if (!matchName && !matchPhone) return false;
    }
    return true;
  });

  const total = campaign.estadisticas.total || campaign.totalDestinatarios || 1;
  const deliveredPct = Math.round((campaign.estadisticas.entregados / total) * 100);
  const readPct = Math.round((campaign.estadisticas.leidos / total) * 100);

  const handleExportCSV = () => {
    const headers = ['ID Registro', 'Contacto', 'Teléfono', 'Canal', 'Estado', 'Fecha/Hora', 'Detalle Error'];
    const rows = campaignLogs.map(l => [
      l.id,
      `"${l.contactoNombre}"`,
      `"${l.telefono}"`,
      l.canal,
      l.estado,
      `"${l.fechaHora}"`,
      `"${l.error || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_campana_${campaign.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    try {
      await api.sendCampaign(campaign.id);
      showToast('Se solicitó reintentar la campaña al servidor.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible reenviar la campaña.', 'error');
    } finally { setIsRetrying(false); }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('campanas')}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{campaign.nombre}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                campaign.modo === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {campaign.modo === 'demo' ? 'Modo Demo' : 'Twilio Sandbox'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Creada el {campaign.fechaCreacion.split('T')[0]} por {campaign.creadorNombre || 'Administrador'} • Segmento: {campaign.segmentoNombre || 'Segmento Activo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar Reporte CSV</span>
          </button>

          {campaign.estadisticas.fallidos > 0 && currentUser.rol !== 'consulta' && (
            <button
              onClick={handleRetryFailed}
              disabled={isRetrying}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Reintentar Fallidos ({campaign.estadisticas.fallidos})</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Send className="w-4 h-4 text-blue-500" />
            <span>Enviados</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {campaign.estadisticas.enviados.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">100% despachados</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Entregados</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950 font-mono">
            {campaign.estadisticas.entregados.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">{deliveredPct}% de entrega</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-sky-600" />
            <span>Leídos (WA)</span>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-950 font-mono">
            {campaign.estadisticas.leidos.toLocaleString()}
          </div>
          <div className="text-[10px] text-sky-700 font-semibold mt-1">{readPct}% de lectura</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Fallidos</span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-950 font-mono">
            {campaign.estadisticas.fallidos.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-700 mt-1">Números inalcanzables</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span>Costo Total</span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${campaign.estadisticas.costoEstimado.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">USD acumulado</div>
        </div>
      </div>

      {/* Message Content Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Mensaje Despachado:
        </h3>
        <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">
          {campaign.mensaje}
        </p>
      </div>

      {/* Individual Message Tracking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Seguimiento Individual de Mensajes</h3>
            <p className="text-xs text-slate-500">Trazabilidad en tiempo real de cada número contactado</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar contacto o teléfono..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="all">Todos los estados</option>
              <option value="leido">Leídos</option>
              <option value="entregado">Entregados</option>
              <option value="fallido">Fallidos</option>
              <option value="enviado">Enviados</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Contacto</th>
                <th className="py-2.5 px-4">Teléfono (E.164)</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-4">Fecha / Hora</th>
                <th className="py-2.5 px-4">Detalle / Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No hay registros individuales para mostrar con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {log.contactoNombre}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {log.telefono}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        log.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.canal}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.estado === 'leido' ? 'bg-sky-100 text-sky-800' :
                        log.estado === 'entregado' ? 'bg-emerald-100 text-emerald-800' :
                        log.estado === 'fallido' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {log.fechaHora}
                    </td>
                    <td className="py-2.5 px-4 text-[11px]">
                      {log.error ? (
                        <span className="text-rose-600 font-medium">{log.error}</span>
                      ) : (
                        <span className="text-emerald-700">Entregado satisfactoriamente</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
