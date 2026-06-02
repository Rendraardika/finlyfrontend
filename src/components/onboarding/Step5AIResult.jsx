import React from 'react';
import { ArrowRight, Lightbulb, ShoppingCart, Coffee, PiggyBank, CreditCard } from 'lucide-react';

const formatGoal = (goal) => {
  switch (goal) {
    case 'dana_darurat':
      return 'membangun dana darurat';
    case 'atur_pengeluaran':
      return 'mengatur pengeluaran bulanan';
    case 'melunasi_utang':
      return 'melunasi utang';
    case 'tabungan_tujuan':
      return 'menabung';
    case 'investasi':
      return 'memulai investasi';
    default:
      return 'merencanakan keuangan';
  }
};

const formatHorizon = (horizon) => {
  switch (horizon) {
    case 'kurang_6_bulan':
      return 'kurang dari 6 bulan';
    case '6_12_bulan':
      return '6 bulan hingga 1 tahun';
    case '1_3_tahun':
      return '1 hingga 3 tahun';
    case 'lebih_3_tahun':
      return 'lebih dari 3 tahun';
    default:
      return 'waktu yang ditentukan';
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

export default function Step5_HasilAI({
  formData,
  totalFixedCost,
  sisaUang,
  alokasiBase,
  incomeNum,
  recommendedBudget,
  loading,
  handleFinish,
}) {
  const backendAllocations = Array.isArray(recommendedBudget?.allocations)
    ? recommendedBudget.allocations
    : [];
  const fallbackAllocations = [
    {
      key: 'fixed',
      name: 'Pengeluaran Rutin',
      budget_group: 'debt',
      amount: totalFixedCost,
      percent: incomeNum > 0 ? Math.round((totalFixedCost / incomeNum) * 100) : 0,
      color: '#ef4444',
      icon: 'credit-card',
    },
    {
      key: 'needs',
      name: 'Kebutuhan Sehari-hari',
      budget_group: 'needs',
      amount: alokasiBase * 0.5,
      percent: incomeNum > 0 ? Math.round(((alokasiBase * 0.5) / incomeNum) * 100) : 0,
      color: '#05A845',
      icon: 'shopping-cart',
    },
    {
      key: 'wants',
      name: 'Hiburan & Lainnya',
      budget_group: 'wants',
      amount: alokasiBase * (formData.tujuan_keuangan === 'tabungan_tujuan' ? 0.3 : 0.4),
      percent: incomeNum > 0 ? Math.round(((alokasiBase * (formData.tujuan_keuangan === 'tabungan_tujuan' ? 0.3 : 0.4)) / incomeNum) * 100) : 0,
      color: '#05A845',
      icon: 'coffee',
    },
    {
      key: 'emergency_fund',
      name: 'Dana Darurat',
      budget_group: 'savings',
      amount: alokasiBase * 0.1,
      percent: incomeNum > 0 ? Math.round(((alokasiBase * 0.1) / incomeNum) * 100) : 0,
      color: '#05A845',
      icon: 'piggy-bank',
    },
    ...(formData.tujuan_keuangan === 'tabungan_tujuan'
      ? [{
          key: 'goal_saving',
          name: 'Tabungan Tujuan',
          budget_group: 'savings',
          amount: alokasiBase * 0.1,
          percent: incomeNum > 0 ? Math.round(((alokasiBase * 0.1) / incomeNum) * 100) : 0,
          color: '#14b8a6',
          icon: 'target',
        }]
      : []),
  ];

  const displayAllocations = backendAllocations.length > 0
    ? backendAllocations
    : fallbackAllocations.filter((item) => item.amount > 0 || item.key !== 'fixed');

  return (
    <div className="w-full max-w-[650px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500 space-y-6 sm:space-y-8">
      <div className="text-center">
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1A1A1A] dark:text-white mb-2 break-words">
          Rekomendasi Anggaran
        </h1>
        <p className="text-[#666666] dark:text-gray-400 text-[13px] sm:text-[14px] leading-relaxed break-words">
          Finly menyusun simulasi anggaran awal berdasarkan profil, pengeluaran rutin, dan referensi wilayah di Provinsi {formData.provinsi || 'domisilimu'}.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-[#2e303a] pb-2">
          1. Ringkasan Profil
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="min-w-0 border border-gray-100 dark:border-[#2e303a] rounded-xl p-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mb-0.5">
              Pendapatan
            </p>
            <p className="font-bold text-[13px] sm:text-[14px] text-[#1A1A1A] dark:text-white break-words">
              {formData.pemasukan_bulanan}
            </p>
          </div>

          <div className="min-w-0 border border-gray-100 dark:border-[#2e303a] rounded-xl p-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mb-0.5">
              Pengeluaran Rutin
            </p>
            <p className="font-bold text-[13px] sm:text-[14px] text-red-500 break-words">
              {formatCurrency(totalFixedCost)}
            </p>
          </div>

          <div className="min-w-0 border border-gray-100 dark:border-[#2e303a] rounded-xl p-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium mb-0.5">
              Sisa Fleksibel
            </p>
            <p className={`font-bold text-[13px] sm:text-[14px] break-words ${sisaUang < 0 ? 'text-red-500' : 'text-[#05A845]'}`}>
              {formatCurrency(sisaUang)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-[#2e303a] pb-2">
          2. Rekomendasi Utama AI
        </h3>

        <div className="bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start border border-[#d1ebd6] dark:border-[#05A845]/20 text-left">
          <div className="bg-white dark:bg-transparent p-2 rounded-xl shadow-sm dark:shadow-none shrink-0">
            <Lightbulb size={20} className="fill-current text-yellow-500" />
          </div>

          <div className="min-w-0">
            <h4 className="text-[#05A845] font-bold text-[13px] tracking-wide mb-1 uppercase">
              Analisis Finly
            </h4>

            {sisaUang < 0 ? (
              <p className="text-[#1A1A1A] dark:text-gray-100 text-[13px] sm:text-[14px] leading-relaxed break-words">
                <strong className="text-red-500">Peringatan Defisit: </strong>
                Tagihan atau pengeluaran rutinmu sudah melebihi total pendapatan bulanan. Finly menyarankan untuk mengevaluasi ulang langganan opsional sebelum mulai membagi anggaran lainnya.
              </p>
            ) : (
              <p className="text-[#1A1A1A] dark:text-gray-100 text-[13px] sm:text-[14px] leading-relaxed break-words">
                {recommendedBudget?.ai_insight || recommendedBudget?.smart_allocation?.recommendation_note || (
                  <>
                    Sesuai tujuanmu untuk <strong>{formatGoal(formData.tujuan_keuangan)}</strong> dalam jangka waktu <strong>{formatHorizon(formData.horizon_tujuan)}</strong>, Finly menyarankan pembagian anggaran berbasis data onboarding dan baseline wilayah.
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-[#2e303a] pb-2">
          3. Pembagian Anggaran Bulanan
        </h3>

        <div className="space-y-5 text-left bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-[#2e303a] rounded-2xl p-4 sm:p-5 shadow-sm">
          {displayAllocations.map((allocation) => (
            <BudgetItem
              key={allocation.key || allocation.budget_group || allocation.name}
              icon={iconForAllocation(allocation)}
              title={allocation.name || allocation.label || allocation.budget_group}
              amount={allocation.amount}
              percent={Number(allocation.percent || 0)}
              color={allocation.color ? '' : 'bg-[#05A845]'}
              styleColor={allocation.color}
            />
          ))}
        </div>
      </div>

      <div className="pt-2 sm:pt-4">
        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-[#05A845] text-white font-bold text-[14px] sm:text-[15px] hover:bg-[#048A38] transition-colors shadow-sm"
        >
          <span className="break-words">{loading ? 'Menyimpan...' : 'Simpan Profil & Buka Dashboard'}</span>
          <ArrowRight size={18} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}

function iconForAllocation(allocation) {
  const key = String(allocation.key || allocation.budget_group || '').toLowerCase();
  if (key.includes('want')) return <Coffee size={16} />;
  if (key.includes('saving') || key.includes('emergency') || key.includes('investment')) return <PiggyBank size={16} />;
  if (key.includes('debt') || key.includes('fixed')) return <CreditCard size={16} />;
  return <ShoppingCart size={16} />;
}

function BudgetItem({ icon, title, amount, percent, color = 'bg-[#05A845]', styleColor = null }) {
  const formattedAmount = formatCurrency(amount);
  const rawPercent = Number.isFinite(percent) ? percent : 0;
  const safePercent = Math.max(0, Math.min(rawPercent, 100));
  const isOverBudget = rawPercent > 100;

  return (
    <div className="min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
        <div className="flex items-center gap-2 text-[#1A1A1A] dark:text-white font-medium text-[14px] min-w-0">
          <span className="text-gray-400 shrink-0">{icon}</span>
          <span className="break-words">{title}</span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 min-w-0">
          <span className={`font-semibold text-[14px] break-words min-w-0 text-right ${isOverBudget ? 'text-red-500' : 'text-[#1A1A1A] dark:text-white'}`}>
            {formattedAmount}
          </span>
          <span className={`text-[13px] w-10 text-right shrink-0 ${isOverBudget ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
            {rawPercent}%
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-white/[0.08] rounded-full h-2 overflow-hidden">
        <div
          className={`${isOverBudget ? 'bg-red-500' : color} h-2 rounded-full transition-all duration-1000 ease-out`}
          style={{
            width: `${safePercent}%`,
            ...(styleColor && !isOverBudget ? { backgroundColor: styleColor } : {}),
          }}
        />
      </div>

      {isOverBudget && (
        <p className="text-[11px] text-red-500 mt-1 font-medium italic">
          *Melebihi total pendapatanmu
        </p>
      )}
    </div>
  );
}
