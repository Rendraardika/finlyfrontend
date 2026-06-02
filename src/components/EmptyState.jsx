import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';

/**
 * @param {object} props
 * @param {string} props.icon
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} props.buttonText
 * @param {function} props.onButtonClick
 * @param {string} props.buttonType
 */
export default function EmptyState({
  icon = 'empty',
  title = 'Belum ada data',
  message = 'Mulai dengan menambahkan data pertamamu.',
  buttonText = null,
  onButtonClick = null,
  buttonType = 'primary',
}) {
  const getIconComponent = () => {
    switch (icon) {
      case 'error':
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-500/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-yellow-600 dark:text-yellow-500" />
          </div>
        );
      default: // 'empty'
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
            <Plus size={32} className="text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {getIconComponent()}
      <h3 className="text-[16px] font-bold text-gray-700 dark:text-gray-300 mb-2">
        {title}
      </h3>
      <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 max-w-[300px]">
        {message}
      </p>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[14px] transition-colors ${
            buttonType === 'primary'
              ? 'bg-[#05A845] text-white hover:bg-[#048A38]'
              : 'border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Plus size={18} />
          {buttonText}
        </button>
      )}
    </div>
  );
}
