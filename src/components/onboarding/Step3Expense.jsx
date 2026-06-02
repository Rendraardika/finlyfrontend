import React from 'react';
import { ArrowRight, CheckCircle2, Plus, X, Pencil, Receipt } from 'lucide-react';

export default function Step3_Pengeluaran({
  displayOptions, selectedSubs, customOptions, toggleSubscription,
  updateSubPrice, removeCustomOption, showCustomInput, setShowCustomInput,
  customName, setCustomName, customPrice, handleCustomPriceChange,
  addCustomSubscription, totalFixedCost, incomeNum, formatRupiah, handleNext, setStep
}) {
  const optionCardClass = (isSelected) => `cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center text-center gap-2 relative transition-all min-w-0 ${
    isSelected
      ? 'border-[#05A845] bg-[#EAF6ED]/40 dark:bg-[#05A845]/10'
      : 'border-gray-100 dark:border-[#2e303a] hover:border-[#05A845]/30 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
  }`;

  return (
    <div className="max-w-[700px] mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-[26px] font-bold text-[#1A1A1A] dark:text-white mb-3">
          Pengeluaran Rutin Bulanan
        </h1>
        <p className="text-[#666666] dark:text-gray-400 text-[14px]">
          Pilih pengeluaran rutin yang biasanya kamu bayar setiap bulan agar anggaranmu lebih realistis.
        </p>
      </div>

      <div className="mb-6 space-y-6">
        {/* KEBUTUHAN TETAP */}
        <div>
          <h4 className="text-[14px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Kebutuhan Tetap
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {displayOptions.filter(sub => ['kos', 'wifi', 'pln', 'bpjs'].includes(sub.id)).map((sub) => {
              const isSelected = selectedSubs.find(item => item.id === sub.id);

              return (
                <div
                  key={sub.id}
                  onClick={() => toggleSubscription(sub)}
                  className={optionCardClass(isSelected)}
                >
                  {isSelected && (
                    <CheckCircle2 size={16} className="absolute top-2 left-2 text-[#05A845]" />
                  )}

                  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2d36] shadow-sm flex items-center justify-center border border-gray-50 dark:border-[#3a3d46] shrink-0">
                    {sub.icon}
                  </div>

                  <p className="font-bold text-[#1A1A1A] dark:text-white text-[12px] leading-tight break-words">
                    {sub.name}
                  </p>

                  {isSelected ? (
                    <div className="flex items-center justify-center gap-1.5 border-b border-[#05A845]/50 pb-0.5 w-full mt-1 min-w-0">
                      <Pencil size={12} className="text-[#05A845] shrink-0" />
                      <input
                        type="text"
                        value={formatRupiah(String(isSelected.defaultPrice))}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSubPrice(sub.id, e.target.value)}
                        className="w-full min-w-0 text-center bg-transparent text-[#05A845] font-bold text-[12px] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1 break-words">
                      ~ {formatRupiah(String(sub.defaultPrice))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PENGELUARAN LAINNYA */}
        <div>
          <h4 className="text-[14px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
            Langganan & Pengeluaran Lainnya
          </h4>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-3">
            Tambahkan langganan, cicilan, atau pengeluaran rutin lain yang kamu bayar setiap bulan.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...displayOptions.filter(sub => ['netflix', 'spotify'].includes(sub.id)), ...customOptions].map((sub) => {
              const isSelected = selectedSubs.find(item => item.id === sub.id);

              return (
                <div
                  key={sub.id}
                  onClick={() => toggleSubscription(sub)}
                  className={optionCardClass(isSelected)}
                >
                  {isSelected && (
                    <CheckCircle2 size={16} className="absolute top-2 left-2 text-[#05A845]" />
                  )}

                  {sub.isCustom && (
                    <button
                      onClick={(e) => removeCustomOption(sub.id, e)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors z-10"
                    >
                      <X size={16} />
                    </button>
                  )}

                  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2d36] shadow-sm flex items-center justify-center border border-gray-50 dark:border-[#3a3d46] shrink-0">
                    {sub.icon}
                  </div>

                  <p className="font-bold text-[#1A1A1A] dark:text-white text-[12px] leading-tight break-words">
                    {sub.name}
                  </p>

                  {isSelected ? (
                    <div className="flex items-center justify-center gap-1.5 border-b border-[#05A845]/50 pb-0.5 w-full mt-1 min-w-0">
                      <Pencil size={12} className="text-[#05A845] shrink-0" />
                      <input
                        type="text"
                        value={formatRupiah(String(isSelected.defaultPrice))}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSubPrice(sub.id, e.target.value)}
                        className="w-full min-w-0 text-center bg-transparent text-[#05A845] font-bold text-[12px] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1 break-words">
                      ~ {formatRupiah(String(sub.defaultPrice))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Custom */}
        <div className="mb-8">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-[#2e303a] rounded-xl flex items-center justify-center gap-2 text-[#05A845] font-bold text-[14px] hover:border-[#05A845]/50 hover:bg-[#EAF6ED]/30 dark:hover:bg-[#05A845]/5 transition-all"
            >
              <Plus size={18} /> Tambah Pengeluaran Lainnya
            </button>
          ) : (
            <div className="p-4 border border-gray-200 dark:border-[#2e303a] rounded-xl bg-gray-50 dark:bg-white/[0.02] flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-inner dark:shadow-none">
              <input
                placeholder="Nama (Cth: Cicilan Motor)"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="flex-1 min-w-0 font-sans px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl text-[14px] focus:outline-none focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616] placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <input
                placeholder="Nominal (Rp)"
                value={customPrice}
                onChange={handleCustomPriceChange}
                className="flex-1 min-w-0 font-sans px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl text-[14px] focus:outline-none focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616] placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="px-4 py-3 border border-gray-200 dark:border-[#2e303a] bg-white dark:bg-transparent rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={addCustomSubscription}
                  className="flex-1 sm:flex-none px-5 py-3 bg-[#1A1A1A] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-[#1A1A1A] rounded-xl font-bold text-[14px] transition-colors whitespace-nowrap"
                >
                  Tambah
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Total Ringkasan */}
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-4 border border-gray-200 dark:border-[#2e303a] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400 font-medium text-[13px]">
              Total Pengeluaran Rutin:
            </span>
            <span className={`text-[18px] font-bold break-words ${totalFixedCost > incomeNum ? 'text-red-500' : 'text-[#1A1A1A] dark:text-white'}`}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalFixedCost)}
            </span>
          </div>

          {totalFixedCost > incomeNum && (
            <p className="text-[12px] text-red-500 font-medium italic animate-in fade-in duration-300">
              * Pengeluaran rutinmu sudah melebihi pemasukan. Coba cek kembali nominalnya.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 dark:border-[#2e303a] pt-6">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-bold text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors sm:w-auto w-full"
        >
          Kembali
        </button>

        <button
          type="button"
          onClick={(e) => handleNext(e, 4)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#05A845] text-white font-bold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors w-full"
        >
          Lanjut <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
