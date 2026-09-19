import { 
  Contact, 
  Campaign, 
  MessageLog, 
  Segment, 
  User, 
  OrganizationSettings, 
  AuditLog, 
  UserRole 
} from '../types';

const STORAGE_KEYS = {
  CONTACTS: 'conecta_masivo_contacts',
  CAMPAIGNS: 'conecta_masivo_campaigns',
  MESSAGES: 'conecta_masivo_messages',
  SEGMENTS: 'conecta_masivo_segments',
  USERS: 'conecta_masivo_users',
  SETTINGS: 'conecta_masivo_settings',
  AUDIT: 'conecta_masivo_audit',
};

class StorageService {
  private contacts: Contact[] = [];
  private campaigns: Campaign[] = [];
  private messageLogs: MessageLog[] = [];
  private segments: Segment[] = [];
  private users: User[] = [];
  private settings: OrganizationSettings = { nombre: '', logoTexto: '', correoSoporte: '', telefonoSoporte: '', sitioWeb: '', twilioConfigured: false, twilioAccountSidMasked: '', twilioWhatsAppFrom: '', twilioSmsFrom: '', costoWhatsAppUtilityMil: 0, costoWhatsAppMarketingMil: 0, costoSmsMil: 0, alertaCostoUmbral: 0, horarioPermitidoInicio: '08:00', horarioPermitidoFin: '20:00', permitirEnviosFindeSemana: false };
  private auditLogs: AuditLog[] = [];

  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      this.contacts = storedContacts ? JSON.parse(storedContacts) : [];

      const storedCampaigns = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      this.campaigns = storedCampaigns ? JSON.parse(storedCampaigns) : [];

      const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      this.messageLogs = storedMessages ? JSON.parse(storedMessages) : [];

      const storedSegments = localStorage.getItem(STORAGE_KEYS.SEGMENTS);
      this.segments = storedSegments ? JSON.parse(storedSegments) : [];

      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [];

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? JSON.parse(storedSettings) : this.settings;

      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [];
    } catch (e) {
      console.error('Error loading storage, initializing default data', e);
      this.resetDemoData();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- CONTACTS ---
  public getContacts(): Contact[] {
    return [...this.contacts];
  }

  public getContactById(id: string): Contact | undefined {
    return this.contacts.find(c => c.id === id);
  }

  public saveContact(contact: Contact, currentUser: User): void {
    const index = this.contacts.findIndex(c => c.id === contact.id);
    const isNew = index === -1;
    
    if (isNew) {
      this.contacts.unshift(contact);
      this.logAudit({
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioEmail: currentUser.email,
        usuarioRol: currentUser.rol,
        accion: 'CREAR_CONTACTO',
        entidad: `Contacto: ${contact.nombres} ${contact.apellidos} (${contact.telefono})`,
        detalles: `Registro de nuevo contacto con consentimiento WhatsApp: ${contact.consentimientoWhatsApp ? 'Sí' : 'No'}, SMS: ${contact.consentimientoSMS ? 'Sí' : 'No'}.`,
      });
    } else {
      this.contacts[index] = contact;
      this.logAudit({
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioEmail: currentUser.email,
        usuarioRol: currentUser.rol,
        accion: 'EDITAR_CONTACTO',
        entidad: `Contacto: ${contact.nombres} ${contact.apellidos} (${contact.id})`,
        detalles: `Actualización de ficha de contacto y consentimientos.`,
      });
    }

    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(this.contacts));
    this.notify();
  }

  public unsubscribeContact(id: string, motivo: string, currentUser: User): void {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) return;

    contact.estado = 'inactivo';
    contact.fechaBaja = new Date().toISOString().split('T')[0];
    contact.motivoBaja = motivo || 'Baja voluntaria solicitada';
    contact.consentimientoWhatsApp = false;
    contact.consentimientoSMS = false;

    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(this.contacts));

    this.logAudit({
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      usuarioEmail: currentUser.email,
      usuarioRol: currentUser.rol,
      accion: 'DAR_DE_BAJA_CONTACTO',
      entidad: `Contacto: ${contact.nombres} ${contact.apellidos} (${contact.telefono})`,
      detalles: `Contacto dado de baja. Motivo: ${contact.motivoBaja}. Envíos futuros bloqueados.`,
    });

    this.notify();
  }

  public deleteContact(id: string, currentUser: User): void {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) return;

    this.contacts = this.contacts.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(this.contacts));

    this.logAudit({
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      usuarioEmail: currentUser.email,
      usuarioRol: currentUser.rol,
      accion: 'ELIMINAR_CONTACTO',
      entidad: `Contacto: ${contact.nombres} ${contact.apellidos}`,
      detalles: `Contacto eliminado de la base de datos por cumplimiento.`,
    });

    this.notify();
  }

  // --- SEGMENTS ---
  public getSegments(): Segment[] {
    return [...this.segments];
  }

  public getContactsForSegment(segment: Segment): Contact[] {
    return this.contacts.filter(c => {
      // Must respect active criteria unless explicitly requested
      if (segment.criterio.soloActivos && c.estado !== 'activo') return false;
      if (segment.criterio.zona && c.zona.toLowerCase() !== segment.criterio.zona.toLowerCase()) return false;
      if (segment.criterio.grupo && !c.grupo.toLowerCase().includes(segment.criterio.grupo.toLowerCase())) return false;
      if (segment.criterio.soloWhatsApp && !c.consentimientoWhatsApp) return false;
      if (segment.criterio.soloSMS && (!c.consentimientoSMS || c.consentimientoWhatsApp)) return false;
      if (segment.criterio.soloPruebaTwilio && !c.esNumeroPruebaTwilio) return false;
      return true;
    });
  }

  public createSegment(segment: Segment, currentUser: User): void {
    this.segments.push(segment);
    localStorage.setItem(STORAGE_KEYS.SEGMENTS, JSON.stringify(this.segments));

    this.logAudit({
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      usuarioEmail: currentUser.email,
      usuarioRol: currentUser.rol,
      accion: 'CREAR_SEGMENTO',
      entidad: `Segmento: ${segment.nombre}`,
      detalles: `Nuevo segmento dinámico creado: ${segment.descripcion}`,
    });

    this.notify();
  }

  // --- CAMPAIGNS ---
  public getCampaigns(): Campaign[] {
    return [...this.campaigns];
  }

  public getCampaignById(id: string): Campaign | undefined {
    return this.campaigns.find(c => c.id === id);
  }

  public saveCampaign(campaign: Campaign, currentUser: User): void {
    const index = this.campaigns.findIndex(c => c.id === campaign.id);
    if (index === -1) {
      this.campaigns.unshift(campaign);
      this.logAudit({
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioEmail: currentUser.email,
        usuarioRol: currentUser.rol,
        accion: 'CREAR_CAMPANA',
        entidad: `Campaña: ${campaign.nombre}`,
        detalles: `Canal: ${campaign.canal}, Modo: ${campaign.modo}, Destinatarios: ${campaign.totalDestinatarios}`,
      });
    } else {
      this.campaigns[index] = campaign;
    }
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(this.campaigns));
    this.notify();
  }

  // --- MESSAGE LOGS ---
  public getMessageLogs(): MessageLog[] {
    return [...this.messageLogs];
  }

  public addMessageLogs(newLogs: MessageLog[]): void {
    this.messageLogs = [...newLogs, ...this.messageLogs];
    // Keep reasonable storage limit for browser
    if (this.messageLogs.length > 500) {
      this.messageLogs = this.messageLogs.slice(0, 500);
    }
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messageLogs));
    this.notify();
  }

  public saveMessageLogs(updatedLogs: MessageLog[]): void {
    this.messageLogs = [...updatedLogs];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(this.messageLogs));
    this.notify();
  }

  // --- USERS (Admin Only) ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public saveUser(user: User, currentUser: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index === -1) {
      this.users.push(user);
      this.logAudit({
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioEmail: currentUser.email,
        usuarioRol: currentUser.rol,
        accion: 'CREAR_USUARIO',
        entidad: `Usuario: ${user.nombre} (${user.email})`,
        detalles: `Asignación de rol: ${user.rol}, estado: ${user.estado}`,
      });
    } else {
      this.users[index] = user;
      this.logAudit({
        usuarioId: currentUser.id,
        usuarioNombre: currentUser.nombre,
        usuarioEmail: currentUser.email,
        usuarioRol: currentUser.rol,
        accion: 'EDITAR_USUARIO',
        entidad: `Usuario: ${user.nombre} (${user.email})`,
        detalles: `Cambio de rol: ${user.rol}, estado: ${user.estado}`,
      });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    this.notify();
  }

  public toggleUserStatus(userId: string, currentUser: User): void {
    const u = this.users.find(x => x.id === userId);
    if (!u) return;
    u.estado = u.estado === 'activo' ? 'inactivo' : 'activo';
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));

    this.logAudit({
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      usuarioEmail: currentUser.email,
      usuarioRol: currentUser.rol,
      accion: 'CAMBIAR_ESTADO_USUARIO',
      entidad: `Usuario: ${u.nombre}`,
      detalles: `Nuevo estado: ${u.estado}`,
    });

    this.notify();
  }

  // --- SETTINGS ---
  public getSettings(): any {
    return {
      ...this.settings,
      nombreOrganizacion: this.settings.nombre,
      twilioAccountSid: this.settings.twilioAccountSidMasked || 'AC99482710492817293847102938472910',
      twilioAuthToken: '********************************',
      twilioPhoneNumberWhatsApp: this.settings.twilioWhatsAppFrom,
      twilioPhoneNumberSms: this.settings.twilioSmsFrom,
      mensajeOptOutTexto: 'Para no recibir más comunicados, responda BAJA.',
    };
  }

  public saveSettings(newSettings: any, currentUser: User): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));

    this.logAudit({
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      usuarioEmail: currentUser.email,
      usuarioRol: currentUser.rol,
      accion: 'ACTUALIZAR_CONFIGURACION',
      entidad: 'Configuración de Organización y Twilio',
      detalles: `Actualización de parámetros operativos, tarifas de costeo y horario de envíos.`,
    });

    this.notify();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public logAudit(logData: Omit<AuditLog, 'id' | 'fechaHora'>): void {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fechaHora: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...logData,
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
    this.notify();
  }

  // --- RESET DEMO DATA ---
  public resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.SEGMENTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);

    this.contacts = [];
    this.campaigns = [];
    this.messageLogs = [];
    this.segments = [];
    this.users = [];
    this.settings = { nombre: '', logoTexto: '', correoSoporte: '', telefonoSoporte: '', sitioWeb: '', twilioConfigured: false, twilioAccountSidMasked: '', twilioWhatsAppFrom: '', twilioSmsFrom: '', costoWhatsAppUtilityMil: 0, costoWhatsAppMarketingMil: 0, costoSmsMil: 0, alertaCostoUmbral: 0, horarioPermitidoInicio: '08:00', horarioPermitidoFin: '20:00', permitirEnviosFindeSemana: false };
    this.auditLogs = [];

    this.notify();
  }
}

export const storageService = new StorageService();
