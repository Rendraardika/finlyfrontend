export const mockUser = {
  id: 1,
  full_name: 'Demo Finly',
  name: 'Demo Finly',
  email: 'demo@finly.app',
  phone: '081234567890',
};

export const mockProfile = {
  phone: '+62 812 3456 7890',
  city: 'Jakarta Selatan',
  joined: 'Mei 2026',
  primaryIncome: 'Rp 15.000.000',
  additionalIncome: 'Rp 2.500.000',
  payday: 'Tanggal 25',
};

export const mockCategories = [
  { id: 1, name: 'Makanan & Minuman', transaction_type: 'expense', budget_group: 'needs' },
  { id: 2, name: 'Transportasi', transaction_type: 'expense', budget_group: 'needs' },
  { id: 3, name: 'Tagihan & Utilitas', transaction_type: 'expense', budget_group: 'needs' },
  { id: 4, name: 'Belanja', transaction_type: 'expense', budget_group: 'wants' },
  { id: 5, name: 'Hiburan', transaction_type: 'expense', budget_group: 'wants' },
  { id: 6, name: 'Kesehatan', transaction_type: 'expense', budget_group: 'needs' },
  { id: 7, name: 'Gaji', transaction_type: 'income', budget_group: 'income' },
  { id: 8, name: 'Bonus / THR', transaction_type: 'income', budget_group: 'income' },
  { id: 9, name: 'Hasil Investasi', transaction_type: 'income', budget_group: 'income' },
  { id: 10, name: 'Freelance', transaction_type: 'income', budget_group: 'income' },
];

export const mockTransactions = [
  {
    id: 1,
    category_name: 'Gaji',
    transaction_type: 'income',
    amount: 25000000,
    title: 'Gaji Bulanan',
    merchant: 'PT Teknologi Nusantara',
    notes: 'Gaji pokok bulan ini beserta tunjangan.',
    transaction_date: '2026-05-24',
  },
  {
    id: 2,
    category_name: 'Tagihan & Utilitas',
    transaction_type: 'expense',
    amount: 1250000,
    title: 'Tagihan Listrik',
    merchant: 'PLN Token',
    notes: 'Pembelian token listrik untuk rumah.',
    transaction_date: '2026-05-20',
  },
  {
    id: 3,
    category_name: 'Makanan & Minuman',
    transaction_type: 'expense',
    amount: 850000,
    title: 'Makan Malam Bisnis',
    merchant: 'Restoran Bunga Rampai',
    notes: 'Makan malam meeting dengan klien.',
    transaction_date: '2026-05-18',
  },
  {
    id: 4,
    category_name: 'Hasil Investasi',
    transaction_type: 'income',
    amount: 4500000,
    title: 'Dividen Saham BBCA',
    merchant: 'BCA Sekuritas',
    notes: 'Pembagian dividen interim.',
    transaction_date: '2026-05-15',
  },
];

export const mockSmartReceipt = {
  amount: 185000,
  title: 'Pembelian Kopi dan Snack',
  merchant: 'Kopi Kenangan',
  category_name: 'Makanan & Minuman',
  transaction_date: '2026-05-27',
  notes: 'Input dari simulasi Smart AI.',
};

export const buildTransactionSummary = (transactions) => {
  const totalIncome = transactions
    .filter((transaction) => transaction.transaction_type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.transaction_type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  return {
    total_income: totalIncome,
    total_expense: totalExpense,
    net_balance: totalIncome - totalExpense,
  };
};

const chartColors = ['#FCA5A5', '#93C5FD', '#86EFAC', '#FDE047', '#C4B5FD', '#FDBA74'];

export const buildRecentTransactions = (transactions, limit = 4) => (
  [...transactions]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, limit)
    .map((transaction) => ({
      id: transaction.id,
      name: transaction.merchant || transaction.title || transaction.category_name || 'Transaksi',
      title: transaction.title,
      notes: transaction.notes,
      category: transaction.category_name || 'Lainnya',
      date: transaction.transaction_date,
      amount: Number(transaction.amount || 0),
      type: transaction.transaction_type,
    }))
);

export const buildCategoryBreakdown = (transactions, transactionType) => {
  const grouped = transactions
    .filter((transaction) => transaction.transaction_type === transactionType)
    .reduce((result, transaction) => {
      const category = transaction.category_name || 'Lainnya';
      result[category] = (result[category] || 0) + Number(transaction.amount || 0);
      return result;
    }, {});

  const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

  return {
    total,
    data: Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount], index) => ({
        id: `${transactionType}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: chartColors[index % chartColors.length],
      })),
  };
};

const firstNumber = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');
  return Number(value || 0);
};

export const buildDashboardData = (transactions, summaryInput = null) => {
  const fallbackSummary = buildTransactionSummary(transactions);
  const summary = summaryInput ? {
    total_income: firstNumber(summaryInput.total_income, summaryInput.totalIncome, summaryInput.monthly_income, fallbackSummary.total_income),
    total_expense: firstNumber(summaryInput.total_expense, summaryInput.totalExpense, summaryInput.monthly_expense, fallbackSummary.total_expense),
    net_balance: firstNumber(summaryInput.net_balance, summaryInput.netBalance, summaryInput.total_balance, fallbackSummary.net_balance),
  } : fallbackSummary;
  const spendingLimit = 8000000;
  const safeLimitRemaining = Math.max(spendingLimit - summary.total_expense, 0);
  const safeLimitPercent = Math.min(Math.round((summary.total_expense / spendingLimit) * 100), 100);
  const investableAmount = Math.max(summary.net_balance - 5000000, 0);

  return {
    activeBalance: firstNumber(summaryInput?.active_balance, summaryInput?.activeBalance, summaryInput?.total_balance, summary.net_balance),
    totalIncome: summary.total_income,
    totalExpense: summary.total_expense,
    safeLimitRemaining,
    safeLimitPercent,
    insight: investableAmount > 0
      ? `Arus kasmu sehat bulan ini. Ada potensi alokasi sekitar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(investableAmount)} ke instrumen risiko rendah.`
      : 'Arus kas bulan ini perlu dijaga. Prioritaskan kebutuhan utama sebelum menambah alokasi investasi.',
  };
};

export const mockBudgetCategories = [
  { id: 1, title: 'Kebutuhan Pokok', spent: 3250000, limit: 5000000, color: 'green', icon: 'home', isDefault: true },
  { id: 2, title: 'Hiburan & Keinginan', spent: 1450000, limit: 1500000, color: 'yellow', icon: 'shopping', isDefault: true },
  { id: 3, title: 'Tabungan & Investasi', spent: 2000000, limit: 2000000, color: 'green', icon: 'trending', isDefault: true },
  { id: 4, title: 'Utang & Cicilan', spent: 1000000, limit: 1000000, color: 'green', icon: 'credit', isDefault: true },
];

export const mockSubscriptions = [
  { id: 1, name: 'Netflix Premium', dueDate: '2026-06-15', dueDay: 15, frequency: 'monthly', amount: 150000, isPaid: false, color: 'red' },
  { id: 2, name: 'Tagihan Listrik (PLN)', dueDate: '2026-06-05', dueDay: 5, frequency: 'monthly', amount: 500000, isPaid: true, color: 'yellow' },
  { id: 3, name: 'Internet Biznet', dueDate: '2026-06-10', dueDay: 10, frequency: 'monthly', amount: 350000, isPaid: true, color: 'blue' },
];

export const mockOnboardingSubscriptionOptions = [
  { id: 'kos', name: 'Sewa Kos / Rumah', defaultPrice: 1500000, iconKey: 'home' },
  { id: 'wifi', name: 'Internet / WiFi', defaultPrice: 350000, iconKey: 'wifi' },
  { id: 'pln', name: 'Listrik / Token', defaultPrice: 200000, iconKey: 'zap' },
  { id: 'netflix', name: 'Netflix', defaultPrice: 54000, iconKey: 'tv' },
  { id: 'spotify', name: 'Spotify Premium', defaultPrice: 54000, iconKey: 'music' },
  { id: 'bpjs', name: 'BPJS Kesehatan', defaultPrice: 150000, iconKey: 'heart' },
];

export const mockDebts = [
  { id: 1, name: 'KPR Rumah Sejahtera', total: 300000000, paid: 275000000, monthly: 2500000, dueDate: '2027-04-30', color: 'blue', icon: 'home' },
  { id: 2, name: 'Cicilan Laptop MacBook', total: 20000000, paid: 5000000, monthly: 1000000, dueDate: '2027-09-30', color: 'purple', icon: 'shopping' },
  { id: 3, name: 'Utang Budi (Teman)', total: 10000000, paid: 4500000, monthly: 0, dueDate: '2026-12-31', color: 'orange', icon: 'credit' },
];

export const mockRecommendations = [
  {
    id: 1,
    product_name: 'Reksa Dana Pasar Uang',
    investment_type: 'mutual_fund',
    risk_level: 'conservative',
    recommended_amount: 500000,
    ai_reason: 'Cocok untuk profil risiko konservatif dan dana darurat.',
    status: 'suggested',
  },
  {
    id: 2,
    product_name: 'SBN Ritel',
    investment_type: 'bond',
    risk_level: 'moderate',
    recommended_amount: 750000,
    ai_reason: 'Potensi imbal hasil stabil dengan risiko menengah.',
    status: 'suggested',
  },
];

export const mockInvestmentCategories = [
  {
    id: 'low',
    title: 'Low Risk',
    label: 'Instrumen Likuid',
    iconKey: 'shield',
    color: 'bg-green-50 dark:bg-[#05A845]/10 text-[#05A845]',
    items: 'Reksa dana pasar uang, SBN Retail, dan emas.',
    recommendedProfiles: ['Konservatif'],
  },
  {
    id: 'middle',
    title: 'Middle Risk',
    label: 'Investasi Bertumbuh',
    iconKey: 'trending',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400',
    items: 'Reksa dana campuran dan saham blue chip dividen.',
    recommendedProfiles: ['Moderat'],
  },
  {
    id: 'high',
    title: 'High Risk',
    label: 'Saham Terfilter',
    iconKey: 'bitcoin',
    color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400',
    items: 'Saham IDX hasil filter skor kelayakan, dengan crypto sebagai opsi satelit.',
    recommendedProfiles: ['Agresif'],
  },
];

export const mockInstrumentData = {
  low: [
    { code: 'RDPU', name: 'Reksadana Pasar Uang', price: 'Mulai Rp 10.000', change: 0.12, marketCap: 'Likuiditas tinggi', risk: 'Rendah', description: 'Cocok untuk pemula karena fluktuasinya relatif kecil dan dana biasanya lebih mudah dicairkan dibanding instrumen jangka panjang.' },
    { code: 'SBN', name: 'Surat Berharga Negara', price: 'Kupon berkala', change: 0.08, marketCap: 'Dijamin negara', risk: 'Rendah', description: 'Instrumen investasi dari pemerintah yang cocok untuk investor konservatif karena memiliki pembayaran kupon dan risiko yang relatif terukur.' },
    { code: 'EMAS', name: 'Emas Digital / Fisik', price: 'Harga mengikuti pasar', change: 0.35, marketCap: 'Aset lindung nilai', risk: 'Rendah - Moderat', description: 'Sering digunakan sebagai pelindung nilai dalam jangka panjang, terutama saat kondisi ekonomi tidak stabil.' },
  ],
  middle: [
    { code: 'BBCA', name: 'PT Bank Central Asia Tbk', price: 'Rp 10.450', change: 1.25, marketCap: 'Rp 1.280 Triliun', risk: 'Moderat', description: 'Bank swasta besar di Indonesia dengan fundamental kuat dan sering dijadikan pilihan saham bluechip untuk jangka panjang.' },
    { code: 'BBRI', name: 'PT Bank Rakyat Indonesia Tbk', price: 'Rp 4.820', change: -0.85, marketCap: 'Rp 720 Triliun', risk: 'Moderat', description: 'Bank BUMN yang fokus pada UMKM dan memiliki jaringan luas. Cocok untuk investor yang mencari pertumbuhan dengan risiko menengah.' },
    { code: 'TLKM', name: 'PT Telkom Indonesia Tbk', price: 'Rp 3.100', change: 2.1, marketCap: 'Rp 306 Triliun', risk: 'Moderat', description: 'Perusahaan telekomunikasi besar dengan bisnis infrastruktur digital dan seluler yang luas di Indonesia.' },
    { code: 'RDC', name: 'Reksa Dana Campuran', price: 'Mulai Rp 10.000', change: 0.7, marketCap: 'Dikelola manajer investasi', risk: 'Moderat', description: 'Menggabungkan obligasi, pasar uang, dan saham sehingga cocok untuk profil moderat yang ingin bertumbuh tanpa terlalu agresif.' },
  ],
  high: [
    { code: 'BTC', name: 'Bitcoin', price: 'Harga real-time', change: 3.4, marketCap: 'Aset digital utama', risk: 'Tinggi', description: 'Aset digital dengan volatilitas tinggi. Potensi return besar, tetapi pergerakan harganya sangat cepat dan tidak cocok untuk dana darurat.' },
    { code: 'ETH', name: 'Ethereum', price: 'Harga real-time', change: 2.15, marketCap: 'Ekosistem blockchain', risk: 'Tinggi', description: 'Aset digital yang banyak digunakan dalam ekosistem blockchain. Tetap memiliki risiko tinggi karena harga sangat fluktuatif.' },
    { code: 'CRYP', name: 'Crypto Basket', price: 'Sesuai komposisi aset', change: -1.2, marketCap: 'Diversifikasi aset digital', risk: 'Tinggi', description: 'Kumpulan beberapa aset crypto untuk diversifikasi. Risikonya tetap tinggi, sehingga sebaiknya hanya memakai dana yang siap menanggung fluktuasi besar.' },
  ],
};

export const mockInvestmentInsight = {
  averageIncome: 15000000,
  basicExpense: 10500000,
  emergencyAllocation: 2000000,
  potentialInvestment: 2500000,
  allocations: {
    Konservatif: [
      { type: 'low', label: 'Low Risk', amount: 2000000, percent: 80, color: 'bg-green-500' },
      { type: 'middle', label: 'Middle Risk', amount: 500000, percent: 20, color: 'bg-blue-500' },
      { type: 'high', label: 'High Risk', amount: 0, percent: 0, color: 'bg-yellow-500' },
    ],
    Moderat: [
      { type: 'low', label: 'Low Risk', amount: 750000, percent: 30, color: 'bg-green-500' },
      { type: 'middle', label: 'Middle Risk', amount: 1500000, percent: 60, color: 'bg-blue-500' },
      { type: 'high', label: 'High Risk', amount: 250000, percent: 10, color: 'bg-yellow-500' },
    ],
    Agresif: [
      { type: 'low', label: 'Low Risk', amount: 500000, percent: 20, color: 'bg-green-500' },
      { type: 'middle', label: 'Middle Risk', amount: 750000, percent: 30, color: 'bg-blue-500' },
      { type: 'high', label: 'High Risk', amount: 1250000, percent: 50, color: 'bg-yellow-500' },
    ],
  },
};

export const mockNotifications = [
  { id: 1, type: 'alert', title: 'Peringatan Anggaran!', message: 'Pengeluaran "Hiburan" sudah mencapai 90% dari batas bulanan.', time: '10 menit yang lalu', unread: true },
  { id: 2, type: 'insight', title: 'Insight Mingguan', message: 'Bagus! Kamu berhasil menghemat Rp 150.000 minggu ini dibanding minggu lalu.', time: '2 jam yang lalu', unread: true },
  { id: 3, type: 'success', title: 'Pembayaran Berhasil', message: 'Tagihan langganan Netflix bulan ini sebesar Rp 150.000 telah dicatat.', time: 'Kemarin', unread: false },
];

const stockNewsTemplate = (ticker, name) => [
  `${ticker} masuk radar investor setelah kinerja fundamental ${name} dinilai masih solid`,
  `Sentimen sektor dan valuasi ${ticker} menjadi perhatian analis ritel pekan ini`,
  `Pergerakan harga ${ticker} tertahan area teknikal penting, investor menunggu konfirmasi volume`,
  `${name} menjaga prospek laba di tengah dinamika pasar dan perubahan suku bunga`,
];

const makeStock = ({
  ticker,
  name,
  market = 'IDX',
  price,
  score,
  sentiment,
  fundamental,
  technical,
  upside,
  pe,
  roe,
  margin,
  dividend,
  der,
  return1y,
  trend = 'sideways',
}) => {
  const entryLow = price * 0.992;
  const entryHigh = price * 1.005;
  const target = price * (1 + upside / 100);
  const stopLoss = price * 0.96;
  const riskReward = Math.max((target - price) / Math.max(price - stopLoss, 1), 0.8);

  return {
    ticker,
    name,
    market,
    price,
    score,
    sentiment,
    fundamental,
    technical,
    upside,
    pe,
    roe,
    margin,
    dividend,
    der,
    return1y,
    trend,
    entry: [entryLow, entryHigh],
    target,
    stopLoss,
    riskReward,
    greenFlags: [
      `ROE ${roe >= 0.18 ? 'tinggi' : 'sehat'} (${Math.round(roe * 100)}%)`,
      `Net margin ${margin >= 0.18 ? 'kuat' : 'positif'} (${Math.round(margin * 100)}%)`,
      `Valuasi P/E ${pe.toFixed(1)} masih terbaca menarik`,
      dividend > 0 ? `Dividend yield ${Math.round(dividend * 1000) / 10}%` : 'Neraca relatif ringan untuk ekspansi',
      return1y > 0 ? `Return 1 tahun positif (${Math.round(return1y * 100)}%)` : 'Harga sudah terkoreksi dari area tinggi',
      trend === 'up' ? 'Momentum harga masih konstruktif' : 'Entry bisa dipantau bertahap',
    ],
    redFlags: [
      technical < 5.5 ? 'Momentum teknikal belum kuat' : 'Harga dekat area resistance pendek',
      der > 0.8 ? `DER cukup tinggi (${der.toFixed(2)})` : 'Perlu konfirmasi volume lanjutan',
      return1y < 0 ? 'Return 1 tahun masih tertekan' : 'Kenaikan cepat rawan profit taking',
      margin < 0 ? 'Margin laba masih negatif' : 'Sentimen pasar tetap perlu dipantau',
    ],
    fundamentalAreas: [
      { label: 'Laporan Keuangan', value: fundamental },
      { label: 'Rasio Keuangan', value: Math.min(9, Math.max(4.5, 10 - der * 2)) },
      { label: 'Valuasi', value: Math.min(9, Math.max(4, 10 - pe / 3)) },
      { label: 'Analisis Bisnis', value: Math.min(9, Math.max(5.5, fundamental + 0.2)) },
      { label: 'Manajemen & Tata Kelola', value: Math.min(8.8, Math.max(5.8, fundamental + 0.4)) },
      { label: 'Industri & Makro', value: Math.min(8.5, Math.max(5.4, 6.2 + upside / 20)) },
      { label: 'Analisis Risiko', value: Math.min(8.6, Math.max(5, 9 - der * 2.2)) },
    ],
    technicalAreas: [
      { label: 'Trend', value: trend === 'up' ? 7.4 : trend === 'down' ? 3.8 : 5.8 },
      { label: 'Support/Resistance', value: Math.min(8.3, Math.max(4.8, technical + 0.8)) },
      { label: 'Volume', value: Math.min(8, Math.max(4.2, technical - 0.4)) },
      { label: 'Chart Patterns', value: Math.min(8.2, Math.max(4.5, technical + 0.2)) },
      { label: 'Entry Strategy', value: Math.min(8.4, Math.max(4.8, technical + 0.5)) },
    ],
    news: stockNewsTemplate(ticker, name),
  };
};

export const mockStockAnalysis = [
  makeStock({ ticker: 'ACES', name: 'Aspirasi Hidup Indonesia Tbk.', price: 352, score: 6.6, sentiment: 'Bullish', fundamental: 6.9, technical: 6.1, upside: 12.79, pe: 8.73, roe: 0.103, margin: 0.07, dividend: 0.096, der: 0.01, return1y: -0.329, trend: 'sideways' }),
  makeStock({ ticker: 'AMRT', name: 'Sumber Alfaria Trijaya Tbk.', price: 1405, score: 6.4, sentiment: 'Bullish', fundamental: 7.2, technical: 5.9, upside: 16.27, pe: 16.62, roe: 0.19, margin: 0.031, dividend: 0.024, der: 0.15, return1y: -0.438, trend: 'sideways' }),
  makeStock({ ticker: 'TINS', name: 'Timah Tbk.', price: 3060, score: 6.3, sentiment: 'Bullish', fundamental: 7.4, technical: 5.5, upside: 29.98, pe: 8.45, roe: 0.271, margin: 0.275, dividend: 0.021, der: 0.11, return1y: 1.673, trend: 'up' }),
  makeStock({ ticker: 'MAPI', name: 'Mitra Adiperkasa Tbk.', price: 1480, score: 6.3, sentiment: 'Bullish', fundamental: 6.9, technical: 5.6, upside: 11.23, pe: 10.29, roe: 0.163, margin: 0.051, dividend: 0.007, der: 0.24, return1y: 0.143, trend: 'up' }),
  makeStock({ ticker: 'BBRI', name: 'Bank Rakyat Indonesia (Persero) Tbk.', price: 3040, score: 6.3, sentiment: 'Bullish', fundamental: 7.1, technical: 5.3, upside: 9.15, pe: 7.87, roe: 0.173, margin: 0.293, dividend: 0.114, der: 0.01, return1y: -0.278, trend: 'down' }),
  makeStock({ ticker: 'BMRI', name: 'Bank Mandiri (Persero) Tbk.', price: 4230, score: 6.3, sentiment: 'Bullish', fundamental: 6.8, technical: 5.6, upside: 9.34, pe: 6.75, roe: 0.192, margin: 0.409, dividend: 0.113, der: 0.07, return1y: -0.217, trend: 'sideways' }),
  makeStock({ ticker: 'AKRA', name: 'AKR Corporindo Tbk.', price: 1390, score: 6.2, sentiment: 'Bullish', fundamental: 6.9, technical: 5.2, upside: 14.05, pe: 10.88, roe: 0.2, margin: 0.051, dividend: 0.072, der: 0.39, return1y: 0.094, trend: 'sideways' }),
  makeStock({ ticker: 'BRIS', name: 'Bank Syariah Indonesia (Persero) Tbk.', price: 1790, score: 6.2, sentiment: 'Bullish', fundamental: 6.7, technical: 5.6, upside: 14.26, pe: 10.47, roe: 0.155, margin: 0.313, dividend: 0.018, der: 0, return1y: -0.383, trend: 'sideways' }),
  makeStock({ ticker: 'ANTM', name: 'Aneka Tambang Tbk.', price: 3100, score: 6.1, sentiment: 'Bullish', fundamental: 7.1, technical: 4.9, upside: 21.24, pe: 8.78, roe: 0.218, margin: 0.116, dividend: 0.049, der: 0.14, return1y: 0.136, trend: 'up' }),
  makeStock({ ticker: 'EMTK', name: 'Elang Mahkota Teknologi Tbk.', price: 695, score: 6.1, sentiment: 'Bullish', fundamental: 6.4, technical: 5.6, upside: 17.85, pe: 15.14, roe: 0.076, margin: -0.058, dividend: 0.055, der: 0.06, return1y: 0.264, trend: 'sideways' }),
  makeStock({ ticker: 'UNVR', name: 'Unilever Indonesia Tbk.', price: 1795, score: 6, sentiment: 'Netral', fundamental: 6.3, technical: 5.6, upside: 12.49, pe: 8.01, roe: 1.303, margin: 0.254, dividend: 0.075, der: 0.09, return1y: 0.05, trend: 'sideways' }),
  makeStock({ ticker: 'BUKA', name: 'Bukalapak.com Tbk.', price: 129, score: 6, sentiment: 'Netral', fundamental: 6.1, technical: 5.8, upside: 15.02, pe: 5.11, roe: 0.105, margin: -0.18, dividend: 0, der: 0, return1y: -0.044, trend: 'sideways' }),
  makeStock({ ticker: 'ADRO', name: 'Alamtri Resources Indonesia Tbk.', price: 2230, score: 5.9, sentiment: 'Netral', fundamental: 6.8, technical: 4.8, upside: 11.37, pe: 7.91, roe: 0.099, margin: 0.272, dividend: 0.118, der: 0.22, return1y: 0.009, trend: 'down' }),
  makeStock({ ticker: 'INDF', name: 'Indofood Sukses Makmur Tbk.', price: 6600, score: 5.9, sentiment: 'Netral', fundamental: 6.4, technical: 5.3, upside: 7.08, pe: 5.31, roe: 0.141, margin: 0.087, dividend: 0.042, der: 0.99, return1y: -0.162, trend: 'sideways' }),
  makeStock({ ticker: 'BBCA', name: 'Bank Central Asia Tbk.', price: 5975, score: 5.8, sentiment: 'Netral', fundamental: 6.2, technical: 5.4, upside: 8.83, pe: 12.68, roe: 0.224, margin: 0.495, dividend: 0.056, der: 0, return1y: -0.369, trend: 'sideways' }),
  makeStock({ ticker: 'GOOGL', name: 'Alphabet Inc.', market: 'NASDAQ', price: 389.77, score: 6.6, sentiment: 'Bullish', fundamental: 7.3, technical: 5.8, upside: 9.22, pe: 21.4, roe: 0.39, margin: 0.38, dividend: 0, der: 0.2, return1y: 0.32, trend: 'up' }),
  makeStock({ ticker: 'MSFT', name: 'Microsoft Corporation', market: 'NASDAQ', price: 425.31, score: 6.6, sentiment: 'Bullish', fundamental: 7.2, technical: 5.8, upside: 9.16, pe: 28.6, roe: 0.34, margin: 0.36, dividend: 0.007, der: 0.18, return1y: 0.22, trend: 'up' }),
  makeStock({ ticker: 'NVDA', name: 'NVIDIA Corporation', market: 'NASDAQ', price: 219.13, score: 6.5, sentiment: 'Bullish', fundamental: 6.9, technical: 6.0, upside: 12.52, pe: 34.2, roe: 0.42, margin: 0.49, dividend: 0, der: 0.16, return1y: 0.74, trend: 'up' }),
  makeStock({ ticker: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ', price: 297.19, score: 6.3, sentiment: 'Bullish', fundamental: 6.9, technical: 5.5, upside: 7.04, pe: 26.1, roe: 0.58, margin: 0.25, dividend: 0.005, der: 0.31, return1y: 0.18, trend: 'sideways' }),
  makeStock({ ticker: 'TSLA', name: 'Tesla, Inc.', market: 'NASDAQ', price: 396.91, score: 5.6, sentiment: 'Netral', fundamental: 5.9, technical: 5.3, upside: 14.74, pe: 49.3, roe: 0.12, margin: 0.08, dividend: 0, der: 0.08, return1y: 0.27, trend: 'sideways' }),
  makeStock({ ticker: 'BTC', name: 'Bitcoin', market: 'CRYPTO', price: 1095000000, score: 6.4, sentiment: 'Bullish', fundamental: 6.3, technical: 6.2, upside: 10.8, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.58, trend: 'up' }),
  makeStock({ ticker: 'ETH', name: 'Ethereum', market: 'CRYPTO', price: 58700000, score: 6.1, sentiment: 'Netral', fundamental: 6.0, technical: 5.9, upside: 13.4, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.42, trend: 'sideways' }),
  makeStock({ ticker: 'SOL', name: 'Solana', market: 'CRYPTO', price: 2840000, score: 6.1, sentiment: 'Netral', fundamental: 6.8, technical: 5.3, upside: 12, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.36, trend: 'sideways' }),
  makeStock({ ticker: 'BNB', name: 'BNB', market: 'CRYPTO', price: 10450000, score: 6, sentiment: 'Netral', fundamental: 6.2, technical: 5.8, upside: 12, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.28, trend: 'sideways' }),
  makeStock({ ticker: 'XRP', name: 'XRP', market: 'CRYPTO', price: 21300, score: 6.1, sentiment: 'Netral', fundamental: 6.9, technical: 5.2, upside: 12, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.31, trend: 'sideways' }),
  makeStock({ ticker: 'LINK', name: 'Chainlink', market: 'CRYPTO', price: 148200, score: 6, sentiment: 'Netral', fundamental: 6.6, technical: 5.4, upside: 12, pe: 0, roe: 0, margin: 0, dividend: 0, der: 0, return1y: 0.22, trend: 'sideways' }),
];
