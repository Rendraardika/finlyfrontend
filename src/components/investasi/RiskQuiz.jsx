import React, { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

export const investmentQuizQuestions = [
  {
    id: 1,
    key: 'q_loss_reaction',
    section: 'Profil Risiko',
    icon: AlertTriangle,
    question: 'Jika nilai investasi turun 20% dalam sebulan, apa reaksi Anda?',
    helper: 'Pertanyaan ini mengukur toleransi terhadap fluktuasi nilai investasi.',
    type: 'single',
    options: [
      { label: 'Jual semua sebelum rugi lebih besar', value: 'jual_semua' },
      { label: 'Jual sebagian untuk mengurangi risiko', value: 'jual_sebagian' },
      { label: 'Tahan dan tunggu pemulihan', value: 'tahan' },
      { label: 'Tambah beli karena harga sedang murah', value: 'tambah_beli' },
    ],
  },
  {
    id: 2,
    key: 'q_sleep_factor',
    section: 'Profil Risiko',
    icon: Clock,
    question: 'Seberapa sering kamu memeriksa nilai investasimu?',
    helper: 'Frekuensi memantau investasi membantu membaca kenyamananmu terhadap volatilitas.',
    type: 'single',
    options: [
      { label: 'Setiap hari atau lebih sering', value: 'setiap_hari' },
      { label: 'Beberapa kali seminggu', value: 'seminggu' },
      { label: 'Sebulan sekali', value: 'sebulan' },
      { label: 'Jarang, hanya saat ada berita besar', value: 'jarang' },
    ],
  },
  {
    id: 3,
    key: 'q_knowledge',
    section: 'Profil Risiko',
    icon: BarChart3,
    question: 'Seberapa familiar kamu dengan instrumen investasi?',
    helper: 'Pengalaman investasi menentukan kompleksitas instrumen yang cocok ditampilkan.',
    type: 'single',
    options: [
      { label: 'Belum familiar dengan investasi apapun', value: 'belum_tahu' },
      { label: 'Familiar dengan reksa dana atau deposito', value: 'reksa_dana' },
      { label: 'Pernah beli saham atau ETF', value: 'saham_dasar' },
      { label: 'Aktif berinvestasi di berbagai instrumen', value: 'aktif' },
    ],
  },
  {
    id: 4,
    key: 'preferences',
    section: 'Preferensi Instrumen',
    icon: SlidersHorizontal,
    question: 'Instrumen apa yang paling menarik buatmu?',
    helper: 'Boleh pilih lebih dari satu. Ini membantu personalisasi daftar instrumen.',
    type: 'multi',
    options: [
      { label: 'Saham', value: 'Saham' },
      { label: 'Reksa Dana', value: 'Reksa Dana' },
      { label: 'Emas', value: 'Emas' },
      { label: 'Obligasi/SBN', value: 'Obligasi/SBN' },
      { label: 'Crypto', value: 'Crypto' },
      { label: 'Belum tahu', value: 'Belum tahu' },
    ],
  },
];

export const INVESTMENT_AMOUNT_STEP = 0;
export const INVESTMENT_QUIZ_TOTAL_STEPS = investmentQuizQuestions.length;

const formatNumberInput = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));
const parseNumberInput = (value) => Number(String(value || '').replace(/\D/g, '')) || 0;

export default function RiskQuiz({
  currentStep,
  answers = {},
  budgetAmount = 0,
  isSubmitting = false,
  onAnswerChange,
  onNext,
  onPrevious,
}) {
  const isAmountStep = currentStep === INVESTMENT_AMOUNT_STEP;
  const currentQ = isAmountStep ? null : investmentQuizQuestions[currentStep - 1] || investmentQuizQuestions[0];
  const Icon = currentQ?.icon || Wallet;
  const totalSteps = INVESTMENT_QUIZ_TOTAL_STEPS + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentAnswer = currentQ ? answers[currentQ.key] : null;
  const amountAnswer = answers.investment_amount_source || {};
  const amountSource = amountAnswer.source || 'budget';
  const manualAmountRaw = amountAnswer.manualAmount ?? amountAnswer.value ?? '';
  const manualAmount = Number(manualAmountRaw || 0);
  const manualDisplayValue = manualAmountRaw === '' ? '' : formatNumberInput(manualAmountRaw);
  const selectedAmount = amountSource === 'manual' ? manualAmount : Number(budgetAmount || 0);
  const selectedValue = currentAnswer?.value;

  const sectionSteps = useMemo(() => ({
    'Dana Investasi': [0],
    'Profil Risiko': [1, 2, 3],
    'Preferensi Instrumen': [4],
  }), []);

  const hasAnswer = (() => {
    if (isAmountStep) return selectedAmount > 0;
    if (currentQ.type === 'multi') return Array.isArray(selectedValue) && selectedValue.length > 0;
    return Boolean(selectedValue);
  })();

  const updateAnswer = (value) => {
    if (!currentQ) return;
    onAnswerChange({
      key: currentQ.key,
      value,
    });
  };

  const updateAmountSource = (source, value = selectedAmount) => {
    const nextValue = source === 'manual' ? value : Number(value || 0);
    onAnswerChange({
      key: 'investment_amount_source',
      value: nextValue,
      source,
      manualAmount: source === 'manual' ? nextValue : manualAmountRaw,
      budgetAmount,
    });
  };

  const toggleOption = (value) => {
    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];

    if (value === 'Belum tahu') {
      updateAnswer(currentValues.includes(value) ? [] : [value]);
      return;
    }

    const withoutUnknown = currentValues.filter((item) => item !== 'Belum tahu');
    const nextValues = withoutUnknown.includes(value)
      ? withoutUnknown.filter((item) => item !== value)
      : [...withoutUnknown, value];

    updateAnswer(nextValues);
  };

  return (
    <div className="w-full min-h-[calc(100dvh-120px)] flex flex-col font-sans animate-in fade-in duration-300">
      <section className="relative flex-1 w-full flex flex-col bg-white dark:bg-[#1f2028] rounded-[28px] border border-gray-100 dark:border-[#2e303a] shadow-sm overflow-hidden">
        {isSubmitting && (
          <div className="absolute inset-0 z-30 bg-white/88 dark:bg-[#1f2028]/88 backdrop-blur-sm flex items-center justify-center px-6">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 mx-auto mb-5 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-4 border-[#05A845]/20 border-t-[#05A845] animate-spin" />
              </div>
              <h2 className="text-[22px] font-black text-[#1A1A1A] dark:text-white">
                AI Sedang Memproses Profil Anda
              </h2>
              <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
                Finly sedang membaca jawaban, nominal investasi, dan profil anggaranmu.
              </p>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#1f2028]/95 backdrop-blur px-4 sm:px-6 lg:px-8 py-5 border-b border-gray-100 dark:border-[#343c48]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-[#05A845] dark:text-[#2ee879] mb-1">
                {isAmountStep ? 'Dana Investasi' : currentQ.section}
              </p>
              <h1 className="text-[22px] sm:text-[24px] font-bold text-[#1A1A1A] dark:text-white break-words">
                Kuis Profil Investasi
              </h1>
            </div>

            <div className="w-full lg:w-[280px]">
              <div className="flex items-center justify-between mb-2 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
                <span>Langkah {currentStep + 1}</span>
                <span>{totalSteps} total</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#05A845] dark:bg-[#2ee879] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {Object.entries(sectionSteps).map(([section, steps]) => (
              <div key={section} className="flex items-center gap-2 shrink-0">
                {steps.map((step) => {
                  const isCurrent = step === currentStep;
                  const isDone = step < currentStep;

                  return (
                    <div
                      key={step}
                      title={section}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[12px] font-bold transition-colors ${
                        isCurrent
                          ? 'bg-[#05A845] border-[#05A845] text-white'
                          : isDone
                            ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 border-[#05A845]/20 text-[#05A845] dark:text-[#2ee879]'
                            : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-[#343c48] text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isDone ? <Check size={14} /> : step + 1}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col">
          <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-14 h-14 bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-2xl flex items-center justify-center mb-5 text-[#05A845] dark:text-[#2ee879]">
                <Icon size={26} />
              </div>
              <h2 className="text-[24px] sm:text-[28px] lg:text-[30px] font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">
                {isAmountStep ? 'Berapa dana yang ingin kamu investasikan bulan ini?' : currentQ.question}
              </h2>
              <p className="mt-3 text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed break-words">
                {isAmountStep
                  ? 'Pilih nominal dari anggaran investasi Finly atau masukkan nominal sendiri. Nominal ini akan dipakai model untuk menyusun alokasi.'
                  : currentQ.helper}
              </p>
            </div>

            {isAmountStep && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => updateAmountSource('budget', Number(budgetAmount || 0))}
                  className={`w-full p-5 rounded-2xl border text-left transition-all flex gap-4 ${
                    amountSource === 'budget'
                      ? 'border-[#05A845] bg-[#EAF6ED]/70 dark:bg-[#05A845]/10'
                      : 'border-gray-100 dark:border-[#343c48] hover:border-[#05A845] hover:bg-[#EAF6ED]/40 dark:hover:bg-[#05A845]/10'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-100 dark:border-[#343c48] text-[#05A845] flex items-center justify-center shrink-0">
                    <Wallet size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <h3 className="font-bold text-[#1A1A1A] dark:text-white">Gunakan anggaran investasi Finly</h3>
                      <span className="font-black text-[#05A845]">Rp {formatNumberInput(budgetAmount || 0)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                      Diambil dari hasil Smart Allocation atau anggaran investasi yang tersedia.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateAmountSource('manual', manualAmountRaw)}
                  className={`w-full p-5 rounded-2xl border text-left transition-all flex gap-4 ${
                    amountSource === 'manual'
                      ? 'border-[#05A845] bg-[#EAF6ED]/70 dark:bg-[#05A845]/10'
                      : 'border-gray-100 dark:border-[#343c48] hover:border-[#05A845] hover:bg-[#EAF6ED]/40 dark:hover:bg-[#05A845]/10'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-100 dark:border-[#343c48] text-[#05A845] flex items-center justify-center shrink-0">
                    <Edit3 size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white">Masukkan nominal sendiri</h3>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                      Gunakan opsi ini jika kamu ingin mencoba skenario investasi berbeda.
                    </p>
                    {amountSource === 'manual' && (
                      <div className="mt-4 border-b-2 border-gray-200 dark:border-[#343c48] pb-2 focus-within:border-[#05A845] transition-colors">
                        <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1.000.000"
                          value={manualDisplayValue}
                          onChange={(event) => {
                            const rawValue = event.target.value;
                            updateAmountSource('manual', rawValue.trim() === '' ? '' : parseNumberInput(rawValue));
                          }}
                          onFocus={(event) => event.target.select()}
                          className="w-full bg-transparent text-[26px] sm:text-[32px] font-bold text-[#1A1A1A] dark:text-white outline-none"
                        />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            )}

            {!isAmountStep && currentQ.type === 'single' && (
              <div className="divide-y divide-gray-100 dark:divide-[#343c48] border-y border-gray-100 dark:border-[#343c48]">
                {currentQ.options.map((option, index) => {
                  const selected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateAnswer(option.value)}
                      className={`w-full min-h-[68px] py-4 text-left transition-colors flex items-center gap-4 ${
                        selected
                          ? 'text-[#05A845] dark:text-[#2ee879]'
                          : 'text-[#1A1A1A] dark:text-white hover:text-[#05A845] dark:hover:text-[#2ee879]'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-[13px] font-bold shrink-0 ${
                        selected
                          ? 'bg-[#05A845] border-[#05A845] text-white'
                          : 'border-gray-200 dark:border-[#343c48] text-gray-400 dark:text-gray-300'
                      }`}>
                        {selected ? <Check size={15} /> : index + 1}
                      </span>
                      <span className="flex-1 font-semibold text-[14px] leading-relaxed break-words">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!isAmountStep && currentQ.type === 'multi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-100 dark:border-[#343c48] divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-[#343c48]">
                {currentQ.options.map((option) => {
                  const selected = Array.isArray(selectedValue) && selectedValue.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className={`min-h-[58px] p-4 text-left transition-colors flex items-center gap-3 ${
                        selected
                          ? 'bg-[#EAF6ED]/60 dark:bg-[#05A845]/10 text-[#05A845] dark:text-[#2ee879]'
                          : 'text-[#1A1A1A] dark:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-[#05A845] border-[#05A845] text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selected && <Check size={13} />}
                      </span>
                      <span className="font-semibold text-[14px] break-words">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-100 dark:border-[#343c48] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-[#343c48] text-gray-600 dark:text-gray-300 font-semibold text-[13px] sm:text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft size={16} />
            {isAmountStep ? 'Kembali ke Awal' : 'Sebelumnya'}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasAnswer || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[13px] sm:text-[14px] hover:bg-[#048A38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses...' : currentStep === INVESTMENT_QUIZ_TOTAL_STEPS ? 'Lihat Rekomendasi' : 'Lanjut'}
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
