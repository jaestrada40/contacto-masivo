export type ToastKind = 'success' | 'error' | 'info';

export function showToast(message: string, kind: ToastKind = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, kind } }));
}
