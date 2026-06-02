import React from 'react';
import { X, TrendingUp, PieChart, Coins, Landmark, Bitcoin, Gem, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { mockInvestmentInsight } from '../../services/mockData';

const formatIDR = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(value || 0);

const allocationIconByType = {
  low: <Coins size={14} className="shrink-0" />,
  middle: <Landmark size={14} className="shrink-0" />,
  high: <Bitcoin size={14} className="shrink-0" />,
};

function AllocationBar({ icon, label, amount, percent, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-1 sm:gap-4">
        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 min-w-0 break-words">
          {icon} {label} ({percent}%)
        </span>
        <span className="font-bold text-[#1A1A1A] dark:text-white sm:whitespace-nowrap break-words">{amount}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-white/[0.08] rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

export function InstrumentDetailModal({ instrument, onClose }) {
  const { showWarning } = useToast();
  if (!instrument) return null;

  const handleBuy = () => {
    showWarning('Fitur Beli/Investasi sedang dipersiapkan. Coba lagi nanti.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-md md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-start gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#EAF6ED] dark:bg-[#05A845]/10 flex items-center justify-center font-bold text-[14px] text-[#05A845] border border-[#05A845]/10 dark:border-[#05A845]/20 shadow-sm shrink-0">
              {instrument.code.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <h3 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">{instrument.code}</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium break-words">{instrument.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 bg-gray-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-gray-100 dark:border-[#2e303a]">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Info Terkini</p>
              <p className="text-[22px] md:text-[24px] font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">{instrument.price}</p>
            </div>
            <div className={`w-fit px-3 py-1.5 rounded-lg text-[13px] font-bold ${instrument.change > 0 ? 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845]' : instrument.change < 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400' : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400'}`}>
              {instrument.change > 0 ? '+' : ''}{instrument.change}%
            </div>
          </div>

          <div>
            <p className="text-[13px] font-bold text-[#1A1A1A] dark:text-white mb-2">Ringkasan Instrumen</p>
            <p className="text-[13px] text-[#666666] dark:text-gray-400 leading-relaxed break-words">{instrument.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-[#2e303a] pt-6">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 mb-1">Keterangan</p>
              <p className="text-[14px] font-bold text-[#1A1A1A] dark:text-white break-words">{instrument.marketCap}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 mb-1">Tingkat Risiko</p>
              <p className="text-[14px] font-bold text-[#1A1A1A] dark:text-white break-words">{instrument.risk}</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse sm:flex-row gap-2 md:gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button onClick={onClose} className="w-full sm:flex-1 py-3 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-white dark:hover:bg-white/[0.04] transition-colors">Tutup</button>
          <button onClick={handleBuy} className="w-full sm:flex-1 py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors">Beli / Investasi</button>
        </div>
      </div>
    </div>
  );
}

export function AIInsightModal({ isOpen, onClose, riskProfile }) {
  if (!isOpen) return null;

  const allocations = mockInvestmentInsight.allocations[riskProfile] || mockInvestmentInsight.allocations.Moderat;

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-start gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-500/20">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">Analisis Portofolio AI</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium break-words">Berdasarkan profil {riskProfile} kamu</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
          <div>
            <h4 className="text-[14px] font-bold text-[#1A1A1A] dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#05A845] shrink-0" /> Asal Potensi Dana
            </h4>
            <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-4 border border-gray-100 dark:border-[#2e303a] space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-1">
                <span className="text-gray-500 dark:text-gray-400">Rata-rata Pemasukan</span>
                <span className="font-semibold text-[#1A1A1A] dark:text-white break-words">{formatIDR(mockInvestmentInsight.averageIncome)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-1">
                <span className="text-gray-500 dark:text-gray-400">Estimasi Pengeluaran Pokok</span>
                <span className="font-semibold text-red-500 break-words">- {formatIDR(mockInvestmentInsight.basicExpense)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-1">
                <span className="text-gray-500 dark:text-gray-400">Alokasi Darurat</span>
                <span className="font-semibold text-blue-500 break-words">- {formatIDR(mockInvestmentInsight.emergencyAllocation)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-[#2e303a] pt-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-[13px] font-bold text-[#1A1A1A] dark:text-white">Potensi Investasi</span>
                <span className="text-[15px] font-bold text-[#05A845] break-words">{formatIDR(mockInvestmentInsight.potentialInvestment)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-[#1A1A1A] dark:text-white mb-3 flex items-center gap-2">
              <PieChart size={16} className="text-[#05A845] shrink-0" /> Strategi Alokasi {formatIDR(mockInvestmentInsight.potentialInvestment)}
            </h4>
            <div className="space-y-4">
              {allocations.map((allocation) => (
                <AllocationBar
                  key={allocation.type}
                  icon={allocationIconByType[allocation.type]}
                  label={allocation.label}
                  amount={formatIDR(allocation.amount)}
                  percent={allocation.percent}
                  color={allocation.color}
                />
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl p-4 flex gap-3">
            <Gem size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-yellow-700 dark:text-yellow-300 leading-relaxed break-words">
              Angka ini berasal dari data demo FE. Saat backend siap, bagian ini tinggal diarahkan ke hasil analisis backend dan data real user.
            </p>
          </div>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] bg-gray-50 dark:bg-white/[0.02] flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] font-semibold text-[14px] hover:bg-black dark:hover:bg-gray-100 transition-colors w-full sm:w-auto">Mengerti</button>
        </div>
      </div>
    </div>
  );
}
