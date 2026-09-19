import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Layers 
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction !== 'all' && !log.accion.toLowerCase().includes(filterAction.toLowerCase())) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchAction = log.accion.toLowerCase().includes(s);
      const matchUser = log.usuarioNombre.toLowerCase().includes(s);
      const matchDetails = log.detalles.toLowerCase().includes(s);
      if (!matchAction && !matchUser && !matchDetails) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha y Hora', 'Usuario', 'Rol', 'Acción', 'Entidad Afectada', 'Detalles'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.usuarioNombre}"`,
      l.usuarioRol,
      `"${l.accion}"`,
      `"${l.entidadAfectada || ''}"`,
      `"${l.detalles.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_seguridad_conecta_masivo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bitácora de Auditoría y Seguridad</h1>
          <p className="text-xs text-slate-500">
            Registro inmutable de todas las acciones operativas, consentimientos, bajas y despachos
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exportar Bitácora CSV</span>
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
            placeholder="Buscar por usuario, acción o detalle..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
        >
          <option value="all">Todas las Acciones</option>
          <option value="inicio de sesión">Inicios de Sesión</option>
          <option value="campaña">Despacho de Campañas</option>
          <option value="contacto">Creación de Contactos</option>
          <option value="baja">Bajas de Contactos</option>
          <option value="configuración">Cambios de Configuración</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-900">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-3">Rol</th>
                <th className="py-3 px-4">Acción Ejecutada</th>
                <th className="py-3 px-3">Entidad</th>
                <th className="py-3 px-4">Detalles y Trazabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {(log.timestamp || log.fechaHora).replace('T', ' ').slice(0, 19)}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    {log.usuarioNombre}
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-700">
                      {log.usuarioRol}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {log.accion}
                  </td>

                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {log.entidadAfectada || '-'}
                  </td>

                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    {log.detalles}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
