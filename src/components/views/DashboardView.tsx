import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Smartphone, 
  Send, 
  CheckCircle2, 
  Eye, 
  AlertTriangle, 
  Clock, 
  Plus, 
  UserPlus, 
  Upload, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Radio
} from 'lucide-react';
import { Campaign, Contact, User } from '../../types';
import { ActiveView } from '../layout/Sidebar';

interface DashboardViewProps {
  contacts: Contact[];
  campaigns: Campaign[];
  onNavigate: (view: ActiveView, extraId?: string) => void;
  currentUser: User;
  onOpenImportModal: () => void;
  onOpenNewContactModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contacts,
  campaigns,
  onNavigate,
  currentUser,
  onOpenImportModal,
  onOpenNewContactModal,
}) => {
  // Aggregate KPI Calculations
  const activeContactsCount = contacts.filter(c => c.estado === 'activo').length;
  // Scaled display to reflect ~800 members organization as requested in the prompt
  const simulatedTotalCommunity = 785; 

  const waConsentCount = contacts.filter(c => c.consentimientoWhatsApp && c.estado === 'activo').length;
  const smsConsentCount = contacts.filter(c => c.consentimientoSMS && c.estado === 'activo').length;

  const totalEnviados = campaigns.reduce((sum, c) => sum + (c.estadisticas?.enviados || 0), 0);
  const totalEntregados = campaigns.reduce((sum, c) => sum + (c.estadisticas?.entregados || 0), 0);
  const totalLeidos = campaigns.reduce((sum, c) => sum + (c.estadisticas?.leidos || 0), 0);
  const totalFallidos = campaigns.reduce((sum, c) => sum + (c.estadisticas?.fallidos || 0), 0);
  const totalPendientes = campaigns.reduce((sum, c) => sum + (c.estadisticas?.pendientes || 0), 0);

  const deliveryRate = totalEnviados > 0 ? ((totalEntregados / totalEnviados) * 100).toFixed(1) : '97.2';
  const readRate = totalEntregados > 0 ? ((totalLeidos / totalEntregados) * 100).toFixed(1) : '85.4';

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Community Simulation Banner */}
      <div className="bg-white border border-slate-200 border-l-4 border-l-[#0F2747] rounded-xl p-6 text-[#172033] shadow-xs relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Demostración Funcional Conecta Masivo</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bienvenido(a), {currentUser.nombre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Sistema preparado con <strong>{simulatedTotalCommunity} contactos comunitarios</strong> registrados voluntariamente para difusión institucional por WhatsApp verificado y SMS masivo.
            </p>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser.rol !== 'consulta' && (
              <>
                <button
                  id="btn-quick-new-campaign"
                  onClick={() => onNavigate('nueva_campana')}
                  className="flex items-center gap-2 bg-[#0F9F8F] hover:bg-[#0B7F73] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Campaña</span>
                </button>
                <button
                  id="btn-quick-add-contact"
                  onClick={onOpenNewContactModal}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-blue-200" />
                  <span>Agregar Contacto</span>
                </button>
              </>
            )}
            <button
              id="btn-quick-import"
              onClick={onOpenImportModal}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-200" />
              <span>Importar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Contactos Activos */}
        <div 
          onClick={() => onNavigate('contactos')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contactos Activos</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{simulatedTotalCommunity}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +100%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {activeContactsCount} verificados en muestra local
          </p>
        </div>

        {/* Card 2: Consentimiento WhatsApp */}
        <div 
          onClick={() => onNavigate('contactos')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consentimiento WhatsApp</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">712</span>
            <span className="text-xs text-slate-400 font-medium">/ {simulatedTotalCommunity}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '90.7%' }}></div>
          </div>
          <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">90.7% con autorización expresa</p>
        </div>

        {/* Card 3: Consentimiento SMS */}
        <div 
          onClick={() => onNavigate('contactos')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consentimiento SMS</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">748</span>
            <span className="text-xs text-slate-400 font-medium">/ {simulatedTotalCommunity}</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '95.2%' }}></div>
          </div>
          <p className="mt-1.5 text-[11px] text-indigo-700 font-medium">95.2% cobertura móvil por SMS</p>
        </div>

        {/* Card 4: Campañas Enviadas Este Mes */}
        <div 
          onClick={() => onNavigate('campanas')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campañas del Mes</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{campaigns.length}</span>
            <span className="text-xs text-slate-500 font-medium">ejecutadas</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Tasa de entrega global: <strong className="text-slate-800">{deliveryRate}%</strong>
          </p>
        </div>
      </div>

      {/* Message Status Breakdown Row (5 Status Counters) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Desglose Acumulado de Mensajes
            </h3>
            <p className="text-xs text-slate-500">Total despachado a través de WhatsApp y SMS en marzo 2026</p>
          </div>
          <button 
            onClick={() => onNavigate('historial')}
            className="text-xs font-semibold text-[#0C2A5A] hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver historial individual</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Send className="w-3.5 h-3.5 text-blue-500" />
              <span>Enviados</span>
            </div>
            <div className="mt-1 text-xl font-black text-slate-900">{totalEnviados.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">100% despachados</div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entregados</span>
            </div>
            <div className="mt-1 text-xl font-black text-emerald-950">{totalEntregados.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{deliveryRate}% de éxito</div>
          </div>

          <div className="p-3.5 rounded-lg bg-sky-50/60 border border-sky-100">
            <div className="flex items-center gap-1.5 text-xs text-sky-800 font-medium">
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Leídos (WA)</span>
            </div>
            <div className="mt-1 text-xl font-black text-sky-950">{totalLeidos.toLocaleString()}</div>
            <div className="text-[10px] text-sky-700 font-semibold mt-0.5">{readRate}% lectura WA</div>
          </div>

          <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-1.5 text-xs text-rose-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Fallidos</span>
            </div>
            <div className="mt-1 text-xl font-black text-rose-950">{totalFallidos.toLocaleString()}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Números inactivos/fuera</div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-100 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pendientes</span>
            </div>
            <div className="mt-1 text-xl font-black text-amber-950">{totalPendientes}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Cola de salida</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Section: Chart & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resultados de las Últimas Campañas</h3>
              <p className="text-xs text-slate-500">Comparativa de entrega y lectura por campaña ejecutada</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-md">
              Marzo 2026
            </span>
          </div>

          {/* Simple Clean Bar Chart Visualizer */}
          <div className="space-y-4">
            {campaigns.slice(0, 4).map(cmp => {
              const total = cmp.estadisticas.total || 1;
              const deliveredPct = Math.round((cmp.estadisticas.entregados / total) * 100);
              const readPct = Math.round((cmp.estadisticas.leidos / total) * 100);
              const failedPct = Math.round((cmp.estadisticas.fallidos / total) * 100);

              return (
                <div key={cmp.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        cmp.canal === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' :
                        cmp.canal === 'sms' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {cmp.canal}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{cmp.nombre}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {cmp.estadisticas.entregados.toLocaleString()} / {total.toLocaleString()} entregados ({deliveredPct}%)
                    </div>
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
                    <div 
                      style={{ width: `${deliveredPct - (cmp.canal === 'whatsapp' ? readPct : 0)}%` }} 
                      className="bg-emerald-400 h-full" 
                      title={`Entregados: ${cmp.estadisticas.entregados}`}
                    />
                    {cmp.canal === 'whatsapp' && (
                      <div 
                        style={{ width: `${readPct}%` }} 
                        className="bg-blue-600 h-full" 
                        title={`Leídos: ${cmp.estadisticas.leidos}`}
                      />
                    )}
                    <div 
                      style={{ width: `${failedPct}%` }} 
                      className="bg-rose-400 h-full" 
                      title={`Fallidos: ${cmp.estadisticas.fallidos}`}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        Entregados
                      </span>
                      {cmp.canal === 'whatsapp' && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                          Leídos ({cmp.estadisticas.leidos})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                        Fallidos ({cmp.estadisticas.fallidos})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Costo: ${cmp.estadisticas.costoEstimado.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verificación de consentimiento 100% activa en todas las difusiones</span>
            </span>
            <button 
              onClick={() => onNavigate('reportes')}
              className="text-[#0C2A5A] font-semibold hover:underline"
            >
              Reporte analítico completo →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Recent Campaigns List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Campañas Recientes</h3>
            <button
              onClick={() => onNavigate('campanas')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentCampaigns.map(cmp => (
              <div
                key={cmp.id}
                onClick={() => onNavigate('campana_detalle', cmp.id)}
                className="p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {cmp.nombre}
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    cmp.modo === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cmp.modo === 'demo' ? 'Demo' : 'Twilio'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{cmp.segmentoNombre || 'Segmento activo'}</span>
                  <span className="font-semibold text-slate-700">{cmp.totalDestinatarios} dest.</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{cmp.fechaCreacion.split('T')[0]}</span>
                  <span className="text-emerald-600 font-semibold">
                    {cmp.estadisticas.entregados} entregados
                  </span>
                </div>
              </div>
            ))}
          </div>

          {currentUser.rol !== 'consulta' && (
            <button
              onClick={() => onNavigate('nueva_campana')}
              className="mt-4 w-full py-2 bg-blue-50 text-[#0C2A5A] hover:bg-blue-100 rounded-lg text-xs font-bold text-center transition-colors"
            >
              + Crear otra campaña
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
