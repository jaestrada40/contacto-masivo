import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, description, confirmLabel, destructive = false, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
      <div className="mb-3 flex items-start gap-3">
        <span className={`rounded-xl p-2.5 ${destructive ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}><AlertTriangle className="h-5 w-5" /></span>
        <div><h2 id="confirm-dialog-title" className="font-bold text-slate-900">{title}</h2><p id="confirm-dialog-description" className="mt-1 text-sm text-slate-600">{description}</p></div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="button" onClick={() => void onConfirm()} className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0C2A5A] hover:bg-blue-900'}`}>{confirmLabel}</button>
      </div>
    </section>
  </div>
);
