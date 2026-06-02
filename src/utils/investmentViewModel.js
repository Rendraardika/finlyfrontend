export const sentimentFilters = ['Semua Sentimen', 'Sangat Bullish', 'Bullish', 'Netral', 'Bearish', 'Sangat Bearish'];
export const periodFilters = ['1M', '3M', '6M', '1Y'];
export const lowRiskReturnOptions = [
  { value: 'Semua', label: 'Semua Periode' },
  { value: '1 Tahun', label: '1 Tahun' },
  { value: '3 Tahun', label: '3 Tahun' },
  { value: '1 Bulan', label: '1 Bulan' },
];
export const lowRiskFundTypeOptions = [
  { value: 'Semua', label: 'Semua jenis' },
  { value: 'Syariah', label: 'Syariah' },
  { value: 'Konvensional', label: 'Konvensional' },
];

export const FAVORITES_STORAGE_KEY = 'finlyInvestmentFavorites';
export const PRICE_ALERTS_STORAGE_KEY = 'finlyInvestmentPriceAlerts';
export const SMART_INVESTMENT_STORAGE_KEY = 'smartInvestmentOnboarding';
export const INVESTMENT_QUIZ_FINISHED_STORAGE_KEY = 'isQuizFinished';
export const INVESTMENT_RISK_PROFILE_STORAGE_KEY = 'riskProfile';
export const INVESTMENT_LEGACY_STORAGE_KEYS = [
  FAVORITES_STORAGE_KEY,
  PRICE_ALERTS_STORAGE_KEY,
  SMART_INVESTMENT_STORAGE_KEY,
  INVESTMENT_QUIZ_FINISHED_STORAGE_KEY,
  INVESTMENT_RISK_PROFILE_STORAGE_KEY,
];

export const getUserStorageId = (user) => (
  user?.id ||
  user?.user_id ||
  user?.email ||
  user?.phone ||
  'guest'
);

export const makeUserStorageKey = (key, user) => (
  `finly:user:${getUserStorageId(user)}:${key}`
);

export const getInvestmentStorageKeys = (user) => ({
  favorites: makeUserStorageKey(FAVORITES_STORAGE_KEY, user),
  priceAlerts: makeUserStorageKey(PRICE_ALERTS_STORAGE_KEY, user),
  smartInvestment: makeUserStorageKey(SMART_INVESTMENT_STORAGE_KEY, user),
  quizFinished: makeUserStorageKey(INVESTMENT_QUIZ_FINISHED_STORAGE_KEY, user),
  riskProfile: makeUserStorageKey(INVESTMENT_RISK_PROFILE_STORAGE_KEY, user),
});

export const clearLegacyInvestmentStorage = () => {
  try {
    INVESTMENT_LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch (_error) {
  }
};

export const profileCategoryId = {
  Konservatif: 'low',
  Moderat: 'middle',
  Agresif: 'high',
};

export const smartAllocationTemplates = {
  Konservatif: [
    { label: 'Reksa Dana Pasar Uang', description: 'likuiditas dan dana darurat', percent: 50, color: 'bg-blue-500' },
    { label: 'SBN Ritel', description: 'kupon stabil', percent: 30, color: 'bg-[#05A845]' },
    { label: 'Emas', description: 'lindung nilai', percent: 20, color: 'bg-teal-400' },
  ],
  Moderat: [
    { label: 'Saham IDX/Blue Chip', description: 'pertumbuhan utama', percent: 35, color: 'bg-blue-500' },
    { label: 'Reksa Dana Campuran', description: 'diversifikasi', percent: 30, color: 'bg-teal-400' },
    { label: 'SBN/Emas', description: 'jangkar risiko', percent: 25, color: 'bg-amber-500' },
    { label: 'Crypto', description: 'satelit kecil', percent: 10, color: 'bg-[#05A845]' },
  ],
  Agresif: [
    { label: 'Saham IDX/Blue Chip', description: 'pertumbuhan utama', percent: 45, color: 'bg-blue-500' },
    { label: 'Crypto', description: 'satelit agresif', percent: 20, color: 'bg-[#05A845]' },
    { label: 'Reksa Dana Saham', description: 'diversifikasi', percent: 20, color: 'bg-teal-400' },
    { label: 'SBN/Emas', description: 'jangkar risiko', percent: 15, color: 'bg-amber-500' },
  ],
};

export const smartInsightsByProfile = {
  Konservatif: [
    'Dengan nominal kecil, target paling realistis adalah membangun kebiasaan investasi rutin, bukan mengejar hasil besar dalam waktu singkat.',
    'Mayoritas dana ditempatkan di aset likuid agar kamu bisa belajar mengenali instrumen tanpa tekanan fluktuasi besar.',
    'SBN dan emas dipakai sebagai pengenalan aset defensif: kupon, tenor, likuiditas, dan lindung nilai.',
  ],
  Moderat: [
    'Pertumbuhan tetap dikejar, tetapi masih diseimbangkan dengan aset defensif.',
    'Reksa dana campuran dipakai sebagai penyeimbang antara saham dan instrumen stabil.',
    'Crypto hanya ditempatkan sebagai satelit kecil karena volatilitasnya tinggi.',
  ],
  Agresif: [
    'Porsi bertumbuh lebih besar, tetapi tetap dibatasi dengan aset defensif.',
    'Crypto ditempatkan sebagai satelit karena volatilitasnya paling ekstrem.',
    'Low risk tetap menjadi jangkar agar portofolio tidak sepenuhnya spekulatif.',
  ],
};

export const formatIDR = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(value || 0);

export const formatCompactNumber = (value, locale = 'id-ID') => (
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value || 0)
);

export const formatPrice = (value, market) => (
  market === 'NASDAQ'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
    : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value || 0)
);

export const readStoredArray = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (_error) {
    return [];
  }
};

export const saveStoredArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
  }
};

export const scoreColor = (score) => {
  const value = Number(score) || 0;
  if (value >= 6.4) return 'text-[#05A845]';
  if (value >= 5.8) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500';
};

export const sentimentTextClass = (sentiment) => {
  const value = String(sentiment || '');
  if (value.includes('Bullish')) return 'text-[#05A845]';
  if (value === 'Netral') return 'text-blue-600 dark:text-blue-400';
  return 'text-red-500 dark:text-red-400';
};

export const getRiskCopy = (stock) => {
  const score = Number(stock?.score) || 0;
  if (score >= 6.4) return 'Skor kuat untuk watchlist aktif';
  if (score >= 5.8) return 'Layak dipantau dengan disiplin risiko';
  return 'Butuh konfirmasi tambahan';
};

export const makeCandles = (stock, period) => {
  const lengthByPeriod = { '1M': 24, '3M': 44, '6M': 58, '1Y': 72 };
  const count = lengthByPeriod[period] || 44;
  const ticker = String(stock?.ticker || 'ASSET');
  const price = Math.max(Number(stock?.price) || 1, 1);
  const score = Number(stock?.score) || 6;
  const trendBias = stock?.trend === 'up' ? 0.35 : stock?.trend === 'down' ? -0.22 : 0.05;
  let close = price * (stock?.trend === 'up' ? 0.78 : stock?.trend === 'down' ? 1.23 : 0.94);

  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + ticker.length) * 0.72) * 0.018;
    const pulse = Math.cos((index + score) * 0.41) * 0.012;
    const drift = trendBias / count / 3;
    const open = close;
    close = Math.max(price * 0.55, open * (1 + wave + pulse + drift));

    if (index === count - 1) close = price;

    const high = Math.max(open, close) * (1 + 0.01 + (index % 4) * 0.003);
    const low = Math.min(open, close) * (1 - 0.01 - (index % 3) * 0.002);

    return { open, close, high, low };
  });
};

const answerScoreMaps = {
  q_loss_reaction: {
    jual_semua: 0,
    jual_sebagian: 0.5,
    tahan: 1,
    tambah_beli: 2,
  },
  q_sleep_factor: {
    setiap_hari: 0,
    seminggu: 0.5,
    sebulan: 1,
    jarang: 2,
  },
  q_knowledge: {
    belum_tahu: 0,
    reksa_dana: 1,
    saham_dasar: 1.5,
    aktif: 2,
  },
};

const preferenceScores = {
  'Belum tahu': 0,
  Emas: 0.25,
  'Obligasi/SBN': 0.25,
  'Reksa Dana': 0.5,
  Saham: 1,
  Crypto: 2,
};

export const readSmartInvestmentAnswers = (key = SMART_INVESTMENT_STORAGE_KEY) => {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return saved.answers || {};
  } catch (_error) {
    return {};
  }
};

export const readSmartInvestmentResult = (key = SMART_INVESTMENT_STORAGE_KEY) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (_error) {
    return null;
  }
};

export const calculateRiskScore = (answers) => (
  Object.entries(answers || {}).reduce((sum, [key, answer]) => {
    const value = answer?.value;

    if (Array.isArray(value)) {
      const maxPreference = value.reduce(
        (currentMax, item) => Math.max(currentMax, Number(preferenceScores[item] || 0)),
        0
      );
      return sum + maxPreference;
    }

    return sum + Number(answerScoreMaps[key]?.[value] || 0);
  }, 0)
);

export const getRiskProfileFromScore = (score) => {
  if (score <= 3) return 'Konservatif';
  if (score >= 6) return 'Agresif';
  return 'Moderat';
};

export const flattenSmartInvestmentAnswers = (answers) => (
  Object.entries(answers).reduce((result, [key, answer]) => {
    if (key === 'investment_amount_source') {
      return result;
    }
    result[key] = answer?.value;
    return result;
  }, {})
);

export const getRecommendationNote = (riskProfile, emergencyFundStatus) => {
  const emergencyNote = emergencyFundStatus && emergencyFundStatus !== 'cukup'
    ? 'Dana darurat belum aman, jadi porsi awal dibuat lebih likuid dan konservatif.'
    : null;

  const profileNote = riskProfile === 'Konservatif'
    ? 'Fokus utama ada di instrumen low risk yang mudah dicairkan dan fluktuasinya rendah.'
    : riskProfile === 'Agresif'
      ? 'Saham IDX disaring berdasarkan skor kelayakan, lalu crypto hanya menjadi opsi satelit.'
      : 'Kombinasi reksa dana campuran dan saham blue chip dividen dipakai untuk menyeimbangkan risiko dan pertumbuhan.';

  return emergencyNote ? `${emergencyNote} ${profileNote}` : profileNote;
};
