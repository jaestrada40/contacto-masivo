import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Send, 
  MessageSquare, 
  Smartphone, 
  Layers, 
  Users, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Info, 
  DollarSign, 
  CheckCircle2, 
  HelpCircle,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  CampaignChannel, 
  CampaignMode, 
  CampaignType, 
  Contact, 
  Segment, 
  User 
} from '../../types';
import { api, toCampaign } from '../../services/api';
import { showToast } from '../../services/toast';
import { ActiveView } from '../layout/Sidebar';

const WHATSAPP_TEMPLATES: { id: string; nombre: string; categoria: 'UTILITY' | 'MARKETING'; titulo: string; cuerpo: string; variables: string[]; idioma: string }[] = [];

const segmentActiveCount = (segment: Segment, contacts: Contact[]) => contacts.filter(contact =>
  contact.estado === 'activo' &&
  (!segment.criterio.zona || contact.zona === segment.criterio.zona) &&
  (!segment.criterio.grupo || contact.grupo.includes(segment.criterio.grupo)) &&
  (!segment.criterio.soloWhatsApp || contact.consentimientoWhatsApp) &&
  (!segment.criterio.soloSMS || contact.consentimientoSMS)
).length;

interface NewCampaignWizardViewProps {
  contacts: Contact[];
  segments: Segment[];
  currentUser: User;
  onNavigate: (view: ActiveView, extraId?: string) => void;
  preselectedSegmentId?: string;
  onDataChanged: () => Promise<void>;
}

export const NewCampaignWizardView: React.FC<NewCampaignWizardViewProps> = ({
  contacts,
  segments,
  currentUser,
  onNavigate,
  preselectedSegmentId,
  onDataChanged,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Info
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<CampaignType>('recordatorio');
  const [canal, setCanal] = useState<CampaignChannel>('whatsapp');
  const [programacion, setProgramacion] = useState<'ahora' | 'programado'>('ahora');
  const [fechaProgramada, setFechaProgramada] = useState('');

  // Step 2: Recipients & Mode
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(preselectedSegmentId || segments[0]?.id || '');
  const [modo, setModo] = useState<CampaignMode>('demo');
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Step 3: Message Editor & Preview
  const [plantillaWA, setPlantillaWA] = useState<string>('recordatorio_evento');
  const [mensajeTexto, setMensajeTexto] = useState<string>('');
  const [previewContactIndex, setPreviewContactIndex] = useState<number>(0);
  const [rates, setRates] = useState({ whatsappUtility: 0, whatsappMarketing: 0, sms: 0, loaded: false });

  useEffect(() => {
    api.settings().then((value: any) => setRates({
      whatsappUtility: Number(value.whatsappUtilityRatePerThousand || 0),
      whatsappMarketing: Number(value.whatsappMarketingRatePerThousand || 0),
      sms: Number(value.smsRatePerThousand || 0),
      loaded: true,
    })).catch(() => setRates(previous => ({ ...previous, loaded: true })));
  }, []);

  // Step 4: Review & Send
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState<{ current: number; total: number; pct: number; message: string }>({
    current: 0,
    total: 0,
    pct: 0,
    message: ''
  });

  // Calculations for Step 2 Recipients
  const selectedSegment = segments.find(s => s.id === selectedSegmentId) || segments[0];

  const candidateContacts = useMemo(() => {
    if (isManualSelection) {
      return contacts.filter(c => selectedContactIds.includes(c.id));
    }
    if (!selectedSegment) return [];
    return contacts.filter(c => c.estado === 'activo' && (!selectedSegment.criterio.zona || c.zona === selectedSegment.criterio.zona) && (!selectedSegment.criterio.grupo || c.grupo.includes(selectedSegment.criterio.grupo)) && (!selectedSegment.criterio.soloWhatsApp || c.consentimientoWhatsApp) && (!selectedSegment.criterio.soloSMS || c.consentimientoSMS));
  }, [isManualSelection, selectedContactIds, selectedSegment, contacts]);

  // Exclude contacts without consent for selected channel
  const { eligibleRecipients, excludedRecipients } = useMemo(() => {
    const eligible: Contact[] = [];
    const excluded: { contact: Contact; reason: string }[] = [];

    candidateContacts.forEach(c => {
      if (c.estado !== 'activo') {
        excluded.push({ contact: c, reason: `Contacto inactivo o en estado: ${c.estado}` });
        return;
      }

      if ((modo === 'twilio_test' || modo === 'meta_test') && !c.esNumeroPruebaTwilio) {
        excluded.push({ contact: c, reason: 'No está autorizado para pruebas del proveedor' });
        return;
      }

      if (modo === 'meta_test' && canal !== 'whatsapp') {
        excluded.push({ contact: c, reason: 'La prueba de Meta solo admite WhatsApp' });
        return;
      }

      if (canal === 'whatsapp' && !c.consentimientoWhatsApp) {
        excluded.push({ contact: c, reason: 'Falta consentimiento expreso para WhatsApp' });
        return;
      }

      if (canal === 'sms' && !c.consentimientoSMS) {
        excluded.push({ contact: c, reason: 'Falta consentimiento expreso para SMS' });
        return;
      }

      if (canal === 'ambos' && !c.consentimientoWhatsApp && !c.consentimientoSMS) {
        excluded.push({ contact: c, reason: 'Sin consentimiento para ninguno de los dos canales' });
        return;
      }

      eligible.push(c);
    });

    return { eligibleRecipients: eligible, excludedRecipients: excluded };
  }, [candidateContacts, canal, modo]);

  // Actual recipient count
  const effectiveRecipientCount = eligibleRecipients.length;

  // Cost estimates
  const whatsappRate = tipo === 'promocion' ? rates.whatsappMarketing : rates.whatsappUtility;
  const unitCost = canal === 'whatsapp'
    ? whatsappRate / 1000
    : canal === 'sms'
    ? rates.sms / 1000
    : (whatsappRate + rates.sms) / 1000;
  const costConfigured = rates.loaded && (canal === 'whatsapp' ? whatsappRate > 0 : canal === 'sms' ? rates.sms > 0 : whatsappRate > 0 && rates.sms > 0);

  const estimatedTotalCost = Number((effectiveRecipientCount * unitCost).toFixed(2));

  // SMS character count logic
  const smsLength = mensajeTexto.length;
  const isSmsOverLimit = smsLength > 160;
  const smsSegmentsCount = Math.ceil(smsLength / 153) || 1;

  // Variable insertion handler
  const insertVariable = (variable: string) => {
    setMensajeTexto(prev => `${prev} {{${variable}}}`);
  };

  const handleTemplateSelect = (templateId: string) => {
    setPlantillaWA(templateId);
    const found = WHATSAPP_TEMPLATES.find(t => t.id === templateId);
    if (found) {
      setMensajeTexto(found.cuerpo);
    }
  };

  // Dispatch execution
  const executeCampaignDispatch = async () => {
    setIsSending(true);

    try {
      const created = await api.createCampaign({
        name: nombre.trim() || `Campaña ${tipo} ${new Date().toLocaleDateString()}`,
        type: ({ recordatorio: 'REMINDER', aviso: 'NOTICE', informativa: 'INFORMATIONAL', promocion: 'PROMOTION', urgente: 'URGENT' } as const)[tipo],
        channel: ({ whatsapp: 'WHATSAPP', sms: 'SMS', ambos: 'BOTH' } as const)[canal],
        executionMode: modo === 'twilio_test' ? 'TWILIO_TEST' : modo === 'meta_test' ? 'META_TEST' : 'DEMO',
        message: mensajeTexto,
        whatsappTemplate: modo === 'meta_test' ? 'hello_world' : canal !== 'sms' ? plantillaWA : undefined,
        scheduledAt: programacion === 'programado' ? new Date(fechaProgramada).toISOString() : undefined,
        segmentId: isManualSelection ? undefined : selectedSegment?.id,
        contactIds: isManualSelection ? eligibleRecipients.map(c => c.id) : undefined,
      });
      const campaign = toCampaign(created);
      if (programacion === 'ahora') await api.sendCampaign(campaign.id);
      await onDataChanged();
      setIsSending(false);
      setShowConfirmModal(false);
      showToast(programacion === 'programado' ? 'Campaña programada.' : 'Campaña creada y puesta en cola.', 'success');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      onNavigate('campanas');

    } catch (err: any) {
      setIsSending(false);
      setShowConfirmModal(false);
      showToast(err.message || 'Error inesperado durante el despacho de la campaña.', 'error');
    }
  };

  // Mock phone preview contact
  const previewContact = eligibleRecipients[previewContactIndex] || contacts[0];
  const renderedPreviewText = previewContact ? mensajeTexto.replace(/{{\s*nombre\s*}}/gi, previewContact.nombres).replace(/{{\s*apellido\s*}}/gi, previewContact.apellidos).replace(/{{\s*telefono\s*}}/gi, previewContact.telefono) : mensajeTexto;

  return (
    <div className="space-y-6 pb-16">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('campanas')}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Asistente de Nueva Campaña</h1>
            <p className="text-xs text-slate-500">Paso {currentStep} de 4 para la configuración y despacho</p>
          </div>
        </div>

        {/* Mode Pill in Header */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            modo === 'demo'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
            {modo === 'demo' ? 'Modo Demo · Simulación' : modo === 'meta_test' ? 'Modo Prueba Meta' : 'Modo Prueba Twilio'}
          </span>
        </div>
      </div>

      {/* Step Stepper Indicator */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {[
          { num: 1, label: 'Información' },
          { num: 2, label: 'Destinatarios & Modo' },
          { num: 3, label: 'Mensaje & Vista previa' },
          { num: 4, label: 'Revisión & Envío' },
        ].map(s => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <div
              key={s.num}
              onClick={() => isDone && setCurrentStep(s.num as any)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                isDone ? 'cursor-pointer hover:bg-slate-50' : ''
              } ${isActive ? 'bg-blue-50/80 border border-blue-200' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                isActive ? 'bg-[#0C2A5A] text-white' :
                isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className={`text-xs truncate font-medium ${
                isActive ? 'font-bold text-[#0C2A5A]' :
                isDone ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* STEP 1: INFORMACIÓN */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 1: Información de la Campaña</h2>
            <p className="text-xs text-slate-500">Defina el nombre interno, tipología institucional y canal de entrega</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Nombre Interno de la Campaña *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Recordatorio Taller Conecta 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tipo de Campaña */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Tipo de Notificación</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'recordatorio', label: 'Recordatorio' },
                  { id: 'aviso', label: 'Aviso' },
                  { id: 'informativa', label: 'Informativa' },
                  { id: 'promocion', label: 'Promoción' },
                  { id: 'urgente', label: 'Urgente' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id as CampaignType)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                      tipo === t.id
                        ? 'bg-[#0C2A5A] text-white border-[#0C2A5A] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Canal: WhatsApp, SMS, Ambos */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Canal de Envío *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setCanal('whatsapp')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    canal === 'whatsapp'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">WhatsApp Business</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mensajería enriquecida y plantillas verificadas</p>
                  </div>
                </div>

                <div
                  onClick={() => modo !== 'meta_test' && setCanal('sms')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    canal === 'sms'
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : modo === 'meta_test' ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">SMS Masivo</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Máxima compatibilidad sin requerir datos móviles</p>
                  </div>
                </div>

                <div
                  onClick={() => modo !== 'meta_test' && setCanal('ambos')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    canal === 'ambos'
                      ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                      : modo === 'meta_test' ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Ambos Canales</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Envía por WhatsApp o SMS según consentimiento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fecha y Hora: Ahora o Programado */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Momento de Envío</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="programacion"
                    checked={programacion === 'ahora'}
                    onChange={() => setProgramacion('ahora')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Enviar inmediatamente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="programacion"
                    checked={programacion === 'programado'}
                    onChange={() => setProgramacion('programado')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Programar para fecha futura</span>
                </label>
              </div>

              {programacion === 'programado' && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={fechaProgramada}
                    onChange={e => setFechaProgramada(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-[11px] text-slate-500">
                    Horario permitido: 08:00 a 20:00 (Políticas de no perturbación)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Wizard Next Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                if (!nombre.trim()) {
                  setNombre(`Campaña ${tipo} ${new Date().toLocaleDateString()}`);
                }
                setCurrentStep(2);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors shadow-xs"
            >
              <span>Continuar a Destinatarios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: DESTINATARIOS & MODO */}
      {/* ========================================================= */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 2: Segmentación y Modo de Ejecución</h2>
            <p className="text-xs text-slate-500">Seleccione destinatarios reales de la base. Demo no envía mensajes; los modos de prueba usan credenciales configuradas.</p>
          </div>

            {/* MODE SELECTOR */}
          <div className="p-4 rounded-xl border-2 border-dashed bg-slate-50 space-y-3">
            <label className="block font-bold text-slate-800 text-xs">
              Modo de Ejecución de la Campaña:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setModo('demo')}
                aria-pressed={modo === 'demo'}
                className={`w-full text-left p-3.5 rounded-xl border cursor-pointer transition-all ${
                  modo === 'demo'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Modo Demo (Simulación)
                  </span>
                  <span className="bg-amber-200/60 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Sin costo real
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Registra una simulación solo para los contactos elegibles que existen en la base. No envía mensajes reales.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModo('twilio_test')}
                aria-pressed={modo === 'twilio_test'}
                className={`w-full text-left p-3.5 rounded-xl border cursor-pointer transition-all ${
                  modo === 'twilio_test'
                    ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    Modo Prueba Twilio
                  </span>
                  <span className="bg-indigo-200/60 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Sandbox API
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Solo permite enviar a contactos que tengan <strong>esNumeroPruebaTwilio = true</strong>. Requiere que el contacto se haya unido previamente al Sandbox de Twilio.
                </p>
              </button>

              <button
                type="button"
                onClick={() => { setModo('meta_test'); setCanal('whatsapp'); }}
                aria-pressed={modo === 'meta_test'}
                className={`w-full text-left p-3.5 rounded-xl border cursor-pointer transition-all ${modo === 'meta_test' ? 'border-emerald-500 bg-emerald-50/70 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-emerald-600" />Modo Prueba Meta</span>
                  <span className="bg-emerald-200/60 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">Cloud API</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">Envía la plantilla oficial hello_world al teléfono autorizado. No usa el texto personalizado de la campaña.</p>
              </button>
            </div>

            {modo === 'twilio_test' && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Aviso obligatorio para WhatsApp Sandbox:</p>
                  <p className="mt-0.5 text-[11px]">
                    Para WhatsApp Sandbox, el contacto debe haberse unido previamente enviando el código de Twilio (ej. <em>join &lt;palabra&gt;</em> al <strong>+1 415 523 8886</strong>).
                  </p>
                </div>
              </div>
            )}
            {modo === 'meta_test' && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p><strong>Prueba de Meta:</strong> solo WhatsApp, solo contactos autorizados para prueba y la plantilla fija <code>hello_world</code> en inglés. Meta enviará “Hello World”; el mensaje que escribas abajo no se enviará.</p>
              </div>
            )}
          </div>

          {/* Segment Selector */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-800 text-xs">Elegir Segmento de Afiliados</label>
            <select
              value={selectedSegmentId}
              onChange={e => setSelectedSegmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {segments.map(seg => (
                <option key={seg.id} value={seg.id}>
                  {seg.nombre} ({segmentActiveCount(seg, contacts)} contacto{segmentActiveCount(seg, contacts) === 1 ? '' : 's'} activo{segmentActiveCount(seg, contacts) === 1 ? '' : 's'})
                </option>
              ))}
            </select>
          </div>

          {/* Volume Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Cantidad estimada de destinatarios:</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {effectiveRecipientCount.toLocaleString()} personas
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">{modo === 'demo' ? 'Costo del envío:' : `Costo estimado (${canal}):`}</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                {modo === 'demo' ? 'Sin costo real (simulación)' : modo === 'meta_test' ? 'Tarifas de Meta (si aplica)' : costConfigured ? `$${estimatedTotalCost.toFixed(2)} USD*` : 'Tarifa no configurada'}
                </span>
              </div>
            </div>

            {/* Consent Validation Feedback */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {eligibleRecipients.length} {eligibleRecipients.length === 1 ? 'contacto cumple' : 'contactos cumplen'} las políticas de consentimiento
              </span>
              {excludedRecipients.length > 0 && (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {excludedRecipients.length} excluidos por falta de consentimiento
                </span>
              )}
            </div>

            {/* List of excluded contacts if any */}
            {excludedRecipients.length > 0 && (
              <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 text-[11px] text-rose-800 space-y-1">
                <p className="font-bold">Protección Automática de Consentimiento:</p>
                <p>
                  {excludedRecipients.slice(0, 2).map(ex => `${ex.contact.nombres} (${ex.reason})`).join(', ')}
                  {excludedRecipients.length > 2 && ` ... y ${excludedRecipients.length - 2} más`}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
            >
              Atrás
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={effectiveRecipientCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              <span>Continuar al Mensaje</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: MENSAJE & MOCKUP */}
      {/* ========================================================= */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Message Editor & Variables */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Paso 3: Redacción del Mensaje</h2>
              <p className="text-xs text-slate-500">Personalice el contenido mediante variables dinámicas y plantillas</p>
            </div>

            {/* Approved WhatsApp Templates */}
            {canal !== 'sms' && (
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs">
                  Plantilla Aprobada de WhatsApp (Obligatoria para ventanas de 24h)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WHATSAPP_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        plantillaWA === tmpl.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] truncate">{tmpl.nombre}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{tmpl.categoria}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variable Insertion Pills */}
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Variables Disponibles (Haga clic para insertar):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'nombre',
                  'apellido',
                  'evento',
                  'fecha',
                  'hora',
                  'lugar'
                ].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-mono font-medium transition-colors"
                  >
                    + {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  Cuerpo del Mensaje *
                </label>
                {canal === 'sms' && (
                  <span className={`text-[11px] font-mono font-semibold ${
                    isSmsOverLimit ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {smsLength} / 160 caracteres ({smsSegmentsCount} SMS)
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={mensajeTexto}
                onChange={e => setMensajeTexto(e.target.value)}
                placeholder="Escriba aquí el comunicado..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>

            {/* SMS 160 chars warning */}
            {canal === 'sms' && isSmsOverLimit && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Mensaje supera los 160 caracteres estándar de SMS:</p>
                  <p className="text-[11px] mt-0.5 text-amber-800">
                    Se facturará como <strong>{smsSegmentsCount} partes SMS</strong> concatenadas por cada contacto.
                  </p>
                </div>
              </div>
            )}

            {/* WhatsApp 24h compliance notice */}
            {canal !== 'sms' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cumplimiento Meta / WhatsApp:</strong> Las difusiones masivas comerciales o informativas fuera de la ventana de 24 horas requieren plantillas HSM verificadas.
                </span>
              </div>
            )}

            {/* Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
              >
                Atrás
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!mensajeTexto.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors disabled:opacity-50"
              >
                <span>Continuar a Revisión</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right 5 Cols: Phone Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[310px]">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vista Previa en Dispositivo
                </span>
                <p className="text-[10px] text-slate-400">
                  Simulando para: <strong>{previewContact?.nombres || 'Contacto Demo'}</strong>
                </p>
              </div>

              {/* Phone Frame */}
              <div className="w-full rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                {/* Phone Screen */}
                <div className="bg-[#EFEAE2] rounded-[26px] overflow-hidden min-h-[440px] flex flex-col relative text-slate-900">
                  {/* WhatsApp/SMS Status Bar */}
                  <div className={`p-3 text-white flex items-center gap-2.5 ${
                    canal === 'sms' ? 'bg-[#1E293B]' : 'bg-[#075E54]'
                  }`}>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      CM
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-none truncate">
                        {canal === 'sms' ? 'Mensajería SMS' : 'Conecta Masivo Oficial'}
                      </p>
                      <p className="text-[10px] opacity-80 mt-0.5">Cuenta Institucional</p>
                    </div>
                  </div>

                  {/* Chat Content Body */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {/* Timestamp Bubble */}
                    <div className="text-center">
                      <span className="px-2 py-0.5 bg-white/70 backdrop-blur-xs rounded-md text-[9px] text-slate-600 font-semibold shadow-2xs">
                        Hoy 10:30
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[88%] p-3 rounded-xl shadow-xs text-xs leading-relaxed ${
                      canal === 'sms'
                        ? 'bg-blue-600 text-white rounded-tr-none ml-auto'
                        : 'bg-[#DCF8C6] text-slate-900 rounded-tl-none mr-auto'
                    }`}>
                      <p className="whitespace-pre-line break-words text-[11px]">
                        {renderedPreviewText}
                      </p>
                      <div className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                        canal === 'sms' ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        <span>10:30</span>
                        {canal !== 'sms' && <span>✓✓</span>}
                      </div>
                    </div>
                  </div>

                  {/* Input Mockup Footer */}
                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 text-slate-400 text-xs">
                    <span className="flex-1 px-3 py-1 bg-white rounded-full text-[11px] text-slate-400">
                      Respuesta deshabilitada en demo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 4: REVISIÓN Y ENVÍO */}
      {/* ========================================================= */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 4: Verificación Final y Autorización</h2>
            <p className="text-xs text-slate-500">Revise cuidadosamente el resumen de la campaña antes de ejecutar el despacho</p>
          </div>

          {/* Review Summary Grid */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Nombre de Campaña:</span>
                <span className="font-bold text-slate-900 text-sm">{nombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tipo de Notificación:</span>
                <span className="font-bold text-slate-800 capitalize">{tipo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Canal:</span>
                <span className="font-bold text-slate-800 uppercase">{canal}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Modo Seleccionado:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  modo === 'demo' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {modo === 'demo' ? 'Modo Demo · Simulación (no envía mensajes)' : modo === 'meta_test' ? 'Modo Prueba Meta · Plantilla hello_world' : 'Modo Prueba Twilio Sandbox'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Segmento Destinatario:</span>
                <span className="font-semibold text-slate-800">{selectedSegment?.nombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Destinatarios Verificados:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {effectiveRecipientCount.toLocaleString()} contactos
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Programación:</span>
                <span className="font-semibold text-slate-800">
                  {programacion === 'ahora' ? 'Inmediato al confirmar' : `Programado: ${fechaProgramada}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Costo Estimado:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  {modo === 'demo' ? 'Sin costo real (simulación)' : costConfigured ? `$${estimatedTotalCost.toFixed(2)} USD*` : 'Tarifa no configurada'}
                </span>
              </div>
            </div>
            {modo === 'twilio_test' && costConfigured && <p className="mt-3 text-[10px] text-slate-500">*Estimado según las tarifas configuradas; el cargo final lo determina Twilio.</p>}

            <div className="pt-3 border-t border-slate-200">
              <span className="text-slate-400 block text-[11px] mb-1">Mensaje que recibirán:</span>
              <p className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed">
                {modo === 'meta_test' ? 'Hello World (plantilla de prueba aprobada por Meta; idioma en_US)' : mensajeTexto}
              </p>
            </div>
          </div>

          {/* Mandatory Checkbox: "Confirmo que los destinatarios autorizaron recibir mensajes" */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="chk-consent-confirm"
                type="checkbox"
                checked={consentConfirmed}
                onChange={e => setConsentConfirmed(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-blue-950 text-xs block">
                  Confirmo que los destinatarios autorizaron recibir mensajes (Consentimiento Verificado)
                </span>
                <span className="text-[11px] text-blue-800 leading-relaxed block mt-0.5">
                  Declaro bajo responsabilidad de la organización que los números seleccionados cuentan con opt-in voluntario y que la difusión cumple con las normas de privacidad y términos de servicio del proveedor.
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50"
            >
              Atrás
            </button>
            <button
              id="btn-execute-campaign"
              onClick={() => setShowConfirmModal(true)}
              disabled={!consentConfirmed}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0C2A5A] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>{programacion === 'programado' ? 'Programar Campaña' : 'Ejecutar Envío de Campaña'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Actual Sending */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 text-[#0C2A5A] rounded-xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Confirmar {modo === 'demo' ? 'simulación' : 'envío de prueba'}?</h3>
                <p className="text-xs text-slate-500">{modo === 'demo' ? 'Se registrarán resultados simulados; no saldrán mensajes.' : 'Se enviará por Twilio a los contactos elegibles del Sandbox.'}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-4">
              <p><strong>Campaña:</strong> {nombre}</p>
              <p><strong>Destinatarios:</strong> {effectiveRecipientCount.toLocaleString()} contactos</p>
              <p><strong>Modo:</strong> {modo === 'demo' ? 'Demo (sin envío real)' : 'Prueba Twilio Sandbox'}</p>
              <p><strong>Estimación:</strong> {modo === 'demo' ? 'Sin costo real (simulación)' : costConfigured ? `$${estimatedTotalCost.toFixed(2)} USD*` : 'Tarifa no configurada; Twilio podría cobrar'}</p>
            </div>

            {isSending ? (
              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{sendingProgress.message || 'Despachando mensajes...'}</span>
                  <span>{sendingProgress.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${sendingProgress.pct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Procesando {sendingProgress.current} de {sendingProgress.total} contactos...
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeCampaignDispatch}
                  className="px-5 py-2 bg-[#0C2A5A] text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors shadow-xs"
                >
                  Sí, Enviar Ahora
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
