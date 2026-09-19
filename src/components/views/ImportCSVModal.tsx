import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Contact, User } from '../../types';
import { storageService } from '../../services/storageService';

interface ImportCSVModalProps {
  onClose: () => void;
  currentUser: User;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ onClose, currentUser }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<Partial<Contact>[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
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
    setErrorMsg('');
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setErrorMsg('El archivo CSV debe contener al menos un encabezado y una fila de datos.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const contacts: Partial<Contact>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2) {
            contacts.push({
              nombres: cols[0] || 'Contacto',
              apellidos: cols[1] || 'Importado',
              telefono: cols[2] || '+50255550000',
              email: cols[3] || 'contacto.importado@correo.gt',
              zona: cols[4] || 'Zona 1',
              grupo: cols[5] || 'Importación Masiva CSV',
              consentimientoWhatsApp: cols[6]?.toUpperCase() !== 'NO',
              consentimientoSMS: cols[7]?.toUpperCase() !== 'NO',
              fuenteConsentimiento: cols[8] || 'Carga masiva por CSV verificado',
            });
          }
        }

        setParsedRows(contacts);
      } catch (err) {
        setErrorMsg('Error al procesar el archivo CSV. Asegúrese de que tenga formato delimitado por comas.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;

    let imported = 0;
    parsedRows.forEach((row, idx) => {
      const newContact: Contact = {
        id: `cnt-imp-${Date.now()}-${idx}`,
        nombres: row.nombres || 'Nombre',
        apellidos: row.apellidos || 'Apellido',
        dpi: `2000 ${String(10000 + idx)} 0101`,
        telefono: row.telefono || `+502 5555 ${String(1000 + idx)}`,
        email: row.email || `afiliado${idx}@correo.gt`,
        departamento: 'Guatemala',
        zona: row.zona || 'Zona 1',
        grupo: row.grupo || 'Afiliados Importados CSV',
        fechaRegistro: new Date().toISOString().split('T')[0],
        consentimientoWhatsApp: row.consentimientoWhatsApp ?? true,
        consentimientoSMS: row.consentimientoSMS ?? true,
        estado: 'activo',
        fechaConsentimiento: new Date().toISOString().split('T')[0],
        fuenteConsentimiento: row.fuenteConsentimiento || 'Carga masiva CSV verificada',
        esNumeroPruebaTwilio: false,
      };

      storageService.saveContact(newContact, currentUser);
      imported++;
    });

    setSuccessCount(imported);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadSample = () => {
    const sample = 
      'nombres,apellidos,telefono,email,zona,grupo,consentimiento_whatsapp,consentimiento_sms,fuente_consentimiento\n' +
      'Estuardo David,Alonzo Morales,+502 5123 4567,estuardo@correo.gt,Zona 1,Afiliados Nuevos,SI,SI,Formulario físico firmado\n' +
      'María René,Zepeda Cordero,+502 4890 1234,maria@correo.gt,Zona 10,Voluntariado 2026,SI,NO,Registro en feria comunitaria\n' +
      'Pedro Antonio,Linares Paiz,+502 5901 8877,pedro@correo.gt,Zona 7,Comité Central,NO,SI,Portal de registro web';

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

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Se importaron con éxito {successCount} contactos! Actualizando tabla...</span>
          </div>
        )}

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
