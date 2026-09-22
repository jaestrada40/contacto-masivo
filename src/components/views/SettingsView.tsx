import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  PhoneCall, 
  Save, 
  RotateCw, 
  Eye, 
  EyeOff, 
  DollarSign, 
  Clock, 
  Smartphone, 
  MessageSquare,
  Lock
} from 'lucide-react';
import { OrganizationSettings, User } from '../../types';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';

interface SettingsViewProps {
  currentUser: User;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<OrganizationSettings>({ nombre: '', logoTexto: '', correoSoporte: '', telefonoSoporte: '', sitioWeb: '', twilioConfigured: false, twilioAccountSidMasked: '', twilioWhatsAppFrom: '', twilioSmsFrom: '', costoWhatsAppUtilityMil: 0, costoWhatsAppMarketingMil: 0, costoSmsMil: 0, alertaCostoUmbral: 0, horarioPermitidoInicio: '08:00', horarioPermitidoFin: '20:00', permitirEnviosFindeSemana: false });
  const [showTokens, setShowTokens] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [mfaEnforced, setMfaEnforced] = useState<boolean | null>(null);
  const [mfaSaving, setMfaSaving] = useState(false);

  useEffect(() => {
    if (currentUser.rol !== 'admin') return;
    api.settings().then((value: any) => {
      setMfaEnforced(Boolean(value.mfaEnforced));
      setSettings(previous => ({ ...previous, nombre: value.organizationName || '', logoDataUrl: value.logoDataUrl || undefined,
        correoSoporte: value.supportEmail || '', telefonoSoporte: value.supportPhone || '',
        horarioPermitidoInicio: `${String(value.allowedStartHour ?? 8).padStart(2, '0')}:00`,
        horarioPermitidoFin: `${String(value.allowedEndHour ?? 20).padStart(2, '0')}:00`,
        costoWhatsAppUtilityMil: Number(value.whatsappUtilityRatePerThousand || 0),
        costoWhatsAppMarketingMil: Number(value.whatsappMarketingRatePerThousand || 0), costoSmsMil: Number(value.smsRatePerThousand || 0) }));
    }).catch(() => showToast('No fue posible consultar la configuración.', 'error'));
  }, [currentUser.rol]);

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 1024 * 1024) { showToast('El logo no puede exceder 1 MB.', 'error'); return; }
    const acceptedRasterTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!acceptedRasterTypes.includes(file.type) && !isSvg) { showToast('Use una imagen PNG, JPEG, WebP o SVG.', 'error'); return; }
    const reader = new FileReader();
    if (isSvg) {
      reader.onload = () => {
        const svg = String(reader.result);
        if (!/^\s*<svg[\s>]/i.test(svg) || /<\s*(script|foreignObject|iframe|object|embed)\b|\son\w+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|javascript:|data:)/i.test(svg)) {
          showToast('El SVG contiene contenido no permitido. Use un SVG estático, sin scripts ni enlaces externos.', 'error');
          return;
        }
        setSettings(previous => ({ ...previous, logoDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` }));
      };
      reader.readAsText(file);
      return;
    }
    reader.onload = () => setSettings(previous => ({ ...previous, logoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleMfaEnforcement = async (enabled: boolean) => {
    setMfaSaving(true);
    try {
      const result = await api.mfaEnforcement(enabled);
      setMfaEnforced(result.mfaEnforced);
      showToast(`MFA ${enabled ? 'obligatorio' : 'opcional'} actualizado.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible actualizar MFA.', 'error');
    } finally {
      setMfaSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/settings', { method: 'PATCH', body: JSON.stringify({ logoDataUrl: settings.logoDataUrl ?? null, supportEmail: settings.correoSoporte || undefined, supportPhone: settings.telefonoSoporte || undefined, allowedStartHour: Number(settings.horarioPermitidoInicio.split(':')[0]), allowedEndHour: Number(settings.horarioPermitidoFin.split(':')[0]), whatsappUtilityRatePerThousand: settings.costoWhatsAppUtilityMil, whatsappMarketingRatePerThousand: settings.costoWhatsAppMarketingMil, smsRatePerThousand: settings.costoSmsMil }) });
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: settings.logoDataUrl }));
      showToast('Configuración guardada.', 'success');
    } catch (error) { showToast(error instanceof Error ? error.message : 'No se pudo guardar la configuración.', 'error'); }
  };

  const handleTestTwilio = async () => {
    setTestingConnection(true);
    setTestingConnection(false);
    showToast('Las credenciales Twilio no se guardan ni prueban desde el navegador. Configúrelas en el entorno seguro del servidor.', 'info');
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
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" className="sr-only" onChange={event => handleLogoUpload(event.target.files?.[0])} />
              </label>
              {settings.logoDataUrl && <button type="button" onClick={() => setSettings(previous => ({ ...previous, logoDataUrl: undefined }))} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold">Quitar</button>}
            </div>
          </div>
        </div>

        {currentUser.rol === 'admin' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Autenticación multifactor (MFA)</h3>
                <p className="text-xs text-slate-500 mt-1">Exige un código de una aplicación autenticadora a todas las cuentas en su próximo inicio de sesión.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">{mfaEnforced ? 'MFA obligatorio' : 'MFA no obligatorio'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Al activarlo, cada persona configurará su código TOTP de seis dígitos al volver a iniciar sesión.</p>
              </div>
              <button type="button" role="switch" aria-checked={Boolean(mfaEnforced)} disabled={mfaSaving || mfaEnforced === null} onClick={() => handleMfaEnforcement(!mfaEnforced)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${mfaEnforced ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${mfaEnforced ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Twilio Account SID</label>
              <input
                type="text"
                value={settings.twilioAccountSidMasked}
                readOnly
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
                value=""
                readOnly
                placeholder="Configure en el servidor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remitente WhatsApp (From / Sandbox)</label>
              <input
                type="text"
                value={settings.twilioWhatsAppFrom}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                placeholder="whatsapp:+14155238886"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remitente SMS (From / Shortcode)</label>
              <input
                type="text"
                value={settings.twilioSmsFrom}
                readOnly
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
              value=""
              readOnly
              placeholder="Configuración no disponible"
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
