import React, { createContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => addToast(message, 'success'), [addToast]);
  const showError = useCallback((message) => addToast(message, 'error'), [addToast]);
  const showWarning = useCallback((message) => addToast(message, 'warning'), [addToast]);
  const showInfo = useCallback((message) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none md:bottom-6 md:right-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-[#EAF6ED] dark:bg-[#05A845]/20',
          border: 'border-[#05A845]/30 dark:border-[#05A845]/40',
          icon: <CheckCircle size={20} className="text-[#05A845] shrink-0" />,
          text: 'text-[#05A845]',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-500/20',
          border: 'border-red-200 dark:border-red-500/40',
          icon: <AlertCircle size={20} className="text-red-500 shrink-0" />,
          text: 'text-red-700 dark:text-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-500/20',
          border: 'border-yellow-200 dark:border-yellow-500/40',
          icon: <AlertCircle size={20} className="text-yellow-600 shrink-0" />,
          text: 'text-yellow-700 dark:text-yellow-200',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-500/20',
          border: 'border-blue-200 dark:border-blue-500/40',
          icon: <Info size={20} className="text-blue-500 shrink-0" />,
          text: 'text-blue-700 dark:text-blue-200',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          border: 'border-gray-300 dark:border-gray-600',
          icon: <Info size={20} className="text-gray-600 dark:text-gray-300 shrink-0" />,
          text: 'text-gray-800 dark:text-gray-200',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm ${styles.bg} ${styles.border} border rounded-2xl p-4 flex items-start gap-3 shadow-lg dark:shadow-2xl`}
    >
      {styles.icon}
      <span className={`${styles.text} text-[13px] md:text-[14px] font-medium flex-1 break-words`}>
        {toast.message}
      </span>
      <button
        onClick={onClose}
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors shrink-0 p-1"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
