import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle,
  X
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { storageService } from '../../services/storageService';

interface UsersManagementViewProps {
  currentUser: User;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('operador');
  const [cargo, setCargo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setUserToEdit(null);
    setNombre('');
    setEmail('');
    setRol('operador');
    setCargo('Coordinador de Difusión');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setUserToEdit(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setRol(u.rol);
    setCargo(u.cargo || '');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim() || !email.trim()) {
      setErrorMsg('Por favor complete el nombre y correo electrónico.');
      return;
    }

    const newUser: User = {
      id: userToEdit ? userToEdit.id : `usr-${Date.now().toString().slice(-4)}`,
      nombre: nombre.trim(),
      email: email.trim(),
      rol,
      estado: userToEdit ? userToEdit.estado : 'activo',
      activo: userToEdit ? (userToEdit.activo ?? (userToEdit.estado === 'activo')) : true,
      cargo: cargo.trim() || undefined,
      creadoEn: userToEdit ? userToEdit.creadoEn : new Date().toISOString(),
      ultimoAcceso: userToEdit ? userToEdit.ultimoAcceso : 'Pendiente primer ingreso',
    };

    storageService.saveUser(newUser, currentUser);
    setUsers(storageService.getUsers());
    setShowAddModal(false);
  };

  const handleToggleActive = (u: User) => {
    if (u.id === currentUser.id) {
      alert('No puede desactivar su propia cuenta activa.');
      return;
    }
    const updated: User = { ...u, activo: !u.activo };
    storageService.saveUser(updated, currentUser);
    setUsers(storageService.getUsers());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestión de Usuarios y Roles</h1>
          <p className="text-xs text-slate-500">
            Control de acceso basado en roles (RBAC) con permisos estrictos de operador y auditor
          </p>
        </div>

        {currentUser.rol === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#0C2A5A] hover:bg-[#123875] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Agregar Usuario</span>
          </button>
        )}
      </div>

      {/* RBAC Permission Matrix Reference */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Matriz de Permisos por Rol:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
            <span className="font-bold text-[#0C2A5A] block">Administrador</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Control total: Crear/enviar campañas masivas, gestión de contactos y bajas, configuración de claves Twilio, auditoría de seguridad y gestión de usuarios.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block">Operador</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Creación y despacho de campañas por WhatsApp y SMS, alta de contactos, gestión de segmentos y consulta de reportes. Sin acceso a claves API ni usuarios.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block">Consulta (Auditor)</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Acceso exclusivo de solo lectura a estadísticas, directorios de contactos, historial y registros de auditoría. Acciones de envío y edición bloqueadas.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C2A5A] text-slate-200 uppercase font-semibold text-[10px] tracking-wider border-b border-blue-900">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-3">Rol Asignado</th>
                <th className="py-3 px-3">Cargo Institucional</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-4">Último Acceso</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-700">
                    {u.email}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      u.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.rol === 'operador' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.rol === 'admin' ? 'Administrador' : u.rol === 'operador' ? 'Operador' : 'Consulta'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    {u.cargo || 'Funcionario'}
                  </td>

                  <td className="py-3 px-3">
                    {u.activo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {u.ultimoAcceso || 'Reciente'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {currentUser.rol === 'admin' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Editar usuario"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            u.activo 
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {u.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {userToEdit ? 'Editar Usuario' : 'Nuevo Usuario de la Plataforma'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Sofía Hernández"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@conectamasivo.demo"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Institucional</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  placeholder="Ej. Especialista de Comunicación"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol de Seguridad (RBAC) *</label>
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  <option value="admin">Administrador (Acceso Completo)</option>
                  <option value="operador">Operador (Campañas y Contactos)</option>
                  <option value="consulta">Consulta (Solo Lectura y Auditoría)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0C2A5A] text-white font-bold rounded-lg hover:bg-blue-900"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
