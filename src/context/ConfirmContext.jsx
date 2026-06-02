import React, { createContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

export const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [confirmDialog, setConfirmDialog] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...options,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Hapus', cancelText = 'Batal', isDanger = true }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-[#1f2028] rounded-[24px] shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex justify-between items-start gap-4 p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="min-w-0">
            <h3 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed break-words">{message}</p>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-[14px] text-white transition-colors ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                : 'bg-[#05A845] hover:bg-[#048A38] dark:bg-[#05A845] dark:hover:bg-[#048A38]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
}
