import React from 'react';
import { Plus, Home, ShoppingBag, CreditCard, Pencil, Trash2 } from 'lucide-react';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const iconClasses = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  green: 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] border border-[#05A845]/10 dark:border-[#05A845]/20',
};

function getDebtIcon(icon) {
  switch (icon) {
    case 'home':
      return <Home size={20} />;
    case 'shopping':
      return <ShoppingBag size={20} />;
    default:
      return <CreditCard size={20} />;
  }
}

function getRemaining(debt) {
  return Math.max(0, (Number(debt.total) || 0) - (Number(debt.paid) || 0));
}

function getPercent(debt) {
  const total = Number(debt.total) || 0;
  if (!total) return 0;
  return Math.min(100, Math.round(((Number(debt.paid) || 0) / total) * 100));
}

function getEstimatedPaidOff(debt) {
  if (debt.estimatedPaidOffDate) {
    return formatDateID(debt.estimatedPaidOffDate);
  }

  if (debt.estimatedRemainingMonths) {
    const date = new Date();
    date.setMonth(date.getMonth() + Number(debt.estimatedRemainingMonths));
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date);
  }

  const remaining = getRemaining(debt);
  const monthly = Number(debt.monthly) || 0;

  if (!remaining) return 'Lunas';
  if (!monthly) return 'Belum Terjadwal';

  const months = Math.ceil(remaining / monthly);
  return `${months} Bulan`;
}

const formatDateID = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function DebtTab({ debts = [], onAddDebt, onEditDebt, onDeleteDebt }) {
  const totalRemainingDebt = debts.reduce((sum, item) => sum + getRemaining(item), 0);

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-red-50 dark:bg-red-500/10 rounded-[24px] p-6 md:p-8 border border-red-100 dark:border-red-500/20 shadow-sm gap-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-red-500 dark:text-red-400 mb-1 uppercase tracking-wider break-words">
            Sisa Utang Keseluruhan
          </h3>
          <p className="text-[30px] sm:text-[32px] font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">
            {formatIDR(totalRemainingDebt)}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2 break-words">
            {debts.length} catatan utang/cicilan aktif
          </p>
        </div>

        <button
          onClick={onAddDebt}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold text-[14px] hover:bg-red-600 shadow-sm transition-colors w-full md:w-auto"
        >
          <Plus size={18} className="shrink-0" /> Catat Pinjaman / Cicilan
        </button>
      </div>

      <div className="bg-white dark:bg-[#1f2028] rounded-[24px] border border-gray-100 dark:border-[#2e303a] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#2e303a] flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <h3 className="text-[16px] font-bold text-[#1A1A1A] dark:text-white break-words">
            Daftar Utang & Cicilan Aktif
          </h3>
        </div>

        {debts.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-gray-500 dark:text-gray-400">
            Belum ada catatan utang atau cicilan.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-[#2e303a]">
            {debts.map((debt) => (
              <DebtItem
                key={debt.id}
                debt={debt}
                onEdit={onEditDebt}
                onDelete={onDeleteDebt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DebtItem({ debt, onEdit, onDelete }) {
  const total = Number(debt.total) || 0;
  const remaining = getRemaining(debt);
  const percent = getPercent(debt);
  const estLunas = getEstimatedPaidOff(debt);
  const color = iconClasses.red;
  const isComplete = remaining === 0 && total > 0;

  return (
    <div className="p-5 sm:p-6 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
            {getDebtIcon(debt.icon)}
          </div>

          <div className="min-w-0">
            <h4 className="text-[15px] font-bold text-[#1A1A1A] dark:text-white mb-1 break-words">
              {debt.name}
            </h4>
            <span className={`inline-flex mb-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${debt.debtType === 'loan' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'}`}>
              {debt.debtType === 'loan' ? 'Pinjaman' : 'Cicilan'}
            </span>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-1.5 break-words">
              Target per bulan:{' '}
              <span className="text-[#1A1A1A] dark:text-white">
                {debt.monthly ? formatIDR(debt.monthly) : 'Fleksibel'}
              </span>
            </p>
            <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium mb-1.5 break-words">
              Jatuh tempo pelunasan: <span className="text-gray-600 dark:text-gray-300">{formatDateID(debt.dueDate)}</span>
            </p>
            {isComplete ? (
              <p className="text-[11px] font-bold text-[#05A845] bg-[#EAF6ED] dark:bg-[#05A845]/20 px-2 py-0.5 rounded w-fit border border-[#05A845]/20 dark:border-[#05A845]/30">
                Lunas
              </p>
            ) : (
              <p className="text-[11px] font-bold text-[#05A845] bg-[#EAF6ED] dark:bg-[#05A845]/20 px-2 py-0.5 rounded w-fit border border-[#05A845]/20 dark:border-[#05A845]/30">
                Est. Lunas: {estLunas}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[auto_auto] items-stretch sm:items-center gap-3 border-t lg:border-t-0 border-gray-100 dark:border-[#2e303a] pt-4 lg:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 mb-1">Sisa Utang</p>
            <p className="text-[16px] font-bold text-red-500 dark:text-red-400 whitespace-nowrap">{formatIDR(remaining)}</p>
          </div>

          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(debt)}
              aria-label={`Edit ${debt.name}`}
              title="Edit"
              className="w-9 h-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 hover:text-[#05A845] focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 transition-colors flex items-center justify-center"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(debt.id)}
              aria-label={`Hapus ${debt.name}`}
              title="Hapus"
              className="w-9 h-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-full bg-gray-100 dark:bg-white/[0.08] rounded-full h-2 overflow-hidden">
          <div className="bg-[#05A845] h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
        </div>
        <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 w-10 text-right shrink-0">{percent}%</span>
      </div>
      <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex justify-between gap-2 font-medium">
        <span>0%</span>
        <span className="text-right break-words">Total: {formatIDR(total)}</span>
      </div>
    </div>
  );
}
