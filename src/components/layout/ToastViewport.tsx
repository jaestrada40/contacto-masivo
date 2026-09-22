import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastKind } from '../../services/toast';

type ToastItem = { id: number; message: string; kind: ToastKind };

export const ToastViewport: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind: ToastKind }>).detail;
      const id = Date.now() + Math.random();
      setItems(previous => [...previous, { id, ...detail }]);
      window.setTimeout(() => setItems(previous => previous.filter(item => item.id !== id)), 5000);
    };
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const styles = { success: 'border-emerald-200 bg-emerald-50 text-emerald-900', error: 'border-rose-200 bg-rose-50 text-rose-900', info: 'border-blue-200 bg-blue-50 text-blue-900' };
  return <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
    {items.map(item => {
      const Icon = icons[item.kind];
      return <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-3 text-sm shadow-lg ${styles[item.kind]}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{item.message}</span>
        <button onClick={() => setItems(previous => previous.filter(value => value.id !== item.id))} className="-mr-1 -mt-1 rounded p-1 opacity-70 hover:bg-black/5" aria-label="Cerrar notificación"><X className="h-4 w-4" /></button>
      </div>;
    })}
  </div>;
};
