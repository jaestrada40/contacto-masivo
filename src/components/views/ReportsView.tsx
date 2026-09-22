import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Download, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Contact, MessageLog } from '../../types';

interface ReportsViewProps {
  contacts: Contact[];
  messageLogs: MessageLog[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  contacts,
  messageLogs,
}) => {
  const sentMessages = messageLogs.filter(m => ['enviado', 'entregado', 'leido'].includes(m.estado));
  const deliveredMessages = messageLogs.filter(m => ['entregado', 'leido'].includes(m.estado));
  const readMessages = messageLogs.filter(m => m.estado === 'leido');
  const failedMessages = messageLogs.filter(m => m.estado === 'fallido');
  const totalEnviados = sentMessages.length;
  const totalEntregados = deliveredMessages.length;
  const totalLeidos = readMessages.length;
  const totalFallidos = failedMessages.length;
  const totalCosto = messageLogs.reduce((s, m) => s + m.costoEstimado, 0);

  const deliveryRate = totalEnviados > 0 ? ((totalEntregados / totalEnviados) * 100).toFixed(1) : '0.0';
  const readRate = totalEntregados > 0 ? ((totalLeidos / totalEntregados) * 100).toFixed(1) : '0.0';

  const waMessages = messageLogs.filter(m => m.canal === 'whatsapp');
  const smsMessages = messageLogs.filter(m => m.canal === 'sms');
  const waSent = waMessages.filter(m => ['enviado', 'entregado', 'leido'].includes(m.estado)).length;
  const waDelivered = waMessages.filter(m => ['entregado', 'leido'].includes(m.estado)).length;
  const waRead = waMessages.filter(m => m.estado === 'leido').length;
  const waReadRate = waDelivered ? ((waRead / waDelivered) * 100).toFixed(1) : '0.0';
  const waDeliveryPct = waSent > 0 ? Math.round((waDelivered / waSent) * 100) : 0;
  const smsSent = smsMessages.filter(m => ['enviado', 'entregado', 'leido'].includes(m.estado)).length;
  const smsDelivered = smsMessages.filter(m => ['entregado', 'leido'].includes(m.estado)).length;
  const smsFailed = smsMessages.filter(m => m.estado === 'fallido').length;
  const smsDeliveryPct = smsSent > 0 ? Math.round((smsDelivered / smsSent) * 100) : 0;
  const waCost = waMessages.reduce((s, m) => s + m.costoEstimado, 0);
  const smsCost = smsMessages.reduce((s, m) => s + m.costoEstimado, 0);
  const contactsWithConsent = contacts.filter(c => c.consentimientoWhatsApp || c.consentimientoSMS).length;
  const consentRate = contacts.length ? Math.round((contactsWithConsent / contacts.length) * 100) : 0;

  const failureReasons = Array.from(failedMessages.reduce((reasons, message) => {
    const reason = message.motivoError?.trim() || 'Motivo no especificado';
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
    return reasons;
  }, new Map<string, number>()), ([motivo, count]) => ({
    motivo,
    count,
    pct: totalFallidos ? Math.round((count / totalFallidos) * 100) : 0,
  }));

  const handleExportSummaryCSV = () => {
    const headers = ['Métrica', 'Valor', 'Detalle'];
    const rows = [
      ['Total Mensajes Despachados', totalEnviados.toString(), 'Todos los canales'],
      ['Total Mensajes Entregados', totalEntregados.toString(), `${deliveryRate}% efectividad`],
      ['Total Mensajes Leídos (WhatsApp)', totalLeidos.toString(), `${readRate}% tasa de apertura`],
      ['Total Mensajes Fallidos', totalFallidos.toString(), 'Rechazos o números inválidos'],
      ['Inversión Acumulada', `$${totalCosto.toFixed(2)} USD`, 'Costo estimado Twilio API'],
      ['Efectividad WhatsApp', `${waDeliveryPct}%`, `${waDelivered} / ${waSent}`],
      ['Efectividad SMS', `${smsDeliveryPct}%`, `${smsDelivered} / ${smsSent}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ejecutivo_conecta_masivo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes Ejecutivos y Analítica</h1>
          <p className="text-xs text-slate-500">
            Métricas de rendimiento, costo por canal, tasa de lectura y auditoría de entrega masiva
          </p>
        </div>

        <button
          onClick={handleExportSummaryCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C2A5A] text-white hover:bg-blue-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Descargar Resumen Ejecutivo</span>
        </button>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Entrega Global</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{deliveryRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">promedio</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${deliveryRate}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{totalEntregados.toLocaleString()} mensajes recibidos con éxito</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lectura WhatsApp</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 font-mono">{readRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">abiertos</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${readRate}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{totalLeidos.toLocaleString()} lecturas confirmadas (doble check azul)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inversión Acumulada</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">${totalCosto.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-semibold">USD</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Promedio unitario: <strong className="text-slate-800">${(totalCosto / (totalEnviados || 1)).toFixed(3)} USD</strong> por envío
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base con Consentimiento</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700 font-mono">{consentRate}%</span>
            <span className="text-xs text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">registrado</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {contactsWithConsent} de {contacts.length} contactos con consentimiento registrado
          </p>
        </div>
      </div>

      {/* Comparison: WhatsApp vs SMS Channel Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Channel Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rendimiento: WhatsApp Business</h3>
                <p className="text-xs text-slate-500">Actividad registrada en WhatsApp</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
              {waDeliveryPct}% Entrega
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mensajes despachados:</span>
              <span className="font-bold text-slate-800 font-mono">{waSent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Entregados con éxito:</span>
              <span className="font-bold text-emerald-600 font-mono">{waDelivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Confirmación de lectura:</span>
              <span className="font-bold text-sky-600 font-mono">{waReadRate}% ({waRead.toLocaleString()})</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Costo registrado:</span>
              <span className="font-bold text-slate-800 font-mono">${waCost.toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* SMS Channel Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rendimiento: SMS Masivo</h3>
                <p className="text-xs text-slate-500">Actividad registrada por SMS</p>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-1 rounded-full">
              {smsDeliveryPct}% Entrega
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mensajes despachados:</span>
              <span className="font-bold text-slate-800 font-mono">{smsSent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Entregados con éxito:</span>
              <span className="font-bold text-blue-600 font-mono">{smsDelivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mensajes fallidos:</span>
              <span className="font-bold text-rose-600 font-mono">{smsFailed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Costo registrado:</span>
              <span className="font-bold text-slate-800 font-mono">${smsCost.toFixed(2)} USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Diagnostics Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Diagnóstico de Motivos de Fallo</h3>
            <p className="text-xs text-slate-500">Análisis para depuración preventiva del directorio de contactos</p>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
            Total fallidos: {totalFallidos}
          </span>
        </div>

        <div className="space-y-3">
          {failureReasons.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No hay mensajes fallidos registrados.</p>
          ) : failureReasons.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-800">{item.motivo}</span>
                <span className="font-mono text-slate-600 font-bold">{item.count} casos ({item.pct}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
