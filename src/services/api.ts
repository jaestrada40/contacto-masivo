import { Campaign, Contact, MessageLog, Segment, User, UserRole } from '../types';
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const tokenKey = 'conecta_masivo_access_token';
export const api = {
  token: () => localStorage.getItem(tokenKey),
  setToken: (token?: string) => token ? localStorage.setItem(tokenKey, token) : localStorage.removeItem(tokenKey),
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(api.token() ? { Authorization: `Bearer ${api.token()}` } : {}), ...options.headers } });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.message || 'No fue posible completar la solicitud'); }
    return response.status === 204 ? undefined as T : response.json();
  },
  login: (email: string, password: string) => api.request<{ accessToken: string; user: unknown }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  mfaSetup: (mfaToken: string) => api.request<{ secret: string; periodSeconds: number }>('/auth/mfa/setup', { method: 'POST', body: JSON.stringify({ mfaToken }) }),
  mfaActivate: (mfaToken: string, code: string) => api.request<{ accessToken: string; user: unknown }>('/auth/mfa/activate', { method: 'POST', body: JSON.stringify({ mfaToken, code }) }),
  mfaVerify: (mfaToken: string, code: string) => api.request<{ accessToken: string; user: unknown }>('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ mfaToken, code }) }),
  me: () => api.request<unknown>('/auth/me'),
  contacts: () => api.request<{ data: unknown[] }>('/contacts?limit=100').then(r => r.data.map(toContact)),
  segments: () => api.request<unknown[]>('/segments').then(items => items.map(toSegment)),
  campaigns: () => api.request<unknown[]>('/campaigns').then(items => items.map(toCampaign)),
  messages: () => api.request<unknown[]>('/messages').then(items => items.map(toMessage)),
  users: () => api.request<unknown[]>('/users').then(items => items.map(toUser)),
  createUser: (data: { name: string; email: string; password: string; role: UserRole }) => api.request<unknown>('/users', { method: 'POST', body: JSON.stringify({ ...data, role: toApiRole(data.role) }) }).then(toUser),
  updateUser: (id: string, data: { name: string; email: string; role: UserRole }) => api.request<unknown>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ ...data, role: toApiRole(data.role) }) }).then(toUser),
  updateUserStatus: (id: string, isActive: boolean) => api.request<unknown>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }).then(toUser),
  resetUserMfa: (id: string) => api.request<unknown>(`/users/${id}/mfa/reset`, { method: 'POST' }).then(toUser),
  settings: () => api.request<unknown>('/settings'),
  mfaEnforcement: (mfaEnforced: boolean) => api.request<{ mfaEnforced: boolean }>('/users/mfa/enforcement', { method: 'PATCH', body: JSON.stringify({ mfaEnforced }) }),
  createContact: (data: unknown) => api.request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
};
const role = (value: string) => value === 'ADMIN' ? 'admin' : value === 'OPERATOR' ? 'operador' : 'consulta';
const toApiRole = (value: UserRole) => value === 'admin' ? 'ADMIN' : value === 'operador' ? 'OPERATOR' : 'VIEWER';
export function toUser(value: any): User { return { id:value.id, nombre:value.name, email:value.email, rol:role(value.role), estado:value.isActive?'activo':'inactivo', activo:value.isActive, mfaHabilitado:Boolean(value.mfaEnabled), ultimoAcceso:value.lastLoginAt || undefined, creadoEn:value.createdAt }; }
export function toContact(value: any): Contact { return { id:value.id,nombres:value.firstName,apellidos:value.lastName,dpi:value.documentId||'',telefono:value.phone,email:value.email||'',departamento:value.departmentOrZone||'',zona:value.departmentOrZone||'',grupo:value.groupName||'',fechaRegistro:value.createdAt,consentimientoWhatsApp:value.whatsappOptIn,consentimientoSMS:value.smsOptIn,estado:value.status==='ACTIVE'?'activo':value.status==='BLOCKED'?'bloqueado':'inactivo',fechaConsentimiento:value.consentAt||'',fuenteConsentimiento:value.consentSource||'',fechaBaja:value.optOutAt||undefined,esNumeroPruebaTwilio:value.isTwilioTestNumber }; }
export function toSegment(value: any): Segment { const f=value.filters||{}; return { id:value.id,nombre:value.name,descripcion:value.description||'',criterio:{soloActivos:f.status==='ACTIVE'||true,zona:f.zone,grupo:f.group,soloWhatsApp:f.whatsappOptIn,soloSMS:f.smsOptIn,soloPruebaTwilio:f.isTwilioTestNumber},colorTag:'blue' }; }
export function toCampaign(value: any): Campaign { const count=value._count?.recipients||value.estimatedRecipients||0; return {id:value.id,nombre:value.name,tipo:({REMINDER:'recordatorio',NOTICE:'aviso',INFORMATIONAL:'informativa',PROMOTION:'promocion',URGENT:'urgente'} as any)[value.type],canal:({WHATSAPP:'whatsapp',SMS:'sms',BOTH:'ambos'} as any)[value.channel],programacion:value.scheduledAt?'programado':'ahora',fechaProgramada:value.scheduledAt,segmentoId:value.segmentId,segmentoNombre:value.segment?.name,destinatariosIds:[],totalDestinatarios:value.estimatedRecipients||count,mensaje:value.message,plantillaWhatsApp:value.whatsappTemplate,modo:value.executionMode==='TWILIO_TEST'?'twilio_test':'demo',estado:({DRAFT:'borrador',SCHEDULED:'programada',PROCESSING:'enviando',COMPLETED:'completada',CANCELLED:'cancelada',FAILED:'fallida'} as any)[value.status],estadisticas:{total:count,enviados:count,entregados:0,leidos:0,fallidos:0,pendientes:0,costoEstimado:Number(value.estimatedCost||0)},creadoPor:value.createdById,creadorNombre:value.createdBy?.name||'',fechaCreacion:value.createdAt,fechaInicioEnvio:value.sentAt}; }
export function toMessage(value: any): MessageLog { return {id:value.id,fechaHora:value.createdAt,contactoId:value.contactId,contactoNombre:`${value.contact?.firstName||''} ${value.contact?.lastName||''}`.trim(),contactoTelefono:value.contact?.phone||'',campanaId:value.campaignId,campanaNombre:value.campaign?.name||'',canal:value.channel==='SMS'?'sms':'whatsapp',mensajeTexto:value.renderedMessage,estado:({PENDING:'pendiente',QUEUED:'en_cola',SENT:'enviado',DELIVERED:'entregado',READ:'leido',FAILED:'fallido',CANCELLED:'cancelado',SIMULATED:'enviado'} as any)[value.status],motivoError:value.errorMessage,costoEstimado:Number(value.estimatedCost||0),proveedorId:value.providerMessageId||'SIMULATED',modo:value.campaign?.executionMode==='TWILIO_TEST'?'twilio_test':'demo'}; }
