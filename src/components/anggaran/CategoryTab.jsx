import React, { useRef, useState } from 'react';
import { ChevronDown, Pencil, Sparkles, Home, ShoppingBag, TrendingUp, CreditCard, Tag } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const colorStyles = {
  green: {
    icon: 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] border border-[#05A845]/10 dark:border-[#05A845]/20',
  },
  yellow: {
    icon: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20',
  },
  blue: {
    icon: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  },
  purple: {
    icon: 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20',
  },
  pink: {
    icon: 'bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20',
  },
  orange: {
    icon: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20',
  },
  red: {
    icon: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  },
  teal: {
    icon: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20',
  },
};

const budgetStatusStyles = {
  safe: {
    bar: 'bg-[#05A845] dark:bg-[#2ee879]',
    text: 'text-[#05A845] dark:text-[#2ee879]',
  },
  warning: {
    bar: 'bg-yellow-500 dark:bg-yellow-400',
    text: 'text-yellow-600 dark:text-yellow-300',
  },
  danger: {
    bar: 'bg-red-500 dark:bg-red-400',
    text: 'text-red-600 dark:text-red-300',
  },
};

const getBudgetStatus = (percent) => {
  if (percent >= 90) return budgetStatusStyles.danger;
  if (percent >= 70) return budgetStatusStyles.warning;
  return budgetStatusStyles.safe;
};

function getCategoryIcon(icon) {
  switch (icon) {
    case 'home':
      return <Home size={18} />;
    case 'shopping':
      return <ShoppingBag size={18} />;
    case 'trending':
      return <TrendingUp size={18} />;
    case 'credit':
      return <CreditCard size={18} />;
    default:
      return <Tag size={18} />;
  }
}

export default function CategoryTab({
  categories = [],
  selectedPeriod,
  monthOptions = [],
  onSelectedPeriodChange,
  setIsEditBudgetOpen,
}) {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthDropdownRef = useRef(null);
  const totalLimit = categories.reduce((sum, item) => sum + (Number(item.limit) || 0), 0);
  const totalSpent = categories.reduce((sum, item) => sum + (Number(item.spent) || 0), 0);
  const remainingBudget = Math.max(totalLimit - totalSpent, 0);
  const usedPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const safeUsedPercent = Math.max(0, Math.min(usedPercent, 100));
  const remainingPercent = Math.max(0, 100 - safeUsedPercent);
  const summaryStatus = getBudgetStatus(usedPercent);

  const mostUsedCategory = [...categories]
    .filter((category) => Number(category.limit) > 0)
    .sort((a, b) => (Number(b.spent) / Number(b.limit)) - (Number(a.spent) / Number(a.limit)))[0];

  const selectedMonthLabel = monthOptions.find((option) => option.value === selectedPeriod)?.label || 'Pilih bulan';

  useClickOutside(monthDropdownRef, () => setIsMonthOpen(false), isMonthOpen);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
          Ringkasan Kategori
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="relative min-w-0" ref={monthDropdownRef}>
            <button
              type="button"
              onClick={() => setIsMonthOpen((value) => !value)}
              className={`flex w-full items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1f2028] border rounded-xl text-[13px] text-[#1A1A1A] dark:text-white font-medium shadow-sm min-w-0 transition-colors ${isMonthOpen ? 'border-[#05A845]' : 'border-gray-200 dark:border-[#2e303a]'}`}
              aria-expanded={isMonthOpen}
            >
              <span className="break-words">{selectedMonthLabel}</span>
              <ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMonthOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-full min-w-[190px] overflow-hidden rounded-xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] shadow-lg">
                <div className="max-h-64 overflow-y-auto py-1">
                  {monthOptions.map((option) => {
                    const isSelected = option.value === selectedPeriod;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onSelectedPeriodChange?.(option.value);
                          setIsMonthOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${isSelected ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditBudgetOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors shadow-sm w-full"
          >
            <Pencil size={16} className="shrink-0" /> Sesuaikan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-8">
        <div className="bg-white dark:bg-[#1f2028] rounded-[24px] p-5 sm:p-6 border border-gray-100 dark:border-[#2e303a] shadow-sm flex flex-col justify-center min-w-0">
          <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1 break-words">
            Total Sisa Anggaran
          </p>
          <h2 className="text-[26px] sm:text-[28px] font-bold text-[#05A845] mb-4 break-words">
            {formatIDR(remainingBudget)}
          </h2>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[12px] font-medium mb-2">
            <span className={`break-words ${summaryStatus.text}`}>Terpakai {safeUsedPercent}%</span>
            <span className="text-gray-400 dark:text-gray-500 break-words">Sisa {remainingPercent}%</span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
            <div className={`${summaryStatus.bar} h-full rounded-full transition-all duration-1000`} style={{ width: `${safeUsedPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-[24px] p-5 sm:p-6 border border-[#05A845]/20 dark:border-[#05A845]/25 flex gap-4 items-start min-w-0">
          <div className="w-10 h-10 bg-white dark:bg-[#1f2028] rounded-full flex items-center justify-center text-[#05A845] shrink-0 shadow-sm">
            <Sparkles size={20} />
          </div>

          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-[#05A845] mb-2 break-words">
              Smart Budget AI
            </h3>
            <p className="text-[#1A1A1A] dark:text-gray-100 text-[14px] leading-relaxed break-words">
              {mostUsedCategory ? (
                <>
                  Pengeluaran untuk <span className="font-bold">{mostUsedCategory.title}</span> sedang paling tinggi dibanding limitnya. Cek lagi kebutuhan non-esensial agar sisa anggaran tetap aman.
                </>
              ) : (
                'Tambahkan limit kategori agar Finly bisa membaca pola pengeluaranmu dengan lebih akurat.'
              )}
            </p>
          </div>
        </div>
      </div>

      <h3 className="text-[16px] font-bold text-[#1A1A1A] dark:text-white mb-4 break-words">
        Detail Kategori
      </h3>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-[#1f2028] rounded-[20px] p-6 border border-dashed border-gray-200 dark:border-[#2e303a] text-center">
          <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 break-words">
            Belum ada kategori anggaran. Klik tombol Sesuaikan untuk menambahkan kategori baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {categories.map((category) => (
            <BudgetCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetCard({ category }) {
  const spent = Number(category.spent) || 0;
  const total = Number(category.limit) || 0;
  const rawPercent = total > 0 ? Math.round((spent / total) * 100) : 0;
  const safePercent = Math.max(0, Math.min(rawPercent, 100));
  const style = colorStyles[category.color] || colorStyles.green;
  const status = getBudgetStatus(rawPercent);

  return (
    <div className="bg-white dark:bg-[#1f2028] rounded-[20px] p-5 sm:p-6 border border-gray-100 dark:border-[#2e303a] shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-start gap-3 mb-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.icon}`}>
          {getCategoryIcon(category.icon)}
        </div>
        <div className="min-w-0">
          <h4 className="text-[15px] font-bold text-[#1A1A1A] dark:text-white break-words">
            {category.title}
          </h4>
          {!category.isDefault && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Kategori custom
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 mb-3 min-w-0">
        <span className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
          {formatIDR(spent)}
        </span>
        <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 break-words">
          / {formatIDR(total)}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-full bg-gray-100 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
          <div className={`${status.bar} h-full rounded-full transition-all duration-1000`} style={{ width: `${safePercent}%` }}></div>
        </div>
        <span className={`text-[12px] font-bold w-8 text-right shrink-0 ${status.text}`}>
          {rawPercent}%
        </span>
      </div>

      {spent > total && (
        <div className="inline-block px-2 py-1 rounded-full text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
          Over Budget
        </div>
      )}
    </div>
  );
}
