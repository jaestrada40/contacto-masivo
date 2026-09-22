import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, Download } from 'lucide-react';
import { Contact } from '../../types';
import { api } from '../../services/api';
import { showToast } from '../../services/toast';

interface ImportCSVModalProps {
  onClose: () => void;
  onImported: () => Promise<void>;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ onClose, onImported }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<Partial<Contact>[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast('El archivo CSV debe contener al menos un encabezado y una fila de datos.', 'error');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
        const contacts: Partial<Contact>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2) {
            const value = (names: string[], fallback: number) => {
              const index = headers.findIndex(header => names.includes(header));
              return cols[index >= 0 ? index : fallback] || '';
            };
            contacts.push({
              nombres: value(['nombres', 'nombre', 'first_name'], 0),
              apellidos: value(['apellidos', 'apellido', 'last_name'], 1),
              telefono: value(['telefono', 'phone'], 2),
              email: value(['email', 'correo'], 3),
              departamento: value(['departamento', 'department'], -1),
              zona: value(['zona', 'zone', 'municipio'], 4),
              grupo: value(['grupo', 'group'], 5),
              consentimientoWhatsApp: ['SI', 'SÍ', 'YES', 'TRUE'].includes(value(['consentimiento_whatsapp', 'whatsapp_opt_in'], 6).toUpperCase()),
              consentimientoSMS: ['SI', 'SÍ', 'YES', 'TRUE'].includes(value(['consentimiento_sms', 'sms_opt_in'], 7).toUpperCase()),
              fuenteConsentimiento: value(['fuente_consentimiento', 'consent_source'], 8) || 'Carga masiva por CSV verificado',
            });
          }
        }

        setParsedRows(contacts);
      } catch (err) {
        showToast('Error al procesar el archivo CSV. Asegúrese de que tenga formato delimitado por comas.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = async () => {
    if (parsedRows.length === 0) return;
    try {
      const result = await api.importContacts(parsedRows.map(row => ({
        firstName: row.nombres?.trim(), lastName: row.apellidos?.trim(), phone: row.telefono?.replace(/\s+/g, ''),
        email: row.email || undefined, department: row.departamento || undefined, zone: row.zona || undefined,
        groupName: row.grupo || undefined, whatsappOptIn: Boolean(row.consentimientoWhatsApp), smsOptIn: Boolean(row.consentimientoSMS),
        consentSource: row.fuenteConsentimiento || undefined, status: 'ACTIVE', isTwilioTestNumber: false,
      })));
      setSuccessCount(result.imported);
      if (result.imported) showToast(`Se importaron ${result.imported} contactos.`, 'success');
      if (result.failed) showToast(`${result.failed} filas no se pudieron importar; revise nombres, apellidos, teléfono E.164 y consentimiento.`, 'error');
      await onImported();
      if (!result.failed) setTimeout(onClose, 500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo importar el archivo.', 'error');
    }
  };

  const handleDownloadSample = () => {
    const sample = 'nombres,apellidos,telefono,email,departamento,zona,grupo,consentimiento_whatsapp,consentimiento_sms,fuente_consentimiento\n';

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_contactos_conecta_masivo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Importar Contactos desde CSV</h3>
            <p className="text-xs text-slate-500">Cargue lotes de contactos con registro de consentimiento</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Haga clic para seleccionar o arrastre y suelte su archivo CSV aquí
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Formato admitido: .CSV con codificación UTF-8</p>
        </div>

        {/* Template Download Button */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">¿No tiene la estructura correcta?</span>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar plantilla CSV de ejemplo</span>
          </button>
        </div>

        {/* Parsed Preview */}
        {parsedRows.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                Vista previa: {parsedRows.length} contactos detectados
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Listo para procesar
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs text-slate-600">
              {parsedRows.slice(0, 5).map((row, idx) => (
                <div key={idx} className="p-1.5 bg-white rounded border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{row.nombres} {row.apellidos}</span>
                  <span className="font-mono text-[11px] text-slate-500">{row.telefono}</span>
                </div>
              ))}
              {parsedRows.length > 5 && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  ... y {parsedRows.length - 5} contactos más
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyImport}
            disabled={parsedRows.length === 0 || successCount !== null}
            className="px-4 py-2 bg-[#0C2A5A] text-white rounded-lg text-xs font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Importar {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
