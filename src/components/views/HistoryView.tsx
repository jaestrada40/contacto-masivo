import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Eye, 
  AlertTriangle, 
  Clock, 
  RotateCw 
} from 'lucide-react';
import { MessageLog, Campaign } from '../../types';

interface HistoryViewProps {
  messageLogs: MessageLog[];
  campaigns: Campaign[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ messageLogs, campaigns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterCampana, setFilterCampana] = useState('all');

  const filteredLogs = messageLogs.filter(log => {
    if (filterCanal !== 'all' && log.canal !== filterCanal) return false;
    if (filterEstado !== 'all' && log.estado !== filterEstado) return false;
    if (filterCampana !== 'all' && log.campanaId !== filterCampana) return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = log.contactoNombre.toLowerCase().includes(s);
      const matchPhone = (log.telefono || log.contactoTelefono || '').includes(s);
      const matchMsg = log.mensajeTexto.toLowerCase().includes(s);
      if (!matchName && !matchPhone && !matchMsg) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Contacto', 'Teléfono', 'Canal', 'Campaña', 'Mensaje', 'Estado', 'Fecha/Hora', 'Diagnóstico/Error'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.contactoNombre}"`,
      `"${l.telefono}"`,
      l.canal,
      `"${l.campanaNombre || ''}"`,
      `"${l.mensajeTexto.replace(/"/g, '""')}"`,
      l.estado,
      `"${l.fechaHora}"`,
      `"${l.error || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_global_mensajes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Historial Global de Mensajes</h1>
          <p className="text-xs text-slate-500">
            Registro unificado de trazabilidad y entrega de cada mensaje despachado por el sistema
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exportar Todo a CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por contacto, teléfono o palabra del mensaje..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <select
          value={filterCanal}
          onChange={e => setFilterCanal(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Canal: Todos</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>

        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Estado: Todos</option>
          <option value="leido">Leído (WA)</option>
          <option value="entregado">Entregado</option>
          <option value="fallido">Fallido</option>
          <option value="enviado">Enviado</option>
          <option value="pendiente">Pendiente</option>
        </select>

        <select
          value={filterCampana}
          onChange={e => setFilterCampana(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium max-w-xs truncate"
        >
          <option value="all">Todas las Campañas</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Message Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-900">
              <tr>
                <th className="py-3 px-4">Destinatario</th>
                <th className="py-3 px-3">Teléfono</th>
                <th className="py-3 px-3">Canal</th>
                <th className="py-3 px-4">Campaña Asignada</th>
                <th className="py-3 px-4">Contenido del Mensaje</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Fecha y Hora</th>
                <th className="py-3 px-4">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron registros de mensajes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.contactoNombre}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {log.telefono}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        log.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.canal}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {log.campanaNombre || 'Envío Individual'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={log.mensajeTexto}>
                      {log.mensajeTexto}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.estado === 'leido' ? 'bg-sky-100 text-sky-800' :
                        log.estado === 'entregado' ? 'bg-emerald-100 text-emerald-800' :
                        log.estado === 'fallido' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {log.fechaHora}
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      {log.error ? (
                        <span className="text-rose-600 font-semibold">{log.error}</span>
                      ) : (
                        <span className="text-emerald-700">Entregado</span>
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
