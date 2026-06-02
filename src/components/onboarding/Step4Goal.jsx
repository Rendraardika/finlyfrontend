import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Step4_Tujuan({ formData, handleChange, handleSimulateAI, loading, setStep }) {
  const optionCardClass = (isSelected) => `cursor-pointer rounded-xl border-2 transition-all min-w-0 ${
    isSelected
      ? 'border-[#05A845] bg-[#EAF6ED]/40 dark:bg-[#05A845]/10 shadow-sm'
      : 'border-gray-100 dark:border-[#2e303a] hover:border-[#05A845]/30 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
  }`;

  return (
    <div className="max-w-[650px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-[26px] font-bold text-[#1A1A1A] dark:text-white mb-3">
          Tujuan Keuangan
        </h1>
        <p className="text-[#666666] dark:text-gray-400 text-[14px]">
          Bantu Finly memahami targetmu agar strategi alokasi anggaran dari AI bisa disesuaikan.
        </p>
      </div>

      <div className="space-y-8 mb-8">
        <div>
          <label className="block text-[14px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Apa Tujuan Utamamu Saat Ini?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'dana_darurat', label: 'Membangun Dana Darurat', desc: 'Menyiapkan uang simpanan untuk kondisi tak terduga.' },
              { id: 'melunasi_utang', label: 'Melunasi Utang', desc: 'Fokus mengurangi beban cicilan atau pinjaman.' },
              { id: 'atur_pengeluaran', label: 'Mengatur Pengeluaran', desc: 'Membatasi gaya hidup agar tidak boros bulanan.' },
              { id: 'tabungan_tujuan', label: 'Menabung Target', desc: 'Menyisihkan uang demi impian (gadget, liburan, dll).' },
              { id: 'investasi', label: 'Mulai Investasi', desc: 'Mengembangkan aset jangka panjang lewat instrumen finansial.' }
            ].map((goal) => {
              const isSelected = formData.tujuan_keuangan === goal.id;

              return (
                <div
                  key={goal.id}
                  onClick={() => handleChange('tujuan_keuangan', goal.id)}
                  className={`${optionCardClass(isSelected)} p-4 text-left flex flex-col gap-1`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-bold text-[14px] text-[#1A1A1A] dark:text-white break-words">
                      {goal.label}
                    </span>
                    {isSelected && <CheckCircle2 size={16} className="text-[#05A845] shrink-0 mt-0.5" />}
                  </div>

                  <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal break-words">
                    {goal.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Kapan Target Ini Ingin Dicapai?
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'kurang_6_bulan', label: '< 6 Bulan' },
              { id: '6_12_bulan', label: '6 - 12 Bulan' },
              { id: '1_3_tahun', label: '1 - 3 Tahun' },
              { id: 'lebih_3_tahun', label: '> 3 Tahun' }
            ].map((time) => {
              const isSelected = formData.horizon_tujuan === time.id;

              return (
                <div
                  key={time.id}
                  onClick={() => handleChange('horizon_tujuan', time.id)}
                  className={`${optionCardClass(isSelected)} py-3 px-2 text-center text-[13px] font-bold ${isSelected ? 'text-[#05A845]' : 'text-gray-500 dark:text-gray-400'} break-words`}
                >
                  {time.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 dark:border-[#2e303a] pt-6">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="px-8 py-3.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-bold text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors sm:w-auto w-full"
        >
          Kembali
        </button>

        <button
          onClick={handleSimulateAI}
          disabled={loading || !formData.tujuan_keuangan || !formData.horizon_tujuan}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#05A845] text-white font-bold text-[14px] hover:bg-[#048A38] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors w-full"
        >
          {loading ? 'AI Sedang Berhitung...' : 'Hitung Alokasi Anggaran'}
        </button>
      </div>
    </div>
  );
}
