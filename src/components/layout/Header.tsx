import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  Bell, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { User } from '../../types';
import { ActiveView } from './Sidebar';
import { storageService } from '../../services/storageService';

interface HeaderProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenMobileNav: () => void;
  currentUser: User;
}

const VIEW_TITLES: Record<ActiveView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard General', subtitle: 'Métricas en tiempo real y resumen de campañas' },
  contactos: { title: 'Gestión de Contactos', subtitle: 'Administración de afiliados y consentimientos verificados' },
  contacto_detalle: { title: 'Ficha de Contacto', subtitle: 'Historial de consentimiento y mensajes enviados' },
  segmentos: { title: 'Segmentos Dinámicos', subtitle: 'Agrupaciones inteligentes según consentimientos y zonas' },
  campanas: { title: 'Campañas de Mensajería', subtitle: 'Control de difusiones masivas por WhatsApp y SMS' },
  nueva_campana: { title: 'Asistente de Nueva Campaña', subtitle: 'Paso a paso para crear y autorizar difusiones masivas' },
  campana_detalle: { title: 'Detalle de Resultados', subtitle: 'Métricas de entrega, lectura y registro de fallos' },
  historial: { title: 'Historial Individual de Envíos', subtitle: 'Trazabilidad y estados detallados de cada mensaje despachado' },
  reportes: { title: 'Reportes y Analítica', subtitle: 'Rendimiento comparativo, costos y tasas de efectividad' },
  usuarios: { title: 'Control de Usuarios y Roles', subtitle: 'Gestión de accesos, operadores y privilegios' },
  configuracion: { title: 'Configuración y Twilio', subtitle: 'Parámetros institucionales, costos y credenciales de API' },
  perfil: { title: 'Mi Perfil', subtitle: 'Información de la sesión activa y auditoría de acciones' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMobileNav,
  currentUser,
}) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const viewInfo = VIEW_TITLES[currentView] || { title: 'Conecta Masivo', subtitle: 'Plataforma de difusión' };

  const handleReset = () => {
    storageService.resetDemoData();
    setResetConfirm(false);
    onNavigate('dashboard');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile drawer trigger */}
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-[#0C2A5A] tracking-tight">{viewInfo.title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">{viewInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Reset Demo button for quick evaluation */}
        <button
          onClick={() => setResetConfirm(true)}
          title="Restablecer datos originales de demostración"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-[#0C2A5A] hover:bg-slate-50 font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Restablecer Demo</span>
        </button>

        {/* Sandbox Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Twilio Sandbox: <strong className="font-semibold">+1 415 523 8886</strong></span>
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => setShowNotificationModal(!showNotificationModal)}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notificaciones del sistema"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>

        {/* Action: New Campaign (if not in read-only role) */}
        {currentUser.rol !== 'consulta' && (
          <button
            id="btn-header-nueva-campana"
            onClick={() => onNavigate('nueva_campana')}
            className="flex items-center gap-2 bg-[#0F9F8F] hover:bg-[#0B7F73] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Nueva Campaña</span>
          </button>
        )}
      </div>

      {/* Reset confirmation modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              ¿Restablecer datos de prueba?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Esta acción recargará los 32 contactos de ejemplo, campañas históricas y registros de auditoría predeterminados.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-lg bg-[#0C2A5A] text-white text-xs font-semibold hover:bg-blue-900"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer/Popover */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotificationModal(false)}>
          <div 
            className="absolute top-16 right-4 lg:right-8 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-800">Alertas Operativas</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">3 Nuevas</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                <p className="font-semibold text-[11px]">Campaña Demo Completada</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">La difusión masiva de la Asamblea 2026 alcanzó un 96.1% de entrega efectiva.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-900">
                <p className="font-semibold text-[11px]">Modo Sandbox Activo</p>
                <p className="text-[10px] text-blue-700 mt-0.5">2 números autorizados para pruebas reales de Twilio disponibles en contactos.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-900">
                <p className="font-semibold text-[11px]">Baja Voluntaria Registrada</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Karla Beatriz Mendoza fue dada de baja de los envíos por consentimiento.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
