import React, { useState } from 'react';
import { Home, Calculator, Percent, Calendar, Wallet } from 'lucide-react';

function parseNumber(value) {
  const cleaned = String(value || '').replace(/[^0-9]/g, '');
  return Number(cleaned || 0);
}

function parseDecimal(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  return Number.parseFloat(normalized) || 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value || 0);
}

function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.round(value || 0));
}

function calculateMonthlyPayment(principal, annualRate, months) {
  if (!principal || !months) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}

function calculateRemainingPrincipal(principal, annualRate, paidMonths, monthlyPayment) {
  if (!principal || !paidMonths) return principal;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.max(0, principal - monthlyPayment * paidMonths);
  const remaining = principal * Math.pow(1 + monthlyRate, paidMonths) - monthlyPayment * ((Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate);
  return Math.max(0, remaining);
}

function calculateKpr(form) {
  const loanPrincipal = Math.max(0, form.housePrice - form.downPaymentAmount);
  const totalMonths = Math.max(1, form.tenorYears * 12);
  const monthlyPayment = calculateMonthlyPayment(loanPrincipal, form.interestRate, totalMonths);
  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanPrincipal);

  const floatingStartMonth = Math.min(Math.max(0, form.floatingStartYear * 12), totalMonths);
  const remainingMonths = Math.max(1, totalMonths - floatingStartMonth);
  const remainingAtFloating = calculateRemainingPrincipal(loanPrincipal, form.interestRate, floatingStartMonth, monthlyPayment);
  const floatingMonthlyPayment = calculateMonthlyPayment(remainingAtFloating, form.floatingRate, remainingMonths);

  return { loanPrincipal, monthlyPayment, totalPayment, totalInterest, remainingAtFloating, floatingMonthlyPayment };
}

function buildFutureDate(years) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + Number(years || 0));
  return date.toISOString().slice(0, 10);
}

export default function KprSimulator({ onSaveAsDebt }) {
  const [form, setForm] = useState({
    housePrice: 800000000,
    downPaymentAmount: 160000000,
    downPaymentPercent: 20,
    tenorYears: 15,
    interestRate: 9,
    floatingRate: 12,
    floatingStartYear: 5,
    useCustomFloating: false,
  });

  const handleHousePriceChange = (value) => {
    const housePrice = parseNumber(value);
    setForm(prev => ({
      ...prev,
      housePrice,
      downPaymentAmount: Math.round((housePrice * prev.downPaymentPercent) / 100),
    }));
  };

  const handleDownPaymentAmountChange = (value) => {
    const downPaymentAmount = parseNumber(value);
    setForm(prev => ({
      ...prev,
      downPaymentAmount,
      downPaymentPercent: prev.housePrice ? Number(((downPaymentAmount / prev.housePrice) * 100).toFixed(1)) : 0,
    }));
  };

  const handleDownPaymentPercentChange = (value) => {
    const downPaymentPercent = parseDecimal(value);
    setForm(prev => ({
      ...prev,
      downPaymentPercent,
      downPaymentAmount: Math.round((prev.housePrice * downPaymentPercent) / 100),
    }));
  };

  const handleNumberChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: parseNumber(value) }));
  };

  const handleDecimalChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: parseDecimal(value) }));
  };

  const onToggleFloating = () => setForm(prev => ({ ...prev, useCustomFloating: !prev.useCustomFloating }));

  const result = calculateKpr(form);
  const handleSaveAsDebt = () => {
    if (!onSaveAsDebt) return;

    onSaveAsDebt({
      name: 'KPR Rumah',
      total: Math.round(result.loanPrincipal),
      monthly: Math.round(result.monthlyPayment),
      paid: 0,
      dueDate: buildFutureDate(form.tenorYears),
      color: 'red',
      icon: 'home',
      budgetGroup: 'debt',
      categoryName: 'Utang & Cicilan',
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-[#1A1A1A] dark:text-white mb-1 break-words">
          Simulasi KPR
        </h2>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 break-words">
          Hitung estimasi cicilan rumah berdasarkan harga, DP, tenor, dan bunga.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white dark:bg-[#1f2028] rounded-[24px] p-5 sm:p-6 border border-gray-100 dark:border-[#2e303a] shadow-sm min-w-0">
          <div className="flex items-start sm:items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
              <Home size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold text-[#1A1A1A] dark:text-white break-words">
                Data Properti
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 break-words">
                Isi data utama KPR di sini.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 min-w-0">
              <KprInput label="Harga Rumah" value={formatNumber(form.housePrice)} onChange={(e) => handleHousePriceChange(e.target.value)} prefix="Rp" />
            </div>

            <div className="min-w-0">
              <KprInput label="Uang Muka (DP)" value={formatNumber(form.downPaymentAmount)} onChange={(e) => handleDownPaymentAmountChange(e.target.value)} prefix="Rp" />
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 break-words">
                DP: {formatIDR(form.downPaymentAmount)}
              </p>
            </div>

            <KprInput label="DP (%)" value={form.downPaymentPercent} onChange={(e) => handleDownPaymentPercentChange(e.target.value)} suffix="%" />
            <KprInput label="Tenor" icon={<Calendar size={15} />} value={form.tenorYears} onChange={(e) => handleNumberChange('tenorYears', e.target.value)} suffix="tahun" />
            <KprInput label="Suku Bunga" icon={<Percent size={15} />} value={form.interestRate} onChange={(e) => handleDecimalChange('interestRate', e.target.value)} suffix="%" />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#2e303a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#1A1A1A] dark:text-white break-words">
                  Bunga Floating
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 break-words">
                  Opsional kalau ingin simulasi setelah masa fixed rate.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={form.useCustomFloating}
                  onChange={onToggleFloating}
                  className="w-4 h-4 rounded border-gray-300 dark:border-[#3a3d46] text-[#05A845] focus:ring-[#05A845] cursor-pointer"
                />
                <span className="text-[13px] font-semibold text-[#1A1A1A] dark:text-white">Aktifkan</span>
              </label>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${!form.useCustomFloating ? 'opacity-50 pointer-events-none' : ''}`}>
              <KprInput label="Bunga Floating Maksimum" value={form.floatingRate} onChange={(e) => handleDecimalChange('floatingRate', e.target.value)} suffix="% p.a." />
              <KprInput label="Floating Mulai Tahun Ke" value={form.floatingStartYear} onChange={(e) => handleNumberChange('floatingStartYear', e.target.value)} suffix="tahun" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f2028] rounded-[24px] p-5 sm:p-6 border border-gray-100 dark:border-[#2e303a] shadow-sm h-fit min-w-0">
          <div className="flex items-start sm:items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-xl flex items-center justify-center text-[#05A845] shrink-0">
              <Calculator size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold text-[#1A1A1A] dark:text-white break-words">
                Ringkasan
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 break-words">
                Perhitungan estimasi KPR.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 border border-[#05A845]/20 dark:border-[#05A845]/25 p-5 mb-5 min-w-0">
            <p className="text-[12px] font-bold text-[#05A845] uppercase tracking-wider mb-2 break-words">
              Cicilan Per Bulan
            </p>
            <p className="text-[24px] sm:text-[28px] font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">
              {formatIDR(result.monthlyPayment)}
            </p>
          </div>

          <div className="space-y-3">
            <ResultRow label="Pokok Pinjaman" value={formatIDR(result.loanPrincipal)} />
            <ResultRow label="Total Bunga" value={formatIDR(result.totalInterest)} />
            <ResultRow label="Total Pembayaran" value={formatIDR(result.totalPayment)} strong />
          </div>

          {form.useCustomFloating && (
            <div className="mt-5 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 rounded-2xl min-w-0">
              <p className="text-[12px] font-bold text-yellow-700 dark:text-yellow-400 mb-1 break-words">
                Estimasi Setelah Floating
              </p>
              <p className="text-[20px] font-bold text-[#1A1A1A] dark:text-white mb-1 break-words">
                {formatIDR(result.floatingMonthlyPayment)} / bulan
              </p>
              <p className="text-[12px] text-yellow-700 dark:text-yellow-300 leading-relaxed break-words">
                Mulai tahun ke-{form.floatingStartYear}, sisa pokok sekitar {formatIDR(result.remainingAtFloating)}.
              </p>
            </div>
          )}

          <div className="mt-5 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl flex gap-3">
            <Wallet size={18} className="text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed break-words">
              Hasil ini hanya estimasi. Biaya admin, asuransi, provisi, dan aturan bank belum dihitung.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAsDebt}
            className="mt-4 w-full rounded-xl bg-[#05A845] px-5 py-3 text-[14px] font-bold text-white shadow-sm hover:bg-[#048A38] transition-colors"
          >
            Catat sebagai Cicilan
          </button>
        </div>
      </div>
    </div>
  );
}

function KprInput({ label, icon, value, onChange, prefix, suffix }) {
  return (
    <div className="min-w-0">
      {label && (
        <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#1A1A1A] dark:text-white mb-2 break-words">
          {icon}
          <span className="break-words">{label}</span>
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-gray-500 dark:text-gray-400">
            {prefix}
          </span>
        )}

        <input
          type="text"
          value={value}
          onChange={onChange}
          className={`w-full min-w-0 h-11 rounded-xl border border-gray-200 dark:border-[#2e303a] bg-white dark:bg-[#161616] text-[14px] text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] ${prefix ? 'pl-11' : 'pl-4'} ${suffix ? 'pr-16' : 'pr-4'}`}
        />

        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value, strong }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[13px] border-b border-[#05A845]/10 dark:border-[#05A845]/20 pb-3 last:border-b-0 last:pb-0 min-w-0">
      <span className="text-gray-600 dark:text-gray-400 break-words">{label}</span>
      <span className={`font-bold break-words sm:text-right ${strong ? 'text-[#05A845]' : 'text-[#1A1A1A] dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}
