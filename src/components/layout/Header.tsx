import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  Bell, 
  ExternalLink
} from 'lucide-react';
import { User } from '../../types';
import { ActiveView } from './Sidebar';

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

  const viewInfo = VIEW_TITLES[currentView] || { title: 'Conecta Masivo', subtitle: 'Plataforma de difusión' };


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

      {/* Notifications Drawer/Popover */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotificationModal(false)}>
          <div 
            className="absolute top-16 right-4 lg:right-8 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-top-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="text-xs font-bold text-slate-800">Alertas Operativas</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <p className="text-[11px] text-slate-500">No hay notificaciones nuevas.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
