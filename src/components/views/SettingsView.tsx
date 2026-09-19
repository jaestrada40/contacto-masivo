import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  PhoneCall, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Clock, 
  Smartphone, 
  MessageSquare,
  Lock
} from 'lucide-react';
import { AppSettings, User } from '../../types';
import { storageService } from '../../services/storageService';
import { twilioService } from '../../services/twilioMessagingService';

interface SettingsViewProps {
  currentUser: User;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [showTokens, setShowTokens] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoError, setLogoError] = useState('');

  const handleLogoUpload = (file?: File) => {
    setLogoError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setLogoError('Use una imagen PNG, JPEG o WebP.'); return; }
    if (file.size > 1024 * 1024) { setLogoError('El logo no puede exceder 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setSettings(previous => ({ ...previous, logoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings, currentUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestTwilio = async () => {
    setTestingConnection(true);
    setTestResult(null);

    const res = await twilioService.testTwilioCredentials(
      settings.twilioAccountSid,
      settings.twilioAuthToken
    );

    setTestingConnection(false);
    setTestResult(res);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configuración de Plataforma</h1>
          <p className="text-xs text-slate-500">
            Conectividad con Twilio, parámetros de consentimiento, costos y políticas de envío
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Configuración guardada en auditoría</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Logo institucional</h3>
            <p className="text-xs text-slate-500 mt-1">Se muestra en la barra lateral y en el inicio de sesión.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-20 w-48 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Vista previa del logo" className="h-full w-full object-contain" /> : <span className="text-slate-400">Sin logo</span>}
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer px-3 py-2 rounded-lg bg-[#0C2A5A] text-white font-bold">
                Subir logo
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => handleLogoUpload(event.target.files?.[0])} />
              </label>
              {settings.logoDataUrl && <button type="button" onClick={() => setSettings(previous => ({ ...previous, logoDataUrl: undefined }))} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold">Quitar</button>}
            </div>
          </div>
          {logoError && <p className="text-rose-700 font-medium">{logoError}</p>}
        </div>
        {/* Twilio API Integration Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Credenciales Twilio (WhatsApp & SMS)</h3>
                <p className="text-xs text-slate-500">Parámetros del proveedor para Modo Prueba Twilio</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestTwilio}
              disabled={testingConnection}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Probando...' : 'Probar Conexión'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Twilio Account SID</label>
              <input
                type="text"
                value={settings.twilioAccountSid}
                onChange={e => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Twilio Auth Token</label>
                <button
                  type="button"
                  onClick={() => setShowTokens(!showTokens)}
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                >
                  {showTokens ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showTokens ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                type={showTokens ? 'text' : 'password'}
                value={settings.twilioAuthToken}
                onChange={e => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remitente WhatsApp (From / Sandbox)</label>
              <input
                type="text"
                value={settings.twilioPhoneNumberWhatsApp}
                onChange={e => setSettings({ ...settings, twilioPhoneNumberWhatsApp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                placeholder="whatsapp:+14155238886"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remitente SMS (From / Shortcode)</label>
              <input
                type="text"
                value={settings.twilioPhoneNumberSms}
                onChange={e => setSettings({ ...settings, twilioPhoneNumberSms: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                placeholder="+15005550006"
              />
            </div>
          </div>
        </div>

        {/* Legal & Opt-out Compliance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Políticas de Consentimiento y Desuscripción</h3>
              <p className="text-xs text-slate-500">Mecanismo automático de revocación de consentimiento (Opt-out)</p>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Leyenda Obligatoria de Baja al Pie del Mensaje
            </label>
            <input
              type="text"
              value={settings.mensajeOptOutTexto}
              onChange={e => setSettings({ ...settings, mensajeOptOutTexto: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se anexa automáticamente a los comunicados para garantizar el cumplimiento legal y derecho a revocación.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora Inicio Permitida</label>
              <input
                type="time"
                value={settings.horarioPermitidoInicio}
                onChange={e => setSettings({ ...settings, horarioPermitidoInicio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora Límite Permitida</label>
              <input
                type="time"
                value={settings.horarioPermitidoFin}
                onChange={e => setSettings({ ...settings, horarioPermitidoFin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Cost Estimation Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tarifas y Costos Unitarios</h3>
              <p className="text-xs text-slate-500">Valores de referencia para el cálculo de presupuesto en campañas masivas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo WhatsApp por Millar (USD)</label>
              <input
                type="number"
                step="0.1"
                value={settings.costoWhatsAppUtilityMil}
                onChange={e => setSettings({ ...settings, costoWhatsAppUtilityMil: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo SMS por Millar (USD)</label>
              <input
                type="number"
                step="0.1"
                value={settings.costoSmsMil}
                onChange={e => setSettings({ ...settings, costoSmsMil: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {currentUser.rol === 'admin' ? (
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración de Plataforma</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 rounded-lg text-slate-500 text-center font-semibold">
            Solo el rol Administrador puede modificar los parámetros del sistema.
          </div>
        )}
      </form>
    </div>
  );
};
