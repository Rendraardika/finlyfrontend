import React from 'react';
import { ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';

const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Math.abs(Number(amount || 0)));

export default function TransactionStats({ summary }) {
  const totalIncome = summary?.total_income ?? summary?.totalIncome ?? 0;
  const totalExpense = summary?.total_expense ?? summary?.totalExpense ?? 0;
  const netBalance = summary?.net_balance ?? summary?.balance ?? (totalIncome - totalExpense);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-[#1f2028] p-6 rounded-[24px] border border-gray-100 dark:border-[#2e303a] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-[#EAF6ED] dark:bg-[#05A845]/10 flex items-center justify-center text-[#05A845]">
            <ArrowDownRight size={20} />
          </div>
          <span className="text-[13px] font-medium text-[#666666] dark:text-gray-400">Total Pemasukan</span>
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-[#05A845] leading-none mb-2">{formatIDR(totalIncome)}</h2>

        </div>
      </div>

      <div className="bg-white dark:bg-[#1f2028] p-6 rounded-[24px] border border-gray-100 dark:border-[#2e303a] shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
            <ArrowUpRight size={20} />
          </div>
          <span className="text-[13px] font-medium text-[#666666] dark:text-gray-400">Total Pengeluaran</span>
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-red-500 leading-none mb-2">{formatIDR(totalExpense)}</h2>

        </div>
      </div>

      <div className="bg-[#05A845] dark:bg-gradient-to-br dark:from-[#05A845] dark:to-[#048A38] p-6 rounded-[24px] shadow-lg shadow-green-600/20 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <PiggyBank size={20} />
          </div>
          <span className="text-[13px] font-medium text-green-50">Selisih Bersih</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-[28px] font-bold leading-none mb-2">{formatIDR(netBalance)}</h2>
          <p className="text-[13px] text-green-100">{netBalance >= 0 ? 'Arus kas positif' : 'Arus kas negatif'}</p>
        </div>
      </div>
    </div>
  );
}
