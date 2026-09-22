import { User } from '../types';
import { api, toUser } from './api';

const AUTH_STORAGE_KEY = 'conecta_masivo_current_user';
const REMEMBER_STORAGE_KEY = 'conecta_masivo_remember';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface LoginResult { success: boolean; user?: User; error?: string; mfaRequired?: boolean; mfaSetupRequired?: boolean; }

export class AuthService {
  private currentUser: User | null = null;
  private pendingMfaToken: string | null = null;
  private mfaSetupRequired = false;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadPersistedUser();
  }

  private loadPersistedUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  public async login(credentials: LoginCredentials): Promise<LoginResult> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    try {
      const result = await api.login(email, password);
      if ((result as any).mfaRequired) {
        this.pendingMfaToken = (result as any).mfaToken;
        this.mfaSetupRequired = Boolean((result as any).mfaSetupRequired);
        return { success: false, mfaRequired: true, mfaSetupRequired: this.mfaSetupRequired };
      }
      api.setToken(result.accessToken);
      this.currentUser = toUser(result.user);
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'No fue posible iniciar sesión.' }; }

    if (credentials.rememberMe) {
      localStorage.setItem(REMEMBER_STORAGE_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_STORAGE_KEY);
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();

    return { success: true, user: this.currentUser };
  }

  public async beginMfaSetup(): Promise<{ secret: string; otpauthUri: string; periodSeconds: number }> {
    if (!this.pendingMfaToken || !this.mfaSetupRequired) throw new Error('No hay una configuración MFA pendiente.');
    return api.mfaSetup(this.pendingMfaToken);
  }

  public async completeMfa(code: string): Promise<LoginResult> {
    if (!this.pendingMfaToken) return { success: false, error: 'El reto MFA expiró. Inicie sesión nuevamente.' };
    try {
      const result = this.mfaSetupRequired ? await api.mfaActivate(this.pendingMfaToken, code) : await api.mfaVerify(this.pendingMfaToken, code);
      api.setToken(result.accessToken); this.currentUser = toUser(result.user); this.pendingMfaToken = null; this.mfaSetupRequired = false;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser)); this.notify();
      return { success: true, user: this.currentUser };
    } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'No fue posible validar MFA.' }; }
  }

  public async switchRole(_role: 'admin' | 'operador' | 'consulta'): Promise<User> { throw new Error('El cambio de rol simulado ya no está disponible. Inicie sesión con una cuenta autorizada.'); }

  public logout(): void {
    this.currentUser = null;
    api.setToken();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();
  }

  public getRememberedEmail(): string {
    return localStorage.getItem(REMEMBER_STORAGE_KEY) || '';
  }

  public async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Ingrese un correo electrónico válido.' };
    }
    return { success: false, message: 'La recuperación por correo aún no está configurada; contacte al administrador.' };
  }
}

export const authService = new AuthService();
