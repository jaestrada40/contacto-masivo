import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  LogOut,
  Bell
} from 'lucide-react';
import { User } from '../../types';
import { authService } from '../../services/authService';

interface ProfileViewProps {
  currentUser: User;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout }) => {
  const [nombre, setNombre] = useState(currentUser.nombre);
  const [cargo, setCargo] = useState(currentUser.cargo || 'Funcionario');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [statusMsg, setStatusMsg] = useState<{ success?: boolean; text?: string } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword) {
      if (newPassword.length < 6) {
        setStatusMsg({ success: false, text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMsg({ success: false, text: 'Las contraseñas no coinciden.' });
        return;
      }
    }

    setStatusMsg({ success: true, text: 'Perfil institucional actualizado satisfactoriamente.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Perfil de Usuario</h1>
        <p className="text-xs text-slate-500">Gestione sus credenciales de acceso y datos de sesión activa</p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
          statusMsg.success 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0C2A5A] text-white font-extrabold text-xl flex items-center justify-center shadow-md">
          {currentUser.nombre.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{currentUser.nombre}</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
              Rol: {currentUser.rol}
            </span>
          </div>
          <p className="text-xs text-slate-500">{currentUser.email}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Último acceso registrado: {currentUser.ultimoAcceso || 'Hoy'}</span>
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-2 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Datos Personales y Seguridad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cargo Institucional</label>
            <input
              type="text"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico (No modificable)</label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="font-bold text-slate-900 mb-3">Actualizar Contraseña</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco para conservar la actual"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Actualizar Perfil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
