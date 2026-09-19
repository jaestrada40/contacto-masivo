export type UserRole = 'admin' | 'operador' | 'consulta';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  estado: 'activo' | 'inactivo';
  activo?: boolean;
  cargo?: string;
  ultimoAcceso?: string;
  creadoEn: string;
  avatarUrl?: string;
}

export type ContactStatus = 'activo' | 'inactivo' | 'bloqueado';

export interface Contact {
  id: string;
  nombres: string;
  apellidos: string;
  dpi: string;
  telefono: string; // e.g., +502 5555 1234
  email: string;
  departamento: string;
  zona: string;
  grupo: string;
  fechaRegistro: string;
  consentimientoWhatsApp: boolean;
  consentimientoSMS: boolean;
  estado: ContactStatus;
  fechaConsentimiento: string;
  fuenteConsentimiento: string;
  fechaBaja?: string;
  motivoBaja?: string;
  esNumeroPruebaTwilio: boolean;
  notas?: string;
}

export interface Segment {
  id: string;
  nombre: string;
  descripcion: string;
  criterio: {
    soloActivos?: boolean;
    zona?: string;
    grupo?: string;
    soloWhatsApp?: boolean;
    soloSMS?: boolean;
    sinCampanaUltimos30Dias?: boolean;
    soloPruebaTwilio?: boolean;
  };
  colorTag: string;
}

export type CampaignType = 'recordatorio' | 'aviso' | 'informativa' | 'promocion' | 'urgente';
export type CampaignChannel = 'whatsapp' | 'sms' | 'ambos';
export type CampaignMode = 'demo' | 'twilio_test';
export type CampaignStatus = 'borrador' | 'programada' | 'enviando' | 'completada' | 'cancelada' | 'fallida';

export interface CampaignStats {
  total: number;
  enviados: number;
  entregados: number;
  leidos: number;
  fallidos: number;
  pendientes: number;
  costoEstimado: number;
}

export interface Campaign {
  id: string;
  nombre: string;
  tipo: CampaignType;
  canal: CampaignChannel;
  programacion: 'ahora' | 'programado';
  fechaProgramada?: string;
  segmentoId?: string;
  segmentoNombre?: string;
  destinatariosIds: string[];
  totalDestinatarios: number;
  mensaje: string;
  plantillaWhatsApp?: string;
  modo: CampaignMode;
  estado: CampaignStatus;
  estadisticas: CampaignStats;
  creadoPor: string;
  creadorNombre: string;
  fechaCreacion: string;
  fechaInicioEnvio?: string;
  fechaFinEnvio?: string;
}

export type MessageDeliveryStatus = 
  | 'pendiente' 
  | 'en_cola' 
  | 'enviado' 
  | 'entregado' 
  | 'leido' 
  | 'fallido' 
  | 'cancelado';

export interface MessageLog {
  id: string;
  fechaHora: string;
  contactoId: string;
  contactoNombre: string;
  contactoTelefono: string;
  telefono?: string; // optional alias
  campanaId: string;
  campanaNombre: string;
  canal: 'whatsapp' | 'sms';
  mensajeTexto: string;
  plantillaUtilizada?: string;
  estado: MessageDeliveryStatus;
  motivoError?: string;
  error?: string; // optional alias
  costoEstimado: number;
  proveedorId: string; // e.g. SMxxxxxxxxxxxx or WAxxxxxxxx
  modo: CampaignMode;
}

export interface AuditLog {
  id: string;
  fechaHora: string;
  timestamp?: string; // alias
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: UserRole;
  accion: string;
  entidad: string;
  entidadAfectada?: string; // alias
  detalles: string;
}

export interface AppSettings {
  nombreOrganizacion: string;
  logoDataUrl?: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumberWhatsApp: string;
  twilioPhoneNumberSms: string;
  mensajeOptOutTexto: string;
  horarioPermitidoInicio: string;
  horarioPermitidoFin: string;
  costoWhatsAppUtilityMil: number;
  costoSmsMil: number;
}

export interface OrganizationSettings {
  nombre: string;
  logoTexto: string;
  logoDataUrl?: string;
  correoSoporte: string;
  telefonoSoporte: string;
  sitioWeb: string;
  twilioConfigured: boolean;
  twilioAccountSidMasked: string;
  twilioWhatsAppFrom: string;
  twilioSmsFrom: string;
  costoWhatsAppUtilityMil: number; // USD per 1000
  costoWhatsAppMarketingMil: number;
  costoSmsMil: number;
  alertaCostoUmbral: number; // Alert if cost exceeds this USD
  horarioPermitidoInicio: string; // "08:00"
  horarioPermitidoFin: string; // "20:00"
  permitirEnviosFindeSemana: boolean;
}

export interface WhatsAppApprovedTemplate {
  id: string;
  nombre: string;
  categoria: 'UTILITY' | 'MARKETING';
  titulo: string;
  cuerpo: string;
  variables: string[];
  idioma: string;
}
