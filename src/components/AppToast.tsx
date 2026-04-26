import React from 'react';
import { useToast } from '../composables/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import './AppToast.css';

export default function AppToast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="app-toast-wrapper">
      <div className="app-toast-list">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`app-toast app-toast--${toast.type}`}
            role="status"
          >
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
