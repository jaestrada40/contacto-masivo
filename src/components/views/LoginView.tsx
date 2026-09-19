import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';
import { storageService } from '../../services/storageService';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState(authService.getRememberedEmail() || 'admin@conectamasivo.demo');
  const [password, setPassword] = useState('Demo123!');
  const [rememberMe, setRememberMe] = useState(Boolean(authService.getRememberedEmail()));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mfaActive, setMfaActive] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [logoDataUrl] = useState<string | undefined>(() => storageService.getSettings().logoDataUrl);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ message?: string; success?: boolean }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico institucional.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor ingrese su contraseña.');
      return;
    }

    setLoading(true);
    const result = await authService.login({ email, password, rememberMe });
    setLoading(false);

    if (result.success) {
      onLoginSuccess();
    } else if (result.mfaRequired) {
      setMfaActive(true);
      setMfaSetupRequired(Boolean(result.mfaSetupRequired));
      if (result.mfaSetupRequired) {
        try { const setup = await authService.beginMfaSetup(); setMfaSecret(setup.secret); }
        catch (error) { setErrorMessage(error instanceof Error ? error.message : 'No fue posible iniciar MFA.'); }
      }
    } else {
      setErrorMessage(result.error || 'Credenciales inválidas.');
    }
  };

  const handleMfa = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setErrorMessage('');
    const result = await authService.completeMfa(mfaCode);
    setLoading(false);
    if (result.success) onLoginSuccess(); else setErrorMessage(result.error || 'Código MFA inválido.');
  };

  const handleQuickDemoFill = (role: UserRole) => {
    switch (role) {
      case 'admin':
        setEmail('admin@conectamasivo.demo');
        break;
      case 'operador':
        setEmail('operador@conectamasivo.demo');
        break;
      case 'consulta':
        setEmail('consulta@conectamasivo.demo');
        break;
    }
    setPassword('Demo123!');
    setErrorMessage('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authService.requestPasswordReset(forgotEmail);
    setForgotStatus(res);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="text-center">
          {logoDataUrl ? <img src={logoDataUrl} alt="Logo de la organización" className="h-28 sm:h-32 w-80 sm:w-[30rem] max-w-full object-contain mx-auto mb-6" /> : <div className="h-28 sm:h-32 w-80 sm:w-[30rem] max-w-full mx-auto mb-6 rounded-2xl bg-[#0F2747] shadow-xs" aria-label="Logo no configurado" />}
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">Iniciar Sesión</h3>
            <p className="text-xs text-slate-500 mt-0.5">Acceda con su cuenta asignada para gestionar campañas</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mfaActive ? (
          <form onSubmit={handleMfa} className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
              <p className="font-bold">Verificación MFA</p>
              {mfaSetupRequired && <><p className="mt-1">Configure esta clave secreta en su autenticador compatible. No comparta esta clave.</p><code className="block mt-2 break-all select-all bg-white p-2 rounded text-[11px]">{mfaSecret}</code></>}
              <p className="mt-2">Ingrese el código de seis dígitos. Cada código dura 30 segundos.</p>
            </div>
            <input aria-label="Código MFA" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={mfaCode} onChange={event => setMfaCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" required className="w-full px-3 py-2.5 text-center tracking-[0.4em] font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading || mfaCode.length !== 6 || (mfaSetupRequired && !mfaSecret)} className="w-full flex items-center justify-center gap-2 bg-[#0C2A5A] text-white py-2.5 px-4 rounded-lg text-xs font-bold disabled:opacity-60">{loading ? 'Validando…' : 'Validar código'}</button>
            <button type="button" onClick={() => { setMfaActive(false); setMfaCode(''); setMfaSecret(''); }} className="w-full text-xs text-blue-700 hover:underline">Volver al inicio de sesión</button>
          </form>
          ) : <>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@conectamasivo.demo"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  ¿Olvidé mi contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 select-none">Recordarme en este equipo</span>
              </label>
            </div>

            <button
              type="submit"
              id="btn-submit-login"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#0C2A5A] hover:bg-[#123875] text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                </>
              )}
            </button>
          </form>

          {/* Demo User Fast Fill Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Acceso Rápido de Demostración:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Demo123!</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('admin')}
                className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">admin@...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('operador')}
                className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">Operador</div>
                <div className="text-[9px] text-slate-400 truncate">operador@...</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('consulta')}
                className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">Consulta</div>
                <div className="text-[9px] text-slate-400 truncate">consulta@...</div>
              </button>
            </div>
          </div>
          </>}
        </div>

        {/* Security and Compliance Footer Notice */}
        <div className="mt-6 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cumplimiento RGPD / LPDP y Consentimiento Verificado</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-slate-900 text-base mb-1">Restablecer Contraseña</h3>
            <p className="text-xs text-slate-500 mb-4">
              Le enviaremos un correo con instrucciones para restablecer su acceso seguro.
            </p>

            {forgotStatus.message ? (
              <div className={`p-3 rounded-lg text-xs mb-4 ${forgotStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800'}`}>
                {forgotStatus.message}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="correo@conectamasivo.demo"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-[#0C2A5A] text-white rounded-lg hover:bg-blue-900"
                  >
                    Enviar instrucciones
                  </button>
                </div>
              </form>
            )}

            {forgotStatus.message && (
              <div className="text-right pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus({});
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
