import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Send, 
  History, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  UserCircle, 
  LogOut, 
  Sparkles,
  ChevronRight,
  Radio,
  FileCheck2
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { storageService } from '../../services/storageService';

export type ActiveView = 
  | 'dashboard' 
  | 'contactos' 
  | 'contacto_detalle' 
  | 'segmentos' 
  | 'campanas' 
  | 'nueva_campana' 
  | 'campana_detalle' 
  | 'historial' 
  | 'reportes' 
  | 'usuarios' 
  | 'configuracion' 
  | 'perfil';

interface SidebarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView, extraId?: string) => void;
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (role: UserRole) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  onSwitchUser,
  onCloseMobile,
}) => {
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(() => storageService.getSettings().logoDataUrl);

  useEffect(() => storageService.subscribe(() => setLogoDataUrl(storageService.getSettings().logoDataUrl)), []);
  const isSelected = (view: ActiveView) => {
    if (view === 'campanas' && (currentView === 'nueva_campana' || currentView === 'campana_detalle')) {
      return true;
    }
    if (view === 'contactos' && currentView === 'contacto_detalle') {
      return true;
    }
    return currentView === view;
  };

  const navItem = (view: ActiveView, label: string, Icon: React.ElementType, badge?: string) => {
    const active = isSelected(view);
    return (
      <button
        key={view}
        id={`nav-item-${view}`}
        onClick={() => {
          onNavigate(view);
          if (onCloseMobile) onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active
            ? 'bg-blue-600/15 text-blue-400 font-semibold shadow-xs'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>{label}</span>
        </div>
        {badge ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
            {badge}
          </span>
        ) : active ? (
          <ChevronRight className="w-3.5 h-3.5 text-blue-400 opacity-80" />
        ) : null}
      </button>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Administrador</span>;
      case 'operador':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Operador</span>;
      case 'consulta':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Consulta</span>;
    }
  };

  return (
    <aside className="w-68 h-full bg-[#0C2A5A] text-slate-100 flex flex-col border-r border-blue-950/60 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-blue-900/40">
        <div className="h-20 w-full cursor-pointer" onClick={() => onNavigate('dashboard')} aria-label="Inicio">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="Logo de la organización" className="h-full w-full object-contain object-left" />
          ) : (
            <div className="h-full w-full rounded-xl border border-dashed border-blue-400/40 bg-blue-950/30" aria-label="Logo no configurado" />
          )}
        </div>

        {/* Live Mode Indicator */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800/40 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200 font-medium">Modo Demo Activo</span>
          </div>
          <span className="text-blue-300 font-semibold">800 sims</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] uppercase tracking-wider font-bold text-blue-300/60 px-3 pb-1">
          Operación Principal
        </div>
        {navItem('dashboard', 'Dashboard', LayoutDashboard)}
        {navItem('contactos', 'Contactos', Users)}
        {navItem('segmentos', 'Segmentos', Layers)}
        {navItem('campanas', 'Campañas', Send)}
        {navItem('historial', 'Historial de envíos', History)}
        {navItem('reportes', 'Reportes', BarChart3)}

        {/* Admin Section */}
        {currentUser.rol === 'admin' && (
          <>
            <div className="pt-4 text-[10px] uppercase tracking-wider font-bold text-blue-300/60 px-3 pb-1">
              Administración
            </div>
            {navItem('usuarios', 'Usuarios & Roles', ShieldCheck)}
            {navItem('configuracion', 'Configuración', Settings)}
          </>
        )}

        <div className="pt-4 text-[10px] uppercase tracking-wider font-bold text-blue-300/60 px-3 pb-1">
          Cuenta
        </div>
        {navItem('perfil', 'Mi Perfil', UserCircle)}
      </nav>

      {/* Demo Quick Role Switcher (Convenient for Reviewer) */}
      <div className="px-3.5 py-3 bg-[#081F42] border-t border-blue-900/40">
        <div className="text-[10px] font-semibold text-blue-300/70 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Cambiar Rol Demo:</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <button
            onClick={() => onSwitchUser('admin')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              currentUser.rol === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-950/60 text-slate-300 hover:bg-blue-900/50'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => onSwitchUser('operador')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              currentUser.rol === 'operador'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-950/60 text-slate-300 hover:bg-blue-900/50'
            }`}
          >
            Operador
          </button>
          <button
            onClick={() => onSwitchUser('consulta')}
            className={`py-1 rounded text-center font-medium transition-colors ${
              currentUser.rol === 'consulta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-950/60 text-slate-300 hover:bg-blue-900/50'
            }`}
          >
            Consulta
          </button>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="p-3.5 bg-[#071936] border-t border-blue-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser.nombre.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser.nombre.split(' ')[0]}</p>
            <div className="mt-0.5">{getRoleBadge(currentUser.rol)}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
