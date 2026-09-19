import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, KeyRound, Plus, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';

interface UsersManagementViewProps { currentUser: User; }

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<UserRole>('operador');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true); setErrorMsg('');
    try { setUsers(await api.users()); } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'No fue posible cargar los usuarios.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadUsers(); }, []);

  const openAdd = () => { setUserToEdit(null); setNombre(''); setEmail(''); setPassword(''); setRol('operador'); setErrorMsg(''); setShowModal(true); };
  const openEdit = (user: User) => { setUserToEdit(user); setNombre(user.nombre); setEmail(user.email); setPassword(''); setRol(user.rol); setErrorMsg(''); setShowModal(true); };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault(); setErrorMsg('');
    if (!nombre.trim() || !email.trim() || (!userToEdit && password.length < 8)) { setErrorMsg(userToEdit ? 'Complete el nombre y correo electrónico.' : 'Complete nombre, correo y una contraseña de al menos 8 caracteres.'); return; }
    setSaving(true);
    try {
      const updated = userToEdit
        ? await api.updateUser(userToEdit.id, { name: nombre.trim(), email: email.trim(), role: rol })
        : await api.createUser({ name: nombre.trim(), email: email.trim(), password, role: rol });
      setUsers(previous => userToEdit ? previous.map(user => user.id === updated.id ? updated : user) : [updated, ...previous]);
      setMessage(userToEdit ? 'Usuario actualizado.' : 'Usuario creado.'); setShowModal(false);
    } catch (error) { setErrorMsg(error instanceof Error ? error.message : 'No fue posible guardar el usuario.'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (user: User) => {
    if (user.id === currentUser.id && user.activo) { setErrorMsg('No puede desactivar su propia cuenta.'); return; }
    setErrorMsg('');
    try { const updated = await api.updateUserStatus(user.id, !user.activo); setUsers(previous => previous.map(item => item.id === updated.id ? updated : item)); setMessage(updated.activo ? 'Usuario reactivado.' : 'Usuario desactivado.'); }
    catch (error) { setErrorMsg(error instanceof Error ? error.message : 'No fue posible actualizar el estado.'); }
  };

  const resetMfa = async (user: User) => {
    if (!window.confirm(`¿Restablecer MFA de ${user.nombre}? Deberá configurarlo nuevamente en su próximo inicio de sesión.`)) return;
    setErrorMsg('');
    try { const updated = await api.resetUserMfa(user.id); setUsers(previous => previous.map(item => item.id === updated.id ? updated : item)); setMessage(`MFA restablecido para ${user.nombre}.`); }
    catch (error) { setErrorMsg(error instanceof Error ? error.message : 'No fue posible restablecer MFA.'); }
  };

  if (currentUser.rol !== 'admin') return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Solo un administrador puede gestionar usuarios.</div>;

  return <div className="space-y-6 pb-12">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-bold text-slate-900">Gestión de Usuarios y Roles</h1><p className="text-xs text-slate-500">Cuentas reales, roles, estado y autenticación multifactor.</p></div><div className="flex gap-2"><button onClick={() => void loadUsers()} className="rounded-lg border border-slate-200 p-2 text-slate-600" title="Actualizar"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-[#0C2A5A] px-3.5 py-2 text-xs font-bold text-white"><Plus className="w-4 h-4" />Agregar usuario</button></div></div>
    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{message}</div>}
    {errorMsg && <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#0C2A5A] text-[10px] uppercase tracking-wider text-slate-200"><tr><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">MFA</th><th className="p-3">Último acceso</th><th className="p-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={6} className="p-6 text-center text-slate-500">Cargando usuarios…</td></tr> : users.map(user => <tr key={user.id}><td className="p-3"><p className="font-bold text-slate-900">{user.nombre}</p><p className="font-mono text-[10px] text-slate-500">{user.email}</p></td><td className="p-3 capitalize">{user.rol === 'consulta' ? 'Consulta' : user.rol}</td><td className="p-3">{user.activo ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />Activo</span> : <span className="inline-flex items-center gap-1 text-rose-700"><XCircle className="w-3.5 h-3.5" />Inactivo</span>}</td><td className="p-3">{user.mfaHabilitado ? <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" />Configurado</span> : <span className="text-slate-500">Pendiente</span>}</td><td className="p-3 text-slate-500">{user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString() : 'Sin acceso'}</td><td className="p-3"><div className="flex justify-end gap-1"><button onClick={() => openEdit(user)} title="Editar usuario" className="rounded p-1.5 text-slate-600 hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button><button onClick={() => void resetMfa(user)} title="Restablecer MFA" className="rounded p-1.5 text-amber-700 hover:bg-amber-50"><KeyRound className="w-4 h-4" /></button><button onClick={() => void toggleStatus(user)} className="rounded px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">{user.activo ? 'Desactivar' : 'Reactivar'}</button></div></td></tr>)}</tbody></table></div></div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{userToEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div><form onSubmit={saveUser} className="space-y-4 text-xs"><label className="block font-semibold">Nombre<input required value={nombre} onChange={event => setNombre(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label><label className="block font-semibold">Correo electrónico<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label>{!userToEdit && <label className="block font-semibold">Contraseña inicial<input required type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label>}<label className="block font-semibold">Rol<select value={rol} onChange={event => setRol(event.target.value as UserRole)} className="mt-1 w-full rounded-lg border border-slate-200 p-2"><option value="admin">Administrador</option><option value="operador">Operador</option><option value="consulta">Consulta</option></select></label><div className="flex justify-end gap-2 border-t pt-3"><button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-3 py-2">Cancelar</button><button disabled={saving} className="rounded-lg bg-[#0C2A5A] px-3 py-2 font-bold text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar'}</button></div></form></div></div>}
  </div>;
};
