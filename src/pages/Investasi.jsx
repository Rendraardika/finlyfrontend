import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Bitcoin, Heart, Info, Lightbulb,
  Newspaper, RotateCcw, Search, ShieldCheck, Sparkles,
  Target, TrendingUp, TriangleAlert,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import RiskQuiz, { INVESTMENT_QUIZ_TOTAL_STEPS } from '../components/investasi/RiskQuiz';
import CustomSelect from '../components/ui/CustomSelect';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/useNotification';
import { useToast } from '../context/ToastContext';
import {
  mockInstrumentData,
  mockInvestmentCategories,
  mockInvestmentInsight,
  mockStockAnalysis,
} from '../services/mockData';
import {
  getInvestmentAnalysisDetail,
  getInvestmentMarketByRisk,
  getInvestmentProductAnalysis,
  submitRiskQuiz,
} from '../services/investmentService';
import {
  calculateRiskScore,
  clearLegacyInvestmentStorage,
  flattenSmartInvestmentAnswers,
  formatCompactNumber,
  formatIDR,
  formatPrice,
  getInvestmentStorageKeys,
  getRiskCopy,
  getRiskProfileFromScore,
  lowRiskFundTypeOptions,
  lowRiskReturnOptions,
  makeCandles,
  periodFilters,
  profileCategoryId,
  readSmartInvestmentAnswers,
  readSmartInvestmentResult,
  readStoredArray,
  saveStoredArray,
  scoreColor,
  sentimentFilters,
  sentimentTextClass,
  smartAllocationTemplates,
  smartInsightsByProfile,
} from '../utils/investmentViewModel';

const profileLabelFromRiskLevel = (riskLevel) => ({
  conservative: 'Konservatif',
  moderate: 'Moderat',
  aggressive: 'Agresif',
}[riskLevel] || null);

const allocationColors = ['bg-blue-500', 'bg-[#05A845]', 'bg-teal-400', 'bg-amber-500', 'bg-purple-500'];

const categoryMetaById = {
  low: {
    id: 'low',
    title: 'Low Risk',
    label: 'Investasi Aman',
    iconKey: 'shield',
    color: 'bg-green-50 dark:bg-[#05A845]/10 text-[#05A845]',
    items: 'Reksa dana, SBN Ritel, dan logam mulia dari database.',
  },
  middle: {
    id: 'middle',
    title: 'Middle Risk',
    label: 'Saham Terfilter',
    iconKey: 'trending',
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400',
    items: 'Saham terkurasi berdasarkan data pasar dan analisis risiko.',
  },
  high: {
    id: 'high',
    title: 'High Risk',
    label: 'Crypto Terfilter',
    iconKey: 'bitcoin',
    color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400',
    items: 'Crypto terkurasi berdasarkan data pasar, sentimen, dan volatilitas.',
  },
};

const parsePercent = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const numeric = Number(String(value).replace('%', '').replace(',', '.').match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeScore = (value, fallback = 6) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric > 10) {
    const scaled = numeric <= 120 ? numeric / 12 : numeric / 100;
    return Math.max(0, Math.min(10, scaled));
  }
  return Math.max(0, Math.min(10, numeric));
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatDecimal = (value, digits = 1) => safeNumber(value).toFixed(digits).replace('.', ',');

const formatSignedPercent = (value, digits = 2) => {
  const numeric = safeNumber(value);
  return `${numeric > 0 ? '+' : ''}${numeric.toFixed(digits)}%`;
};

const sentimentFromScore = (score) => {
  if (score >= 6.4) return 'Bullish';
  if (score >= 5.8) return 'Netral';
  return 'Bearish';
};

const normalizeSentiment = (value, score = 0) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('strong') && raw.includes('bull')) return 'Sangat Bullish';
  if (raw.includes('moderate') && raw.includes('bull')) return 'Bullish';
  if (raw.includes('bull')) return score >= 7 ? 'Sangat Bullish' : 'Bullish';
  if (raw.includes('strong') && raw.includes('bear')) return 'Sangat Bearish';
  if (raw.includes('moderate') && raw.includes('bear')) return 'Bearish';
  if (raw.includes('bear')) return 'Bearish';
  if (raw.includes('overvalued')) return 'Bearish';
  if (raw.includes('neutral') || raw.includes('netral')) return 'Netral';
  return sentimentFromScore(score);
};

const getFirstNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const numeric = Number(String(value).replace(/[,%]/g, '').match(/-?\d+(\.\d+)?/)?.[0]);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

const toTextList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : item?.title || item?.summary || item?.reason || item?.text))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return fallback;
};

const toNewsItems = (value, fallback = []) => {
  if (!Array.isArray(value)) {
    return toTextList(value, fallback).map((title) => ({ title }));
  }

  return value
    .map((item) => (
      typeof item === 'string'
        ? { title: item }
        : {
          title: item?.title || item?.headline || item?.summary || item?.text,
          source: item?.source || item?.publisher,
          publishedAt: item?.published_at || item?.publishedAt || item?.date,
          sentiment: item?.sentiment || item?.sentiment_label,
          url: item?.url || item?.link,
        }
    ))
    .filter((item) => item.title);
};

const scoreRowsFromObject = (source, fallbackRows) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return fallbackRows;

  const rows = Object.entries(source)
    .map(([key, value]) => {
      const score = typeof value === 'object'
        ? getFirstNumber(value.score, value.value, value.final_score)
        : getFirstNumber(value);
      if (!score) return null;
      return {
        label: key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        value: normalizeScore(score),
        reason: typeof value === 'object' ? value.reason || value.explanation || value.summary : null,
      };
    })
    .filter(Boolean);

  return rows.length ? rows : fallbackRows;
};

const unwrapAnalysis = (analysisResponse) => {
  const payload = analysisResponse?.data || analysisResponse || {};
  const raw = payload.analysis || {};
  const nested = raw.data || raw.analysis || raw.result || raw;
  return {
    payload,
    analysis: nested?.analysis || nested,
  };
};

const lowRiskTypeFromProduct = (product) => {
  if (product.investment_type === 'sbn' || product.investment_type === 'bond') return 'SBN Ritel';
  if (product.investment_type === 'gold') return 'Emas';
  return 'Reksadana';
};

const allocationPercentByLowRiskType = {
  Reksadana: 20,
  'SBN Ritel': 30,
  Emas: 20,
};

const lowRiskInstrumentFromProduct = (product) => {
  const metadata = product.metadata || {};
  const type = lowRiskTypeFromProduct(product);
  const isGold = type === 'Emas';
  const antamPrice = Number(metadata.price_idr || metadata.buy_price || metadata.harga_beli || metadata.harga_per_gram || 0);
  const antamBuyback = Number(metadata.buyback_idr || metadata.sell_price || metadata.harga_jual || 0);
  const spreadPct = Number.isFinite(Number(metadata.spread_pct))
    ? Number(metadata.spread_pct)
    : antamPrice > 0 && antamBuyback > 0
      ? ((antamPrice - antamBuyback) / antamPrice) * 100
      : 0;
  const return1y = parsePercent(
    metadata.return_1th_pct ||
    metadata.return_est_yoy_pct ||
    metadata.return_est_pct ||
    product.expected_return_value ||
    product.expected_return_note
  );
  const return1m = parsePercent(metadata.return_1bl_pct || metadata.return_1m_pct);
  const return3y = parsePercent(metadata.return_3th_pct || metadata.return_3y_pct || return1y * 3);

  return {
    code: product.symbol || product.name,
    productType: product.investment_type,
    apiType: product.investment_type === 'gold' ? 'gold' : product.investment_type === 'sbn' || product.investment_type === 'bond' ? 'sbn' : 'mutual_fund',
    name: product.name,
    provider: metadata.manajer_investasi || metadata.provider || metadata.issuer || metadata.penerbit || metadata.sumber || 'Finly Market Data',
    type,
    kind: metadata.jenis_reksadana || metadata.asset_class || product.investment_type,
    kindLabel: isGold ? 'Logam Mulia' : formatFundTypeLabel(metadata.jenis_reksadana || metadata.asset_class || product.investment_type),
    horizon: return3y ? '3 Tahun' : return1m ? '1 Bulan' : '1 Tahun',
    return1y,
    return1m,
    return3y,
    minimum: Number(product.minimum_amount || metadata.minimum_amount || metadata.min_pembelian || antamPrice || 10000),
    risk: metadata.profil_risiko_rd || metadata.risk || metadata.kategori_profil_risiko || 'Rendah',
    nav: Number(metadata.nab_per_unit || antamPrice || metadata.harga_beli || metadata.buy_price || metadata.harga_per_gram || 0),
    sharia: Boolean(metadata.is_syariah || metadata.syariah),
    rank: Number(metadata.rank_dalam_jenis || metadata.rank || 0),
    pipelineScore: Number(product.score || metadata.skor_reksadana || metadata.skor_pipeline || 0),
    allocationPercent: allocationPercentByLowRiskType[type] || 20,
    description: product.description || `${product.name} adalah instrumen ${type.toLowerCase()} untuk profil konservatif.`,
    sourceDate: metadata.source_date || metadata.date || metadata.scraped_at,
    priceIdr: antamPrice,
    buybackIdr: antamBuyback,
    spreadPct,
    denominationGram: Number(metadata.denomination_gram || metadata.berat_gram || 0),
    realtimeSource: Boolean(metadata.realtime_source || isGold),
    raw: product,
  };
};

const formatFundTypeLabel = (value) => {
  const text = String(value || '').replace(/_/g, ' ').trim();
  if (!text) return 'Lainnya';
  const aliases = {
    'pasar uang': 'Pasar Uang',
    'pendapatan tetap': 'Pendapatan Tetap',
    syariah: 'Syariah',
    proteksi: 'Proteksi',
    'target batasan': 'Target Batasan',
  };
  return aliases[text.toLowerCase()] || text.replace(/\b\w/g, (char) => char.toUpperCase());
};

const stockFromProduct = (product, categoryId) => {
  const metadata = product.metadata || {};
  const crypto = categoryId === 'high' || product.investment_type === 'crypto';
  const score = normalizeScore(product.score, crypto ? 6 : 5.8);
  const price = Number(metadata.latest_close || metadata.close || metadata.price || metadata.last_price || metadata.market_price || metadata.current_price || 0);
  const returnValue = parsePercent(product.expected_return_value || metadata.return_1y_pct || metadata.return_period_pct || product.expected_return_note);
  const upside = Math.max(4, Math.min(30, Math.abs(returnValue || score * 1.6)));
  const sentiment = normalizeSentiment(metadata.sentiment_label || metadata.market_sentiment, score);
  const symbol = String(product.symbol || metadata.ticker || metadata.symbol || metadata.coin_id || product.name);

  return {
    ticker: crypto ? String(metadata.symbol || product.symbol || product.name).toUpperCase() : symbol.toUpperCase(),
    symbol: product.symbol,
    apiSymbol: crypto ? (metadata.coin_id || metadata.coingecko_id || product.symbol || product.name) : (metadata.ticker || product.symbol || product.name),
    apiType: crypto ? 'crypto' : 'stock',
    imageUrl: metadata.image_url || metadata.logo_url || metadata.icon,
    rank: Number(metadata.market_cap_rank || metadata.rank || 0),
    name: product.name,
    market: crypto ? 'CRYPTO' : metadata.exchange || 'IDX',
    price: price || (crypto ? 10000 : 1000),
    score,
    sentiment,
    fundamental: normalizeScore(metadata.fundamental_score || metadata.market_cap_rank ? 7 - Math.min(Number(metadata.market_cap_rank || 30), 100) / 30 : score + 0.2, score),
    technical: normalizeScore(metadata.technical_score || score - 0.2, score),
    upside,
    pe: Number(metadata.pe || metadata.per || 12),
    roe: Number(metadata.roe || 0.12),
    margin: Number(metadata.margin || 0.1),
    dividend: Number(metadata.dividend || 0),
    der: Number(metadata.der || 0.2),
    return1y: returnValue / 100,
    trend: returnValue > 10 ? 'up' : returnValue < -10 ? 'down' : 'sideways',
    entry: [Math.max(1, price * 0.992), Math.max(1, price * 1.005)],
    target: Math.max(1, price * (1 + upside / 100)),
    stopLoss: Math.max(1, price * 0.96),
    riskReward: Math.max(upside / 4, 0.8),
    marketCap: Number(metadata.market_cap || 0),
    volume24h: Number(metadata.volume_24h || metadata.total_volume || 0),
    circulatingSupply: Number(metadata.circulating_supply || 0),
    maxSupply: Number(metadata.max_supply || 0),
    ath: Number(metadata.ath || 0),
    athChangePct: Number(metadata.ath_change_percentage || metadata.ath_change_pct || 0),
    fearGreed: Number(metadata.fear_greed_value || metadata.fng_value || 0),
    fearGreedLabel: metadata.fear_greed_classification || metadata.fng_classification,
    greenFlags: [
      crypto ? 'Data pasar crypto tersedia untuk pemantauan' : 'Data harga historis tersedia',
      product.expected_return_note || 'Masuk daftar pantauan Finly',
      'Dapat dianalisis lebih lanjut dari halaman detail',
    ],
    redFlags: [
      crypto ? 'Volatilitas aset crypto tinggi' : 'Harga tetap mengikuti risiko pasar',
      'Return historis tidak menjamin hasil ke depan',
    ],
    fundamentalAreas: [
      { label: crypto ? 'Market Cap Rank' : 'Fundamental', value: score },
      { label: crypto ? 'Market Metrics' : 'Kualitas Bisnis', value: Math.min(9, score + 0.4) },
      { label: 'Risiko', value: Math.max(4.5, 9 - score / 2) },
    ],
    technicalAreas: [
      { label: 'Trend', value: returnValue > 0 ? 6.5 : 5.2 },
      { label: 'Momentum', value: normalizeScore(score - 0.1, score) },
      { label: 'Entry Strategy', value: normalizeScore(score + 0.2, score) },
    ],
    news: metadata.news_titles || metadata.news || [
      `${product.name} tersedia dari data pasar Finly.`,
      'Buka detail untuk melihat skor, sentimen, dan area risiko.',
    ],
    newsItems: toNewsItems(metadata.news_items || metadata.news_titles || metadata.news),
    newsSummary: metadata.news_summary,
    raw: product,
  };
};

const mergeAnalysisIntoAsset = (asset, analysisResponse) => {
  const { payload, analysis } = unwrapAnalysis(analysisResponse);
  const setup = analysis.trading_setup || analysis.trade_setup || analysis.entry_strategy || {};
  const marketData = analysis.market_data || analysis.info_crypto || analysis.market || {};
  const scores = analysis.scores || analysis.scoring || {};
  const score = normalizeScore(
    analysis.overall_score ||
    scores.overall_score ||
    scores.overall ||
    analysis.score ||
    analysis.final_score ||
    analysis.scoring?.overall_score ||
    asset.score,
    asset.score
  );
  const fundamental = normalizeScore(
    analysis.fundamental_score ||
    scores.fundamental_score ||
    scores.fundamental ||
    analysis.fundamental?.score ||
    analysis.scoring?.fundamental_score ||
    asset.fundamental,
    asset.fundamental
  );
  const technical = normalizeScore(
    analysis.technical_score ||
    scores.technical_score ||
    scores.technical ||
    analysis.technical?.score ||
    analysis.scoring?.technical_score ||
    asset.technical,
    asset.technical
  );
  const entryLow = getFirstNumber(setup.entry_low, setup.buy_zone_low, setup.entry?.low, setup.entry?.[0]);
  const entryHigh = getFirstNumber(setup.entry_high, setup.buy_zone_high, setup.entry?.high, setup.entry?.[1]);
  const target = getFirstNumber(setup.target_price, setup.target, setup.take_profit);
  const stopLoss = getFirstNumber(setup.stop_loss, setup.stopLoss);
  const upside = getFirstNumber(analysis.upside_pct, setup.upside_pct, setup.upside, asset.upside);
  const fallbackNewsItems = asset.newsItems?.length ? asset.newsItems : toNewsItems(asset.news);
  const analysisNewsItems = toNewsItems(analysis.news_items || analysis.news_articles || analysis.news || analysis.latest_news);
  const newsItems = analysisNewsItems.some((item) => item.url)
    ? analysisNewsItems
    : fallbackNewsItems.length
      ? fallbackNewsItems
      : analysisNewsItems;
  const newsSummary = analysis.news_summary || analysis.summary_news || asset.newsSummary;
  const greenFlags = toTextList(analysis.green_flags || analysis.greenFlags, asset.greenFlags);
  const redFlags = toTextList(analysis.red_flags || analysis.redFlags, asset.redFlags);
  const fallbackFundamental = asset.fundamentalAreas;
  const fallbackTechnical = asset.technicalAreas;
  const subScores = analysis.sub_scores || analysis.subscores || {};
  const fundamentalSource = analysis.fundamental_sub_scores || subScores.fundamental || subScores;
  const technicalSource = analysis.technical_sub_scores || subScores.technical || analysis.technical_breakdown;

  return {
    ...asset,
    score,
    fundamental,
    technical,
    sentiment: normalizeSentiment(analysis.sentiment_label || analysis.market_sentiment || analysis.news_sentiment || asset.sentiment, score),
    price: getFirstNumber(analysis.current_price, marketData.current_price, marketData.price, asset.price) || asset.price,
    entry: (() => {
      const currentEntry = Array.isArray(asset.entry) ? asset.entry : [asset.price, asset.price];
      return entryLow || entryHigh
        ? [entryLow || currentEntry[0], entryHigh || entryLow || currentEntry[1]]
        : currentEntry;
    })(),
    target: target || asset.target,
    stopLoss: stopLoss || asset.stopLoss,
    upside: upside || asset.upside,
    riskReward: getFirstNumber(setup.risk_reward, setup.rr, asset.riskReward) || asset.riskReward,
    marketCap: getFirstNumber(marketData.market_cap, analysis.market_cap, asset.marketCap),
    volume24h: getFirstNumber(marketData.volume_24h, analysis.volume_24h, asset.volume24h),
    circulatingSupply: getFirstNumber(marketData.circulating_supply, analysis.circulating_supply, asset.circulatingSupply),
    maxSupply: getFirstNumber(marketData.max_supply, analysis.max_supply, asset.maxSupply),
    ath: getFirstNumber(marketData.ath, analysis.ath, asset.ath),
    athChangePct: getFirstNumber(marketData.ath_change_pct, marketData.ath_change_percentage, analysis.ath_change_pct, asset.athChangePct),
    fearGreed: getFirstNumber(analysis.fear_greed?.value, analysis.fear_greed_value, analysis.fng_value, asset.fearGreed),
    fearGreedLabel: analysis.fear_greed?.classification || analysis.fear_greed_classification || analysis.fng_classification || asset.fearGreedLabel,
    greenFlags,
    redFlags,
    fundamentalAreas: scoreRowsFromObject(fundamentalSource, fallbackFundamental),
    technicalAreas: scoreRowsFromObject(technicalSource, fallbackTechnical),
    newsItems,
    newsSummary,
    newsSentiment: normalizeSentiment(analysis.news_sentiment, score),
    aiNarrative: analysis.ai_narrative || analysis.narrative || '',
    analysisStatus: payload.analysis_status || analysis.status || 'available',
    source: payload.source || asset.source,
    backendAnalysis: payload,
  };
};

function InvestmentQuizIntro({ onStart }) {
  return (
    <section className="min-h-[calc(100dvh-120px)] flex items-center justify-center py-8 sm:py-12">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1f2028] rounded-[28px] sm:rounded-[32px] border border-gray-100 dark:border-[#2e303a] shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] dark:text-[#2ee879] flex items-center justify-center">
            <Sparkles size={30} />
          </div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#05A845] dark:text-[#2ee879] mb-3">
            Smart Investment
          </p>
          <h1 className="text-[30px] sm:text-[38px] font-black text-[#1A1A1A] dark:text-white leading-tight">
            Mulai Perjalanan Investasi Anda di Sini
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Finly akan membantu menyesuaikan nominal, profil risiko, dan strategi alokasi berdasarkan anggaran serta jawaban singkatmu.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#05A845] text-white font-black hover:bg-[#048A38] transition-colors shadow-sm"
          >
            Mulai Investasi
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

const lowRiskClassOptions = [
  {
    value: 'Reksadana',
    label: 'Reksadana',
    description: 'Pasar uang dan pendapatan tetap konservatif.',
    icon: <ShieldCheck size={22} />,
  },
  {
    value: 'SBN Ritel',
    label: 'SBN Ritel',
    description: 'Kupon berkala dari surat berharga negara.',
    icon: <Target size={22} />,
  },
  {
    value: 'Emas',
    label: 'Logam Mulia',
    description: 'Emas sebagai lindung nilai jangka panjang.',
    icon: <Sparkles size={22} />,
  },
];
const investmentIconByKey = {
  shield: <ShieldCheck size={28} />,
  trending: <TrendingUp size={28} />,
  bitcoin: <Bitcoin size={28} />,
};

const lowRiskInstruments = [
  {
    code: 'PRINCIPAL-BOND',
    name: 'Principal Bond',
    provider: 'Principal Bond',
    type: 'Reksadana',
    kind: 'Reksa Dana Pendapatan Tetap',
    horizon: '1 Tahun',
    return1y: 6.9,
    return1m: -0.3,
    return3y: 21.1,
    minimum: 10000,
    risk: 'Rendah',
    nav: 50098,
    sharia: false,
    rank: 1,
    pipelineScore: 0.3,
    allocationPercent: 20,
    description: 'Principal Bond adalah instrumen reksa dana konservatif. Cocok sebagai bagian low risk selama kelas aset, minimum investasi, dan profil risikonya sesuai tujuanmu.',
  },
  {
    code: 'INFOVESTA-BALANCED',
    name: 'Infovesta Balanced Fund Index',
    provider: 'Infovesta',
    type: 'Reksadana',
    kind: 'Reksa Dana Syariah',
    horizon: '1 Tahun',
    return1y: 9.5,
    return1m: -6.3,
    return3y: 11.6,
    minimum: 10000,
    risk: 'Rendah',
    nav: 7596,
    sharia: true,
    rank: 12,
    pipelineScore: 0.21,
    allocationPercent: 20,
    description: 'Infovesta Balanced Fund Index adalah instrumen reksa dana konservatif. Cocok sebagai bagian low risk selama kelas aset, minimum investasi, dan profil risikonya sesuai tujuanmu.',
  },
  {
    code: 'RD-HAJI',
    name: 'RD Haji Syariah I Haji',
    provider: 'Mandiri Investasi',
    type: 'Reksadana',
    kind: 'Reksa Dana Syariah',
    horizon: '3 Tahun',
    return1y: 8.1,
    return1m: 0.31,
    return3y: 16.8,
    minimum: 10000,
    risk: 'Rendah',
    nav: 6125,
    sharia: true,
    rank: 15,
    pipelineScore: 0.27,
    allocationPercent: 20,
    description: 'RD Haji Syariah I Haji cocok untuk investor konservatif yang ingin aset relatif stabil dan dikelola profesional.',
  },
  {
    code: 'MANDIRI-SYARIAH',
    name: 'Mandiri Investa Syariah Berimbang Kelas A',
    provider: 'Mandiri Investasi',
    type: 'Reksadana',
    kind: 'Reksa Dana Syariah',
    horizon: '3 Tahun',
    return1y: 8.8,
    return1m: 0.38,
    return3y: 19.1,
    minimum: 10000,
    risk: 'Rendah',
    nav: 8021,
    sharia: true,
    rank: 10,
    pipelineScore: 0.29,
    allocationPercent: 15,
    description: 'Instrumen ini dapat menjadi pilihan diversifikasi low risk dengan pendekatan syariah dan horizon menengah.',
  },
  {
    code: 'SCHRODER-SYARIAH',
    name: 'Schroder Syariah Balanced Fund',
    provider: 'Schroder Investment Management',
    type: 'Reksadana',
    kind: 'Reksa Dana Syariah',
    horizon: '1 Tahun',
    return1y: 9.9,
    return1m: 0.52,
    return3y: 20.7,
    minimum: 10000,
    risk: 'Rendah',
    nav: 9144,
    sharia: true,
    rank: 9,
    pipelineScore: 0.32,
    allocationPercent: 15,
    description: 'Schroder Syariah Balanced Fund cocok sebagai pelengkap low risk bagi investor yang tetap ingin potensi imbal hasil terkendali.',
  },
  {
    code: 'SBN-SR',
    name: 'SBN Retail Seri Stabil',
    provider: 'Pemerintah RI',
    type: 'SBN Ritel',
    kind: 'Surat Berharga Negara',
    horizon: '3 Tahun',
    return1y: 6.4,
    return1m: 0.2,
    return3y: 19.2,
    minimum: 1000000,
    risk: 'Rendah',
    nav: 1000000,
    sharia: false,
    rank: 5,
    pipelineScore: 0.18,
    allocationPercent: 30,
    description: 'SBN Ritel cocok menjadi jangkar risiko karena kuponnya lebih terukur dan diterbitkan oleh pemerintah.',
  },
  {
    code: 'EMAS-DIGI',
    name: 'Emas Digital',
    provider: 'Aset Lindung Nilai',
    type: 'Emas',
    kind: 'Emas',
    horizon: '1 Bulan',
    return1y: 7.2,
    return1m: 0.7,
    return3y: 24.5,
    minimum: 10000,
    risk: 'Rendah',
    nav: 1250000,
    sharia: true,
    rank: 6,
    pipelineScore: 0.24,
    allocationPercent: 20,
    description: 'Emas dapat dipakai sebagai pelindung nilai dan penyeimbang saat pasar aset bertumbuh sedang berfluktuasi.',
  },
];

const isCryptoAsset = (stock) => stock?.market === 'CRYPTO';

const formatAssetPrice = (stock, value = stock?.price) => (
  isCryptoAsset(stock)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value >= 10 ? 2 : 6 }).format(value || 0)
    : formatPrice(value, stock?.market)
);

const getCryptoInfo = (stock) => {
  const cryptoMap = {
    BTC: { marketCap: 'Rp 21.850T', volume24h: 'Rp 735T', circulating: '19,8 juta BTC', maxSupply: '21 juta BTC', ath: 'Rp 1.260.800.000', fromAth: '-13,1%' },
    ETH: { marketCap: 'Rp 7.060T', volume24h: 'Rp 288T', circulating: '120,2 juta ETH', maxSupply: 'Tidak tetap', ath: 'Rp 78.600.000', fromAth: '-25,3%' },
    SOL: { marketCap: 'Rp 1.320T', volume24h: 'Rp 82T', circulating: '578 juta SOL', maxSupply: 'Tidak tetap', ath: 'Rp 4.200.000', fromAth: '-38,4%' },
    BNB: { marketCap: 'Rp 1.520T', volume24h: 'Rp 41T', circulating: '145 juta BNB', maxSupply: '200 juta BNB', ath: 'Rp 12.850.000', fromAth: '-18,7%' },
  };

  if (stock.marketCap || stock.volume24h || stock.ath) {
    return {
      marketCap: stock.marketCap ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.marketCap) : 'Data belum tersedia',
      volume24h: stock.volume24h ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.volume24h) : 'Data belum tersedia',
      circulating: stock.circulatingSupply ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.circulatingSupply) : 'Data belum tersedia',
      maxSupply: stock.maxSupply ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.maxSupply) : 'Tidak tetap / belum tersedia',
      ath: stock.ath ? formatAssetPrice(stock, stock.ath) : formatAssetPrice(stock, stock.price * 1.45),
      fromAth: stock.athChangePct ? `${safeNumber(stock.athChangePct).toFixed(1)}%` : '-31,0%',
    };
  }

  return cryptoMap[stock.ticker] || {
    marketCap: stock.marketCap ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.marketCap) : 'Data belum tersedia',
    volume24h: stock.volume24h ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.volume24h) : 'Data belum tersedia',
    circulating: stock.circulatingSupply ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.circulatingSupply) : 'Data belum tersedia',
    maxSupply: stock.maxSupply ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(stock.maxSupply) : 'Tidak tetap / belum tersedia',
    ath: stock.ath ? formatAssetPrice(stock, stock.ath) : formatAssetPrice(stock, stock.price * 1.45),
    fromAth: stock.athChangePct ? `${safeNumber(stock.athChangePct).toFixed(1)}%` : '-31,0%',
  };
};

const getFearGreed = (stock) => {
  const value = stock.fearGreed
    ? Math.max(0, Math.min(100, Math.round(safeNumber(stock.fearGreed))))
    : Math.max(12, Math.min(86, Math.round(safeNumber(stock.technical, 5) * 9 + (stock.trend === 'up' ? 10 : 0))));
  const label = stock.fearGreedLabel || (value < 25 ? 'Extreme Fear' : value < 45 ? 'Fear' : value < 55 ? 'Netral' : value < 75 ? 'Greed' : 'Extreme Greed');
  return { value, label };
};

const assetLogoMap = {
  BTC: { text: 'B', className: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  ETH: { text: 'E', className: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
  SOL: { text: 'S', className: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300' },
  BNB: { text: 'B', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300' },
  XRP: { text: 'X', className: 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-gray-200' },
  LINK: { text: 'L', className: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  CRYP: { text: 'C', className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
  RDPU: { text: 'RD', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  RDC: { text: 'RD', className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300' },
  SBN: { text: 'SBN', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' },
  EMAS: { text: 'Au', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300' },
  BBCA: { text: 'BCA', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  BBRI: { text: 'BRI', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  BMRI: { text: 'M', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300' },
  TLKM: { text: 'T', className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  ANTM: { text: 'A', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  TINS: { text: 'T', className: 'bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200' },
  GOOGL: { text: 'G', className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  MSFT: { text: 'M', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  NVDA: { text: 'N', className: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300' },
  AAPL: { text: 'A', className: 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-gray-200' },
  TSLA: { text: 'T', className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
};

function AssetLogo({ stock, size = 'md' }) {
  const ticker = String(stock?.ticker || stock?.symbol || 'AS');
  const logo = assetLogoMap[ticker] || {
    text: ticker.slice(0, 2),
    className: 'bg-[#EAF6ED] text-[#05A845] dark:bg-[#05A845]/15 dark:text-[#2ee879]',
  };
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-[15px]' : 'w-10 h-10 text-[12px]';

  if (stock?.imageUrl) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-[#2e303a] flex items-center justify-center overflow-hidden shrink-0`}>
        <img src={stock.imageUrl} alt={ticker} className="w-7 h-7 object-contain" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-2xl flex items-center justify-center font-black shrink-0 ${logo.className}`}>
      {logo.text}
    </div>
  );
}

export default function Investasi() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { showSuccess, showWarning } = useToast();
  const quizTopRef = useRef(null);
  const storageKeys = useMemo(() => getInvestmentStorageKeys(user), [user]);
  const [isQuizFinished, setIsQuizFinished] = useState(() => localStorage.getItem(storageKeys.quizFinished) === 'true');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [riskProfile, setRiskProfile] = useState(() => localStorage.getItem(storageKeys.riskProfile) || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [budgetedInvestmentAmount, setBudgetedInvestmentAmount] = useState(mockInvestmentInsight.potentialInvestment);
  const [investmentAnswers, setInvestmentAnswers] = useState(() => readSmartInvestmentAnswers(storageKeys.smartInvestment));
  const [smartInvestmentResult, setSmartInvestmentResult] = useState(() => readSmartInvestmentResult(storageKeys.smartInvestment));
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [query, setQuery] = useState('');
  const [sentiment, setSentiment] = useState('Semua Sentimen');
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [period, setPeriod] = useState('3M');
  const [favorites, setFavorites] = useState(() => readStoredArray(storageKeys.favorites));
  const [priceAlerts, setPriceAlerts] = useState(() => readStoredArray(storageKeys.priceAlerts));
  const [alertTargetStock, setAlertTargetStock] = useState(null);
  const [marketData, setMarketData] = useState({
    categories: mockInvestmentCategories,
    lowRisk: lowRiskInstruments,
    middle: mockStockAnalysis.filter((stock) => stock.market === 'IDX'),
    high: mockStockAnalysis.filter((stock) => stock.market === 'CRYPTO'),
    source: 'fallback',
  });
  const [marketStatus, setMarketStatus] = useState({ loading: false, error: null });
  const [analysisByAsset, setAnalysisByAsset] = useState({});
  const analysisPrefetchRef = useRef(new Set());

  const selectedCategoryData = marketData.categories.find((category) => category.id === selectedCategory);
  const selectedInstruments = selectedCategory ? mockInstrumentData[selectedCategory] || [] : [];
  const smartRecommendation = smartInvestmentResult?.aiSmartRecommendation || smartInvestmentResult?.backend?.ai_smart_recommendation || null;
  const monthlyInvestment = Number(
    smartInvestmentResult?.monthlyInvestment ||
    smartInvestmentResult?.backend?.risk_profile?.cold_money_amount ||
    smartRecommendation?.financial_capacity?.monthly_budget ||
    budgetedInvestmentAmount ||
    mockInvestmentInsight.potentialInvestment
  );
  const recommendedCategoryId = profileCategoryId[riskProfile] || 'middle';
  const middleAssets = useMemo(
    () => marketData.middle.map((asset) => analysisByAsset[asset.ticker] || asset),
    [analysisByAsset, marketData.middle]
  );
  const highAssets = useMemo(
    () => marketData.high.map((asset) => analysisByAsset[asset.ticker] || asset),
    [analysisByAsset, marketData.high]
  );
  const combinedMarketAssets = useMemo(
    () => [...middleAssets, ...highAssets],
    [highAssets, middleAssets]
  );
  const selectedStock = useMemo(
    () => combinedMarketAssets.find((stock) => stock.ticker === selectedTicker),
    [combinedMarketAssets, selectedTicker]
  );

  const loadAssetAnalysis = async (asset) => {
    const ticker = String(asset?.ticker || asset?.symbol || '');
    if (!ticker) return null;

    const response = await getInvestmentProductAnalysis(
      asset.apiType || 'stock',
      asset.apiSymbol || asset.symbol || ticker
    );
    return {
      ticker,
      asset: mergeAnalysisIntoAsset(asset, response),
    };
  };

  useEffect(() => {
    clearLegacyInvestmentStorage();
    setIsQuizFinished(localStorage.getItem(storageKeys.quizFinished) === 'true');
    setRiskProfile(localStorage.getItem(storageKeys.riskProfile) || null);
    setInvestmentAnswers(readSmartInvestmentAnswers(storageKeys.smartInvestment));
    setSmartInvestmentResult(readSmartInvestmentResult(storageKeys.smartInvestment));
    setFavorites(readStoredArray(storageKeys.favorites));
    setPriceAlerts(readStoredArray(storageKeys.priceAlerts));
    setCurrentStep(0);
    setIsQuizStarted(false);
    setIsQuizSubmitting(false);
    setSelectedCategory(null);
    setSelectedInstrument(null);
    setSelectedTicker(null);
    setAnalysisByAsset({});
    analysisPrefetchRef.current = new Set();
    setQuery('');
    setSentiment('Semua Sentimen');
  }, [storageKeys]);

  useEffect(() => {
    if (!isQuizFinished) return undefined;

    let ignore = false;
    const loadMarketData = async () => {
      setMarketStatus({ loading: true, error: null });
      try {
        const [lowResponse, middleResponse, highResponse] = await Promise.all([
          getInvestmentMarketByRisk('conservative'),
          getInvestmentMarketByRisk('moderate'),
          getInvestmentMarketByRisk('aggressive'),
        ]);

        const lowProducts = lowResponse?.data?.category?.instruments || [];
        const middleProducts = middleResponse?.data?.category?.instruments || [];
        const highProducts = highResponse?.data?.category?.instruments || [];
        const nextLowRisk = lowProducts.map(lowRiskInstrumentFromProduct);
        const nextMiddle = middleProducts
          .filter((product) => product.investment_type === 'stock')
          .map((product) => stockFromProduct(product, 'middle'));
        const nextHigh = highProducts
          .filter((product) => product.investment_type === 'crypto')
          .map((product) => stockFromProduct(product, 'high'));

        if (ignore) return;

        setMarketData({
          categories: [
            { ...categoryMetaById.low, items: `${nextLowRisk.length || lowRiskInstruments.length} instrumen konservatif dari database.` },
            { ...categoryMetaById.middle, items: `${nextMiddle.length || mockStockAnalysis.length} saham terkurasi dari data pasar.` },
            { ...categoryMetaById.high, items: `${nextHigh.length || mockStockAnalysis.length} crypto terkurasi dari data pasar.` },
          ],
          lowRisk: nextLowRisk.length > 0 ? nextLowRisk : lowRiskInstruments,
          middle: nextMiddle.length > 0 ? nextMiddle : mockStockAnalysis.filter((stock) => stock.market === 'IDX'),
          high: nextHigh.length > 0 ? nextHigh : mockStockAnalysis.filter((stock) => stock.market === 'CRYPTO'),
          source: 'backend',
        });
        setMarketStatus({ loading: false, error: null });
      } catch (error) {
        if (!ignore) {
          setMarketStatus({
            loading: false,
            error: error?.response?.data?.message || error.message || 'Gagal memuat data market investasi.',
          });
        }
      }
    };

    loadMarketData();

    return () => {
      ignore = true;
    };
  }, [isQuizFinished]);

  useEffect(() => {
    if (!isQuizFinished || marketData.source !== 'backend') return undefined;

    let ignore = false;
    const assets = [...marketData.middle, ...marketData.high]
      .filter((asset) => {
        const ticker = String(asset?.ticker || asset?.symbol || '');
        if (!ticker || asset.backendAnalysis || analysisPrefetchRef.current.has(ticker)) {
          return false;
        }
        analysisPrefetchRef.current.add(ticker);
        return true;
      })
      .slice(0, 30);

    const prefetch = async () => {
      const concurrency = 4;
      for (let index = 0; index < assets.length && !ignore; index += concurrency) {
        const chunk = assets.slice(index, index + concurrency);
        const results = await Promise.allSettled(chunk.map(loadAssetAnalysis));
        if (ignore) return;

        const nextEntries = {};
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.ticker && result.value?.asset) {
            nextEntries[result.value.ticker] = result.value.asset;
          }
        });

        if (Object.keys(nextEntries).length > 0) {
          setAnalysisByAsset((prev) => ({ ...prev, ...nextEntries }));
        }
      }
    };

    prefetch();

    return () => {
      ignore = true;
    };
  }, [isQuizFinished, marketData.high, marketData.middle, marketData.source]);

  useEffect(() => {
    let ignore = false;

    const loadInvestmentBudget = async () => {
      try {
        const response = await getInvestmentAnalysisDetail();
        const nextAmount = Number(response?.data?.fund_source?.investment_potential || 0);
        if (!ignore && nextAmount > 0) {
          setBudgetedInvestmentAmount(nextAmount);
          setInvestmentAnswers((prev) => (
            prev.investment_amount_source
              ? prev
              : {
                ...prev,
                investment_amount_source: {
                  value: nextAmount,
                  source: 'budget',
                  budgetAmount: nextAmount,
                },
              }
          ));
        }
      } catch {
        if (!ignore) {
          setBudgetedInvestmentAmount(mockInvestmentInsight.potentialInvestment);
        }
      }
    };

    if (!isQuizFinished) {
      loadInvestmentBudget();
    }

    return () => {
      ignore = true;
    };
  }, [isQuizFinished, storageKeys.smartInvestment]);

  const filteredStocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseAssets = selectedCategory === 'middle'
      ? middleAssets
      : highAssets;

    return baseAssets
      .filter((stock) => (
        sentiment === 'Semua Sentimen'
        || stock.sentiment === sentiment
        || (sentiment === 'Sangat Bullish' && stock.score >= 6.7)
        || (sentiment === 'Sangat Bearish' && stock.score <= 4.5)
      ))
      .filter((stock) => (
        !normalizedQuery
        || String(stock.ticker || '').toLowerCase().includes(normalizedQuery)
        || String(stock.name || '').toLowerCase().includes(normalizedQuery)
      ))
      .sort((a, b) => b.score - a.score);
  }, [highAssets, middleAssets, query, selectedCategory, sentiment]);

  useEffect(() => {
    saveStoredArray(storageKeys.favorites, favorites);
  }, [favorites, storageKeys.favorites]);

  useEffect(() => {
    saveStoredArray(storageKeys.priceAlerts, priceAlerts);
  }, [priceAlerts, storageKeys.priceAlerts]);

  useEffect(() => {
    const triggeredAlerts = priceAlerts.filter((alert) => {
      if (alert.triggered) return false;
      const stock = combinedMarketAssets.find((item) => item.ticker === alert.ticker);
      if (!stock) return false;

      return alert.direction === 'above'
        ? stock.price >= alert.targetPrice
        : stock.price <= alert.targetPrice;
    });

    if (triggeredAlerts.length === 0) return;

    triggeredAlerts.forEach((alert) => {
      const stock = combinedMarketAssets.find((item) => item.ticker === alert.ticker);
      addNotification({
        type: 'alert',
        title: `Alert harga ${alert.ticker}`,
        message: `${alert.ticker} menyentuh target ${formatPrice(alert.targetPrice, alert.market)}. Harga sekarang ${formatPrice(stock?.price || alert.currentPrice, alert.market)}.`,
      });
    });

    setPriceAlerts((prev) => prev.map((alert) => (
      triggeredAlerts.some((triggered) => triggered.id === alert.id)
        ? { ...alert, triggered: true, triggeredAt: new Date().toISOString() }
        : alert
    )));
  }, [addNotification, combinedMarketAssets, priceAlerts]);

  const riskProfileBadgeClass = riskProfile === 'Konservatif'
    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
    : riskProfile === 'Agresif'
      ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400'
      : 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400';

  const handleQuizAnswerChange = (answer) => {
    if (!answer?.key) return;

    setInvestmentAnswers((prev) => ({
      ...prev,
      [answer.key]: {
        value: answer.value,
        source: answer.source,
        manualAmount: answer.manualAmount,
        budgetAmount: answer.budgetAmount,
      },
    }));
  };

  const handleQuizNext = async () => {
    if (currentStep < INVESTMENT_QUIZ_TOTAL_STEPS) {
      setCurrentStep((step) => step + 1);
      return;
    }

    setIsQuizSubmitting(true);
    const riskScore = calculateRiskScore(investmentAnswers);
    const flattenedAnswers = flattenSmartInvestmentAnswers(investmentAnswers);
    const amountAnswer = investmentAnswers.investment_amount_source || {};
    const selectedInvestmentAmount = Number(
      amountAnswer.source === 'manual'
        ? amountAnswer.value
        : amountAnswer.value || budgetedInvestmentAmount || monthlyInvestment
    );
    let backendData = null;
    let profile = getRiskProfileFromScore(riskScore);
    let nextMonthlyInvestment = selectedInvestmentAmount || monthlyInvestment || mockInvestmentInsight.potentialInvestment;

    try {
      const response = await submitRiskQuiz({
        answers: flattenedAnswers,
        cold_money_amount: nextMonthlyInvestment,
      });
      backendData = response?.data || null;
      profile =
        backendData?.risk_profile?.label ||
        profileLabelFromRiskLevel(backendData?.risk_profile?.risk_level) ||
        profile;
      nextMonthlyInvestment = Number(
        backendData?.risk_profile?.cold_money_amount ||
        backendData?.ai_smart_recommendation?.financial_capacity?.monthly_budget ||
        nextMonthlyInvestment
      );
    } catch (error) {
      showWarning(error?.response?.data?.message || 'Data investasi belum merespons. Finly memakai hasil kuis lokal sementara.');
    } finally {
      setIsQuizSubmitting(false);
    }

    const nextResult = {
      ...flattenedAnswers,
      answers: investmentAnswers,
      riskScore,
      riskProfile: profile,
      monthlyInvestment: nextMonthlyInvestment,
      backend: backendData,
      aiSmartRecommendation: backendData?.ai_smart_recommendation || null,
    };

    setRiskProfile(profile);
    setSmartInvestmentResult(nextResult);
    setIsQuizFinished(true);
    localStorage.setItem(storageKeys.riskProfile, profile);
    localStorage.setItem(storageKeys.quizFinished, 'true');
    localStorage.setItem(storageKeys.smartInvestment, JSON.stringify(nextResult));
  };

  const handleQuizPrevious = () => {
    if (isQuizSubmitting) return;
    if (currentStep === 0) {
      setIsQuizStarted(false);
      return;
    }
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  useEffect(() => {
    if (!isQuizStarted || isQuizFinished) return;
    quizTopRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [currentStep, isQuizFinished, isQuizStarted]);

  const handleResetQuiz = () => {
    setIsQuizFinished(false);
    setIsQuizStarted(false);
    setIsQuizSubmitting(false);
    setCurrentStep(0);
    setInvestmentAnswers({});
    setSmartInvestmentResult(null);
    setSelectedCategory(null);
    setSelectedInstrument(null);
    setSelectedTicker(null);
    localStorage.removeItem(storageKeys.quizFinished);
    localStorage.removeItem(storageKeys.riskProfile);
    localStorage.removeItem(storageKeys.smartInvestment);
  };

  const openStockDetail = async (stock) => {
    const ticker = String(stock?.ticker || stock?.symbol || '');
    if (!ticker) return;

    setSelectedTicker(ticker);
    setPeriod('3M');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stock.backendAnalysis || analysisByAsset[ticker]?.backendAnalysis) {
      return;
    }

    try {
      const result = await loadAssetAnalysis(stock);
      if (!result) return;
      setAnalysisByAsset((prev) => ({
        ...prev,
        [ticker]: result.asset,
      }));
    } catch {
      // Detail tetap memakai data katalog jika analisis mendalam belum aktif.
    }
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedTicker(null);
    setSelectedInstrument(null);
    setQuery('');
    setSentiment('Semua Sentimen');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedTicker(null);
    setSelectedInstrument(null);
  };

  const isFavorite = (ticker) => favorites.some((favorite) => favorite.ticker === ticker);
  const hasActiveAlert = (ticker) => priceAlerts.some((alert) => alert.ticker === ticker && !alert.triggered);

  const toggleFavorite = (stock) => {
    const exists = favorites.some((favorite) => favorite.ticker === stock.ticker);

    if (exists) {
      setFavorites((prev) => prev.filter((favorite) => favorite.ticker !== stock.ticker));
      showWarning(`${stock.ticker} dihapus dari favorit.`);
      return;
    }

    setFavorites((prev) => [
      {
        ticker: stock.ticker,
        name: stock.name,
        market: stock.market,
        price: stock.price,
        addedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    showSuccess(`${stock.ticker} ditambahkan ke favorit.`);
  };

  const handleSavePriceAlert = (stock, targetPrice) => {
    const normalizedTarget = Number(targetPrice);
    if (!normalizedTarget || normalizedTarget <= 0) {
      showWarning('Masukkan target harga yang valid.');
      return;
    }
    if (normalizedTarget === Number(stock.price)) {
      showWarning('Target alert harus berbeda dari harga sekarang.');
      return;
    }

    const direction = normalizedTarget >= Number(stock.price) ? 'above' : 'below';
    setPriceAlerts((prev) => [
      {
        id: `${stock.ticker}-${Date.now()}`,
        ticker: stock.ticker,
        name: stock.name,
        market: stock.market,
        currentPrice: stock.price,
        targetPrice: normalizedTarget,
        direction,
        triggered: false,
        createdAt: new Date().toISOString(),
      },
      ...prev.filter((alert) => alert.ticker !== stock.ticker || alert.triggered),
    ]);
    setAlertTargetStock(null);
    showSuccess(`Alert ${stock.ticker} disimpan.`);
  };

  return (
    <AppLayout activeMenu="investasi">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full">
        {!isQuizFinished ? (
          isQuizStarted ? (
            <div ref={quizTopRef}>
              <RiskQuiz
                currentStep={currentStep}
                answers={investmentAnswers}
                budgetAmount={budgetedInvestmentAmount}
                isSubmitting={isQuizSubmitting}
                onAnswerChange={handleQuizAnswerChange}
                onNext={handleQuizNext}
                onPrevious={handleQuizPrevious}
              />
            </div>
          ) : (
            <InvestmentQuizIntro
              onStart={() => {
                setIsQuizStarted(true);
                setCurrentStep(0);
              }}
            />
          )
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-[24px] sm:text-[26px] font-bold page-title break-words">Pasar Investasi</h1>
                  <div className={`w-fit max-w-full flex items-center gap-1.5 px-3 py-1 rounded-full border ${riskProfileBadgeClass}`}>
                    <ShieldCheck size={14} className="shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider break-words">Profil Risiko: {riskProfile}</span>
                  </div>
                </div>
                <p className="page-subtitle text-[14px] sm:text-[15px] break-words">
                  Rekomendasi investasi dan analisis saham berdasarkan profil risikomu.
                </p>
              </div>
              <button onClick={handleResetQuiz} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-gray-300 font-semibold text-[13px] hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/15 hover:text-[#05A845] border border-gray-200 dark:border-[#2e303a] transition-colors shadow-sm">
                <RotateCcw size={14} className="shrink-0" />
                Ulangi Kuis
              </button>
            </div>

            {!selectedCategory && (
              <SmartInvestmentSummary
                riskProfile={riskProfile}
                monthlyInvestment={monthlyInvestment}
                smartRecommendation={smartRecommendation}
              />
            )}

            <InvestmentRecommendation
              recommendedCategoryId={recommendedCategoryId}
              selectedCategory={selectedCategory}
              selectedCategoryData={selectedCategoryData}
              selectedInstruments={selectedInstruments}
              categories={marketData.categories}
              marketSource={marketData.source}
              marketStatus={marketStatus}
              lowRiskInstrumentsData={marketData.lowRisk}
              onSelectCategory={handleSelectCategory}
              onBackToCategories={handleBackToCategories}
              monthlyInvestment={monthlyInvestment}
              selectedInstrument={selectedInstrument}
              onSelectInstrument={setSelectedInstrument}
              filteredStocks={filteredStocks}
              query={query}
              setQuery={setQuery}
              sentiment={sentiment}
              setSentiment={setSentiment}
              selectedStock={selectedStock}
              period={period}
              setPeriod={setPeriod}
              onOpenStock={openStockDetail}
              onBackToStockList={() => setSelectedTicker(null)}
              favorites={favorites}
              isFavorite={isFavorite}
              hasActiveAlert={hasActiveAlert}
              onToggleFavorite={toggleFavorite}
              onOpenAlert={setAlertTargetStock}
            />
          </div>
        )}
      </div>

      <PriceAlertModal
        stock={alertTargetStock}
        onClose={() => setAlertTargetStock(null)}
        onSave={handleSavePriceAlert}
      />
    </AppLayout>
  );
}

function SmartInvestmentSummary({
  riskProfile,
  monthlyInvestment,
  smartRecommendation,
}) {
  const backendAllocation = Array.isArray(smartRecommendation?.allocation_strategy)
    ? smartRecommendation.allocation_strategy.map((item, index) => ({
      label: item.label,
      description: item.rationale || item.description || '',
      percent: Number(item.percent ?? item.pct ?? 0),
      amount: Number(item.amount || 0),
      color: allocationColors[index % allocationColors.length],
    })).filter((item) => item.percent > 0)
    : [];
  const allocation = backendAllocation.length > 0
    ? backendAllocation
    : smartAllocationTemplates[riskProfile] || smartAllocationTemplates.Moderat;
  const insights = Array.isArray(smartRecommendation?.insights) && smartRecommendation.insights.length > 0
    ? smartRecommendation.insights
    : smartInsightsByProfile[riskProfile] || smartInsightsByProfile.Moderat;
  const focusLabel = riskProfile === 'Konservatif' ? 'Low Risk' : riskProfile;
  const summaryCopy = smartRecommendation?.summary || (riskProfile === 'Konservatif'
    ? `Fokus: ${focusLabel} untuk stabilitas dana. Untuk nominal awal seperti ini, fokus utamanya adalah membangun habit investasi, memahami karakter instrumen, dan menjaga konsistensi. Kenaikan nilai mungkin kecil di awal, tetapi kebiasaan dan pemahaman risiko menjadi modal yang lebih penting.`
    : `Fokus: ${focusLabel} untuk rekomendasi yang tetap memperhatikan diversifikasi, likuiditas, dan risk budgeting.`);

  return (
    <section className="bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-[24px] p-5 sm:p-6 lg:p-8 border border-[#05A845]/20 dark:border-[#05A845]/25 shadow-sm mb-10">
      <div className="flex gap-4 items-start min-w-0 mb-5">
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white dark:bg-[#1f2028] rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Lightbulb size={23} className="text-yellow-500 fill-current" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[18px] font-bold page-title mb-2 break-words">AI Smart Recommendation</h3>
          <p className="app-heading text-[14px] leading-relaxed max-w-3xl break-words">
            {smartRecommendation?.summary
              ? summaryCopy
              : (
                <>
                  Potensi investasi bulan ini <strong className="text-[#05A845]">{formatIDR(monthlyInvestment)}</strong>. {summaryCopy}
                </>
              )}
          </p>
        </div>
      </div>

      <div className="bg-white/85 dark:bg-[#1f2028]/80 rounded-[18px] border border-white dark:border-[#2e303a] p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5">
        <div className="min-w-0">
          <h4 className="text-[12px] font-black uppercase tracking-wider text-[#05A845] mb-3">Strategi Alokasi</h4>
          <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-gray-100 dark:bg-white/[0.08]">
            {allocation.map((item) => (
              <div key={item.label} className={`${item.color} h-full`} style={{ width: `${item.percent}%` }} />
            ))}
          </div>
          <div className="space-y-3">
            {allocation.map((item) => {
              const amount = Math.round((monthlyInvestment * item.percent) / 100);
              return (
                <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[12px] sm:text-[13px] min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                    <span className="font-bold app-heading truncate">{item.label}</span>
                    <span className="hidden sm:inline app-muted truncate">- {item.description}</span>
                  </div>
                  <span className="font-black text-[#05A845]">{item.percent}%</span>
                  <span className="font-black app-heading whitespace-nowrap">{formatIDR(item.amount || amount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="text-[12px] font-black uppercase tracking-wider text-[#05A845] mb-3">Insight Singkat</h4>
          <div className="space-y-3">
            {insights.map((item, index) => (
              <p key={item} className="text-[13px] leading-relaxed app-heading flex gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845] shrink-0 flex items-center justify-center text-[11px] font-black">
                  {index + 1}
                </span>
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {Array.isArray(smartRecommendation?.warnings) && smartRecommendation.warnings.length > 0 && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2.5 text-[13px] text-amber-800 dark:text-amber-200 leading-relaxed">
          <TriangleAlert size={16} className="shrink-0 mt-0.5" />
          <p>{smartRecommendation.warnings[0]}</p>
        </div>
      )}
    </section>
  );
}

function PriceAlertModal({ stock, onClose, onSave }) {
  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    if (stock) {
      setTargetInput('');
    }
  }, [stock]);

  if (!stock) return null;

  const parseTarget = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
  const targetPrice = parseTarget(targetInput);
  const directionText = targetPrice >= stock.price ? 'naik menyentuh' : 'turun menyentuh';
  const hasTarget = targetPrice > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-w-md md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-5 sm:p-6 border-b app-divider">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[18px] font-bold app-heading break-words">Pasang Alert Harga</h3>
              <p className="text-[13px] app-muted mt-1 break-words">
                {stock.ticker} - {stock.name}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
              x
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] p-4">
            <p className="text-[11px] app-muted font-bold uppercase tracking-wider">Harga Sekarang</p>
            <p className="text-[24px] font-black app-heading mt-1">{formatPrice(stock.price, stock.market)}</p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold app-muted mb-2">Target Harga</label>
            <input
              value={targetInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/[^0-9]/g, '');
                setTargetInput(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
              }}
              placeholder="Masukkan target harga"
              className="w-full h-12 px-4 app-input rounded-xl text-[15px] font-bold"
            />
            <p className="text-[12px] app-muted mt-2">
              {hasTarget
                ? `Finly akan memberi notifikasi saat harga ${directionText} ${formatPrice(targetPrice, stock.market)}.`
                : 'Isi target di atas atau di bawah harga sekarang agar alert tetap aktif.'}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 border-t app-divider flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] app-muted font-semibold text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
            Batal
          </button>
          <button onClick={() => onSave(stock, targetPrice)} className="px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors">
            Simpan Alert
          </button>
        </div>
      </div>
    </div>
  );
}

function InvestmentRecommendation({
  recommendedCategoryId,
  selectedCategory,
  selectedCategoryData,
  selectedInstruments,
  categories,
  marketSource,
  marketStatus,
  lowRiskInstrumentsData,
  onSelectCategory,
  onBackToCategories,
  monthlyInvestment,
  selectedInstrument,
  onSelectInstrument,
  filteredStocks,
  query,
  setQuery,
  sentiment,
  setSentiment,
  selectedStock,
  period,
  setPeriod,
  onOpenStock,
  onBackToStockList,
  favorites,
  isFavorite,
  hasActiveAlert,
  onToggleFavorite,
  onOpenAlert,
}) {
  const categoryCards = categories?.length ? categories : mockInvestmentCategories;

  return (
    <section className="mb-10">
      {!selectedCategory ? (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">Rekomendasi Berdasarkan Profil Risiko</h2>
              <p className="text-[13px] text-[#666666] dark:text-gray-400 mt-1 break-words">
                Dibagi menjadi 3 kategori utama: low risk, middle risk, dan high risk.
              </p>
              {marketStatus?.error && (
                <p className="text-[12px] text-amber-600 dark:text-amber-300 mt-2">
                  Data market belum bisa dimuat, sementara memakai data lokal.
                </p>
              )}
            </div>
            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-[11px] font-black ${marketSource === 'backend'
                ? 'bg-[#EAF6ED] text-[#05A845]'
                : 'bg-amber-50 text-amber-700'
              }`}>
              {marketStatus?.loading ? 'Memuat market...' : marketSource === 'backend' ? 'Data market' : 'Data lokal'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryCards.map((category) => (
              <RiskCategoryCard
                key={category.id}
                {...category}
                icon={investmentIconByKey[category.iconKey]}
                isRecommended={category.id === recommendedCategoryId}
                onClick={() => onSelectCategory(category.id)}
              />
            ))}
          </div>
        </div>
      ) : selectedCategory === 'low' ? (
        <div className="animate-in slide-in-from-right-8 duration-500">
          {!selectedInstrument && (
            <button onClick={onBackToCategories} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium text-[14px] mb-6 transition-colors">
              &larr; Kembali ke Kategori
            </button>
          )}
          <LowRiskSection
            query={query}
            setQuery={setQuery}
            instruments={lowRiskInstrumentsData}
            monthlyInvestment={monthlyInvestment}
            selectedInstrument={selectedInstrument}
            onSelectInstrument={onSelectInstrument}
            onBack={() => onSelectInstrument(null)}
          />
        </div>
      ) : selectedCategory === 'high' || selectedCategory === 'middle' ? (
        <div className="animate-in slide-in-from-right-8 duration-500">
          {!selectedStock && (
            <button onClick={onBackToCategories} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium text-[14px] mb-6 transition-colors">
              &larr; Kembali ke Kategori
            </button>
          )}

          <StockAnalysisSection
            filteredStocks={filteredStocks}
            query={query}
            setQuery={setQuery}
            categoryType={selectedCategory}
            selectedCategoryData={selectedCategoryData}
            sentiment={sentiment}
            setSentiment={setSentiment}
            selectedStock={selectedStock}
            period={period}
            setPeriod={setPeriod}
            onOpenStock={onOpenStock}
            onBack={onBackToStockList}
            favorites={favorites}
            isFavorite={isFavorite}
            hasActiveAlert={hasActiveAlert}
            onToggleFavorite={onToggleFavorite}
            onOpenAlert={onOpenAlert}
          />
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <button onClick={onBackToCategories} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white font-medium text-[14px] mb-6 transition-colors">
            &larr; Kembali ke Kategori
          </button>
          <div className="app-card rounded-[24px] overflow-hidden">
            <div className="p-5 sm:p-6 lg:p-8 border-b app-divider bg-gray-50/30 dark:bg-white/[0.02] flex flex-col md:flex-row justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-1">{selectedCategoryData?.title}</p>
                <h2 className="text-[20px] sm:text-[22px] font-bold app-heading mb-1 break-words">Daftar {selectedCategoryData?.label}</h2>
                <p className="text-[14px] app-muted break-words">Pilihan instrumen yang masuk kategori {selectedCategoryData?.title.toLowerCase()}.</p>
              </div>
            </div>
            <div className="p-4 space-y-1">
              {selectedInstruments.map((item) => (
                <InstrumentItem key={item.code} {...item} onClick={onSelectInstrument} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LowRiskSection({
  query,
  setQuery,
  instruments,
  monthlyInvestment,
  selectedInstrument,
  onSelectInstrument,
  onBack,
}) {
  const [activeClass, setActiveClass] = useState('Reksadana');
  const [returnPeriod, setReturnPeriod] = useState('1 Tahun');
  const [fundType, setFundType] = useState('Semua');
  const normalizedQuery = query.trim().toLowerCase();
  const sourceInstruments = instruments?.length ? instruments : lowRiskInstruments;
  const fundTypeOptions = useMemo(() => {
    const kinds = Array.from(new Set(
      sourceInstruments
        .filter((instrument) => instrument.type === 'Reksadana')
        .map((instrument) => instrument.kind)
        .filter(Boolean)
    ));

    return [
      { value: 'Semua', label: 'Semua jenis' },
      ...kinds.map((kind) => ({ value: kind, label: formatFundTypeLabel(kind) })),
    ];
  }, [sourceInstruments]);
  const filteredInstruments = sourceInstruments.filter((instrument) => {
    const matchesClass = instrument.type === activeClass;
    const matchesPeriod = returnPeriod === 'Semua'
      || instrument.horizon === returnPeriod
      || (returnPeriod === '1 Tahun' && Number.isFinite(Number(instrument.return1y)))
      || (returnPeriod === '1 Bulan' && Number.isFinite(Number(instrument.return1m)))
      || (returnPeriod === '3 Tahun' && Number.isFinite(Number(instrument.return3y)));
    const matchesFundType = activeClass !== 'Reksadana'
      || fundType === 'Semua'
      || instrument.kind === fundType;
    const matchesQuery = !normalizedQuery
      || instrument.name.toLowerCase().includes(normalizedQuery)
      || instrument.provider.toLowerCase().includes(normalizedQuery)
      || instrument.type.toLowerCase().includes(normalizedQuery);

    return matchesClass && matchesPeriod && matchesFundType && matchesQuery;
  });

  if (selectedInstrument) {
    return (
      <LowRiskDetail
        instrument={selectedInstrument}
        monthlyInvestment={monthlyInvestment}
        onBack={onBack}
      />
    );
  }

  return (
    <section className="pt-2">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-1">Low Risk</p>
          <h2 className="text-[22px] sm:text-[24px] font-bold page-title mb-1 break-words">Daftar Instrumen Low Risk</h2>
          <p className="page-subtitle text-[14px] sm:text-[15px] max-w-2xl break-words">
            Instrumen konservatif untuk dana likuid, SBN ritel, dan logam mulia sebagai fondasi portofolio.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <MiniStat label="Universe" value={`${filteredInstruments.length} instrumen`} />
          <MiniStat label="Kelas" value={lowRiskClassOptions.find((item) => item.value === activeClass)?.label || activeClass} />
          <MiniStat label="Mode" value={instruments?.length ? 'Database' : 'Fallback'} />
        </div>
      </div>

      <div className="app-card rounded-[24px] p-4 sm:p-5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama instrumen..."
            className="w-full h-12 pl-11 pr-4 app-input rounded-xl text-[14px]"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_190px_220px] gap-3">
          <div className="min-w-0">
            <div className="flex items-center">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {lowRiskClassOptions.map((option) => {
                  const selected = activeClass === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setActiveClass(option.value);
                        setFundType('Semua');
                        setReturnPeriod(option.value === 'Reksadana' ? '1 Tahun' : 'Semua');
                      }}
                      className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold whitespace-nowrap transition-all inline-flex items-center gap-2 ${selected
                          ? 'bg-[#05A845] border-[#05A845] text-white shadow-sm'
                          : 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-[#2e303a] text-gray-600 dark:text-gray-300 hover:border-[#05A845]/30 hover:text-[#05A845]'
                        }`}
                    >
                      <span className="shrink-0">{option.icon}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <CustomSelect
            value={returnPeriod}
            onChange={setReturnPeriod}
            options={lowRiskReturnOptions}
            buttonClassName="bg-white dark:bg-[#1f2028]"
          />
          <CustomSelect
            value={fundType}
            onChange={setFundType}
            options={fundTypeOptions.length > 1 ? fundTypeOptions : lowRiskFundTypeOptions}
            disabled={activeClass !== 'Reksadana'}
            buttonClassName="bg-white dark:bg-[#1f2028]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3 rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 border border-[#05A845]/20 p-3">
          <div>
            <h3 className="text-[12px] font-black app-heading mb-1">Strategi alokasi low risk</h3>
            <p className="text-[13px] app-muted">50% RDPU + 30% SBN + 20% Emas</p>
          </div>
          <p className="text-[13px] leading-relaxed app-heading">
            Mulai dari reksa dana pasar uang untuk dana darurat, tambah SBN saat ada penawaran baru, dan gunakan emas sebagai lindung nilai jangka panjang.
          </p>
        </div>
      </div>

      {filteredInstruments.length === 0 ? (
        <div className="app-card rounded-[24px] p-10 text-center">
          <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="font-bold app-heading mb-1">Instrumen tidak ditemukan</p>
          <p className="text-[13px] app-muted">Coba ubah kata kunci atau filter low risk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredInstruments.map((instrument) => (
            <LowRiskCard
              key={instrument.code}
              instrument={instrument}
              returnPeriod={returnPeriod}
              onClick={() => onSelectInstrument(instrument)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LowRiskCard({ instrument, returnPeriod = '1 Tahun', onClick }) {
  const displayedReturn = returnPeriod === '1 Bulan'
    ? instrument.return1m
    : returnPeriod === '3 Tahun'
      ? instrument.return3y
      : instrument.return1y;
  const returnTone = displayedReturn >= 0 ? 'text-[#05A845]' : 'text-red-500';
  const returnLabel = returnPeriod === 'Semua' ? 'Return 1 tahun' : `Return ${returnPeriod.toLowerCase()}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="app-card rounded-[18px] p-4 sm:p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all min-w-0"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span className="inline-flex px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.04] app-muted text-[10px] font-black mb-2">
            {instrument.kind}
          </span>
          <h3 className="text-[17px] font-black app-heading truncate">{instrument.name}</h3>
          <p className="text-[12px] app-muted truncate">{instrument.provider}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-[22px] font-black leading-none ${returnTone}`}>
            {displayedReturn > 0 ? '+' : ''}{Number(displayedReturn || 0).toFixed(1)}%
          </p>
          <p className="text-[10px] app-muted mt-1">{returnLabel}</p>
        </div>
      </div>

      <p className="text-[13px] app-muted leading-relaxed line-clamp-2 mb-4">{instrument.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <LowRiskMiniBox label="Minimum" value={formatIDR(instrument.minimum)} />
        <LowRiskMiniBox label="Risiko" value={instrument.risk} />
      </div>

      <div className="flex items-center justify-between text-[13px] font-black text-[#05A845]">
        <span>Lihat detail</span>
        <ArrowRight size={15} />
      </div>
    </button>
  );
}

function LowRiskMiniBox({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-wider app-muted mb-1">{label}</p>
      <p className="text-[13px] font-black app-heading truncate">{value}</p>
    </div>
  );
}

function LowRiskDetail({ instrument, monthlyInvestment, onBack }) {
  const [analysisState, setAnalysisState] = useState({ loading: false, data: null, error: null });
  const allocationAmount = Math.round((monthlyInvestment * instrument.allocationPercent) / 100);
  const goldAnalysis = analysisState.data?.analysis || {};
  const effectiveReturn = Number.isFinite(Number(goldAnalysis?.simulation?.estimated_return_pct_1y))
    ? Number(goldAnalysis.simulation.estimated_return_pct_1y)
    : instrument.return1y;
  const estimatedReturn = Math.round((allocationAmount * effectiveReturn) / 100);
  const estimatedEnd = allocationAmount + estimatedReturn;
  const isGold = instrument.type === 'Emas';
  const buyPrice = Number(goldAnalysis.buy_price || instrument.priceIdr || instrument.minimum || 0);
  const sellPrice = Number(goldAnalysis.sell_price || instrument.buybackIdr || 0);
  const spreadPct = Number.isFinite(Number(goldAnalysis.spread_pct))
    ? Number(goldAnalysis.spread_pct)
    : instrument.spreadPct;
  const estimatedGram = Number(goldAnalysis.estimated_gram || (buyPrice > 0 ? allocationAmount / buyPrice : 0));

  useEffect(() => {
    let ignore = false;
    if (!isGold) {
      setAnalysisState({ loading: false, data: null, error: null });
      return undefined;
    }

    setAnalysisState({ loading: true, data: null, error: null });
    getInvestmentProductAnalysis(instrument.apiType || 'gold', instrument.code)
      .then((response) => {
        if (!ignore) {
          setAnalysisState({
            loading: false,
            data: unwrapAnalysis(response),
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setAnalysisState({
            loading: false,
            data: null,
            error: error?.response?.data?.message || error.message || 'Analisis logam mulia belum tersedia.',
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [instrument.apiType, instrument.code, isGold]);

  return (
    <section className="pt-2 animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[#05A845] hover:text-[#048A38] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Instrumen
      </button>

      <div className="app-card rounded-[24px] overflow-hidden mb-5">
        <div className="p-5 sm:p-6 lg:p-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 border-b app-divider">
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase tracking-wider text-[#05A845] mb-2">{instrument.kind}</p>
            <h2 className="text-[24px] sm:text-[28px] font-black page-title mb-2 break-words">{instrument.name}</h2>
            <p className="text-[13px] app-muted">{instrument.provider}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {isGold ? (
              <>
                <LowRiskTopStat label="Harga Jual" value={formatIDR(buyPrice)} />
                <LowRiskTopStat label="Buyback" value={sellPrice ? formatIDR(sellPrice) : '-'} />
                <LowRiskTopStat label="Spread" value={`${Number(spreadPct || 0).toFixed(1)}%`} tone={spreadPct <= 5 ? 'green' : undefined} />
              </>
            ) : (
              <>
                <LowRiskTopStat label="Return 1 Tahun" value={`${instrument.return1y > 0 ? '+' : ''}${instrument.return1y.toFixed(1)}%`} tone={instrument.return1y >= 0 ? 'green' : 'red'} />
                <LowRiskTopStat label="Minimum" value={formatIDR(instrument.minimum)} />
                <LowRiskTopStat label="Alokasi" value={`${instrument.allocationPercent}%`} />
              </>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-[#EAF6ED] dark:bg-[#05A845]/10 border border-[#05A845]/20 p-4 text-[13px] leading-relaxed app-heading">
            {instrument.description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        <div className="app-card rounded-[18px] p-4 sm:p-5">
          <h3 className="text-[16px] font-bold app-heading mb-4">Ringkasan Instrumen</h3>
          {isGold ? (
            <div className="grid grid-cols-2 gap-3">
              <LowRiskMiniBox label="Denominasi" value={instrument.denominationGram ? `${instrument.denominationGram} gr` : 'Antam'} />
              <LowRiskMiniBox label="Estimasi Gram" value={`${estimatedGram.toFixed(4)} gr`} />
              <LowRiskMiniBox label="Harga Jual" value={formatIDR(buyPrice)} />
              <LowRiskMiniBox label="Buyback" value={sellPrice ? formatIDR(sellPrice) : '-'} />
              <LowRiskMiniBox label="Spread" value={`${Number(spreadPct || 0).toFixed(2)}%`} />
              <LowRiskMiniBox label="Sumber" value={goldAnalysis?.antam_denomination?.source || instrument.provider || 'Antam'} />
              <LowRiskMiniBox label="Update" value={String(goldAnalysis?.fetched_at || instrument.sourceDate || '-').slice(0, 10)} />
              <LowRiskMiniBox label="Status" value={analysisState.loading ? 'Memuat' : analysisState.error ? 'Data harga' : 'Analisis tersedia'} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <LowRiskMiniBox label="Jenis" value={instrument.sharia ? 'Syariah' : 'Konvensional'} />
              <LowRiskMiniBox label="NAB/Unit" value={formatIDR(instrument.nav)} />
              <LowRiskMiniBox label="Return 1 Bulan" value={`${instrument.return1m > 0 ? '+' : ''}${instrument.return1m.toFixed(1)}%`} />
              <LowRiskMiniBox label="Return 3 Tahun" value={`${instrument.return3y > 0 ? '+' : ''}${instrument.return3y.toFixed(1)}%`} />
              <LowRiskMiniBox label="Syariah" value={instrument.sharia ? 'Ya' : 'Tidak'} />
              <LowRiskMiniBox label="Rank Jenis" value={`#${instrument.rank}`} />
              <LowRiskMiniBox label="Risiko" value={instrument.risk} />
              <LowRiskMiniBox label="Skor Finly" value={instrument.pipelineScore.toFixed(2)} />
            </div>
          )}
        </div>

        <div className="app-card rounded-[18px] p-4 sm:p-5">
          <h3 className="text-[16px] font-bold app-heading mb-4">Peran Dalam Portofolio</h3>
          <div className="flex justify-between gap-3 text-[13px] font-bold mb-2">
            <span className="app-heading">Porsi contoh dari dana bulanan</span>
            <span className="app-heading">{formatIDR(allocationAmount)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden mb-4">
            <div className="h-full rounded-full bg-[#05A845]" style={{ width: `${instrument.allocationPercent}%` }} />
          </div>
          <p className="text-[12px] app-muted mb-5">
            {isGold
              ? 'Logam mulia berperan sebagai lindung nilai. Harga dapat tertunda dari sumber pasar, bukan harga tick-by-tick.'
              : 'Pelengkap low risk sesuai kebutuhan likuiditas dan horizon.'}
          </p>

          <h4 className="text-[14px] font-black app-heading mb-3">Simulasi Return 1 Tahun</h4>
          <div className="space-y-3">
            <LowRiskMiniBox label="Setoran 12 Bulan" value={formatIDR(allocationAmount * 12)} />
            <LowRiskMiniBox label="Estimasi Imbal Hasil" value={formatIDR(estimatedReturn)} />
            <LowRiskMiniBox label="Estimasi Akhir Tahun" value={formatIDR(estimatedEnd)} />
          </div>
          <p className="text-[11px] app-muted mt-3">
            {isGold
              ? 'Simulasi memakai harga jual/buyback dan nominal investasi user. Spread dapat memengaruhi hasil jika dijual terlalu cepat.'
              : 'Simulasi memakai estimasi return tahunan dan dana investasi bulanan user. Hasil tidak dijamin.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <LowRiskNoteCard
          title="Cocok Untuk"
          tone="green"
          items={isGold ? (
            goldAnalysis.green_flags?.length ? goldAnalysis.green_flags : [
              'Lindung nilai jangka panjang',
              'Penyeimbang saat aset bertumbuh berfluktuasi',
              'Investor yang ingin instrumen mudah dipahami',
            ]
          ) : [
            'Diversifikasi tanpa memilih aset satu per satu',
            'Investasi berkala nominal kecil',
            'Investor yang ingin pengelolaan profesional',
          ]}
        />
        <LowRiskNoteCard
          title="Yang Perlu Diperhatikan"
          tone="amber"
          items={isGold ? (
            goldAnalysis.red_flags?.length ? goldAnalysis.red_flags : [
              'Ada selisih harga jual dan buyback',
              'Tidak menghasilkan kupon atau dividen',
              'Harga tetap bisa turun dalam jangka pendek',
            ]
          ) : [
            'Baca fund fact sheet sebelum membeli',
            'Return historis tidak menjamin hasil ke depan',
            'Perhatikan risiko underlying asset',
          ]}
        />
      </div>

      {isGold && (
        <div className="mt-5 app-card rounded-[18px] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-[#05A845]" />
            <h3 className="text-[16px] font-bold app-heading">Sumber Data</h3>
          </div>
          <p className="text-[13px] app-muted leading-relaxed">
            {goldAnalysis?.attribution?.physical || 'Emas fisik: Antam (via harga-emas.org)'}. {goldAnalysis?.attribution?.data || 'Data pasar komoditas: Yahoo Finance'}.
            Analisis ini bersifat edukatif dan bukan rekomendasi beli/jual.
          </p>
        </div>
      )}
    </section>
  );
}

function LowRiskTopStat({ label, value, tone }) {
  const toneClass = tone === 'green' ? 'text-[#05A845]' : tone === 'red' ? 'text-red-500' : 'app-heading';

  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-white/[0.03] px-3 py-2.5 min-w-0 text-center">
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider app-muted mb-1">{label}</p>
      <p className={`text-[12px] sm:text-[14px] font-black truncate ${toneClass}`}>{value}</p>
    </div>
  );
}

function LowRiskNoteCard({ title, items, tone }) {
  const toneClass = tone === 'green'
    ? 'bg-[#EAF6ED] dark:bg-[#05A845]/10 border-[#05A845]/20 text-[#05A845]'
    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300';

  return (
    <div className={`rounded-[18px] p-4 sm:p-5 border ${toneClass}`}>
      <h3 className="text-[15px] font-black mb-3">{title}</h3>
      <ul className="space-y-2 text-[13px] leading-relaxed">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function StockAnalysisSection({
  filteredStocks,
  query,
  setQuery,
  categoryType,
  selectedCategoryData,
  sentiment,
  setSentiment,
  selectedStock,
  period,
  setPeriod,
  onOpenStock,
  onBack,
  favorites,
  isFavorite,
  hasActiveAlert,
  onToggleFavorite,
  onOpenAlert,
}) {
  const isMiddleRisk = categoryType === 'middle';
  const title = isMiddleRisk ? 'Daftar Saham Moderat' : 'Daftar Crypto High Risk';
  const description = isMiddleRisk
    ? 'Screener edukatif untuk profil middle risk, fokus pada saham IDX berfundamental sehat, dividen, valuasi, dan level teknikal.'
    : 'Screener edukatif untuk profil high risk, fokus pada crypto berbasis market data, metrik risiko, Fear & Greed, news, dan sinyal teknikal.';
  const placeholder = isMiddleRisk ? 'Cari saham moderat, mis. BBRI, BBCA, BMRI...' : 'Cari crypto, mis. bitcoin, ethereum, solana...';

  return (
    <section className="pt-2">
      {selectedStock ? (
        <StockDetail
          stock={selectedStock}
          period={period}
          setPeriod={setPeriod}
          onBack={onBack}
          isFavorite={isFavorite(selectedStock.ticker)}
          hasAlert={hasActiveAlert(selectedStock.ticker)}
          onToggleFavorite={() => onToggleFavorite(selectedStock)}
          onOpenAlert={() => onOpenAlert(selectedStock)}
        />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-1">{selectedCategoryData?.title}</p>
              <h2 className="text-[22px] sm:text-[24px] font-bold page-title mb-1 break-words">{title}</h2>
              <p className="page-subtitle text-[14px] sm:text-[15px] max-w-2xl break-words">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <MiniStat label="Universe" value={`${filteredStocks.length} aset`} />
              <MiniStat label="Favorit" value={`${favorites.length} item`} />
              <MiniStat label="Mode" value="Data market" />
            </div>
          </div>

          <div className="app-card rounded-[24px] p-4 sm:p-5 mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="w-full h-12 pl-11 pr-4 app-input rounded-xl text-[14px]"
              />
            </div>

            <div className="flex items-center">
              <FilterGroup items={sentimentFilters} value={sentiment} onChange={setSentiment} />
            </div>
          </div>

          {filteredStocks.length === 0 ? (
            <div className="app-card rounded-[24px] p-10 text-center">
              <Search size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-bold app-heading mb-1">Aset tidak ditemukan</p>
              <p className="text-[13px] app-muted">Coba ubah kata kunci atau filter sentimen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  onClick={() => onOpenStock(stock)}
                />
              ))}
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-3 py-2.5 text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
            <Info size={14} className="shrink-0 mt-0.5 text-[#05A845]" />
            <p>Skor aset bersifat edukatif. Bukan rekomendasi beli/jual.</p>
          </div>
        </>
      )}
    </section>
  );
}

function RiskCategoryCard({ title, label, icon, color, items, isRecommended, onClick }) {
  return (
    <div onClick={onClick} className="app-card rounded-[24px] p-6 hover:shadow-md transition-all group relative overflow-hidden cursor-pointer min-w-0">
      {isRecommended && <div className="absolute top-4 right-4 bg-[#05A845] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 z-10 max-w-[calc(100%-2rem)]"><Sparkles size={10} className="shrink-0" /> <span className="truncate">Cocok Untukmu</span></div>}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color}`}>{icon}</div>
      <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
      <h3 className="text-[18px] font-bold app-heading mb-2">{label}</h3>
      <p className="text-[13px] app-muted mb-6 leading-relaxed break-words">{items}</p>
      <button className="flex items-center gap-2 text-[#05A845] font-bold text-[14px] group-hover:gap-3 transition-all">Lihat Instrumen <ArrowRight size={16} className="shrink-0" /></button>
    </div>
  );
}

function InstrumentItem({ code, name, price, change, marketCap, description, risk, onClick }) {
  const isPositive = change > 0;

  return (
    <div
      onClick={() => onClick({ code, name, price, change, marketCap, description, risk })}
      className="flex items-center justify-between gap-3 p-4 app-hover rounded-2xl transition-colors cursor-pointer border border-transparent dark:hover:border-[#2e303a] group min-w-0"
    >
      <div className="flex items-center gap-4 min-w-0">
        <AssetLogo stock={{ ticker: code }} />
        <div className="min-w-0">
          <h4 className="font-bold text-[15px] app-heading truncate">{code}</h4>
          <p className="text-[12px] app-muted truncate">{name}</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-[14px] sm:text-[15px] app-heading whitespace-nowrap">{price}</p>
        <p className={`text-[12px] font-bold ${isPositive ? 'text-[#05A845]' : change < 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-white/[0.04] px-3 py-2 min-w-0">
      <p className="text-[10px] app-muted font-semibold uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-[12px] font-bold app-heading whitespace-nowrap">{value}</p>
    </div>
  );
}

function FilterGroup({ icon, items, value, onChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
      {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold whitespace-nowrap transition-all ${value === item
              ? 'bg-[#05A845] border-[#05A845] text-white shadow-sm'
              : 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-[#2e303a] text-gray-600 dark:text-gray-300 hover:border-[#05A845]/30 hover:text-[#05A845]'
            }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function StockCard({ stock, onClick }) {
  const score = safeNumber(stock.score);
  const fundamental = safeNumber(stock.fundamental);
  const technical = safeNumber(stock.technical);
  const hasAnalysisScore = Boolean(stock.backendAnalysis && stock.analysisStatus !== 'unavailable');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      className="app-card rounded-[18px] p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all min-w-0 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <AssetLogo stock={stock} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[17px] font-black app-heading truncate">{stock.ticker}</h3>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.08] text-[10px] font-bold app-muted">{stock.market}</span>
            </div>
            <p className="text-[12px] app-muted truncate">{stock.name}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-[24px] font-black leading-none ${hasAnalysisScore ? scoreColor(score) : 'text-gray-300 dark:text-gray-600'}`}>
            {hasAnalysisScore ? formatDecimal(score, 1) : '...'}
          </p>
          <p className="text-[10px] app-muted font-bold mt-1">
            {hasAnalysisScore ? 'Overall' : 'Memuat skor'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 text-[12px]">
        <span className={`font-bold ${sentimentTextClass(stock.sentiment)}`}>
          {stock.sentiment}
        </span>
        <span className="text-[12px] font-bold text-[#05A845]">Upside {formatSignedPercent(stock.upside)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 text-[12px] app-muted">
        <span>Harga {formatPrice(stock.price, stock.market)}</span>
        <span>{hasAnalysisScore ? `F ${formatDecimal(fundamental)} / T ${formatDecimal(technical)}` : 'Analisis sedang dimuat'}</span>
      </div>
    </div>
  );
}

function StockDetail({ stock, period, setPeriod, onBack, isFavorite, hasAlert, onToggleFavorite, onOpenAlert }) {
  const candles = useMemo(() => makeCandles(stock, period), [stock, period]);
  const crypto = isCryptoAsset(stock);
  const hasBackendAnalysis = Boolean(stock.backendAnalysis);
  const analysisUnavailable = stock.analysisStatus === 'unavailable' || stock.backendAnalysis?.analysis_status === 'unavailable';

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-[14px] font-semibold text-[#05A845] hover:text-[#048A38] transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Instrumen
      </button>

      <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <AssetLogo stock={stock} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-[22px] sm:text-[24px] font-black app-heading">{stock.ticker}</h2>
                <span className={`text-[12px] font-bold ${sentimentTextClass(stock.sentiment)}`}>{stock.sentiment}</span>
                <span className="text-[11px] font-bold app-muted">{stock.market}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${hasBackendAnalysis && !analysisUnavailable
                    ? 'bg-[#EAF6ED] text-[#05A845]'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  }`}>
                  {hasBackendAnalysis && !analysisUnavailable ? 'Analisis aktif' : 'Data dasar'}
                </span>
              </div>
              <p className="app-muted text-[14px] break-words">{stock.name}</p>
            </div>
          </div>

          <div className="sm:text-right">
            <div className="flex sm:justify-end items-center gap-1.5 text-[11px] app-muted font-semibold">
              <span>Harga</span>
              <span className="text-[#05A845]">live</span>
            </div>
            <p className="text-[24px] sm:text-[26px] font-black app-heading leading-tight">
              {formatAssetPrice(stock)}
            </p>
            <p className="text-[11px] app-muted mt-1">{getRiskCopy(stock)}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-colors ${isFavorite
                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-400'
                : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-[#2e303a] app-muted hover:text-red-500'
              }`}
          >
            <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
            {isFavorite ? 'Hapus Favorit' : 'Tambah Favorit'}
          </button>
          <button
            type="button"
            onClick={onOpenAlert}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-colors ${hasAlert
                ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 text-amber-700 dark:text-amber-300'
                : 'bg-gray-50 dark:bg-white/[0.04] border-gray-100 dark:border-[#2e303a] app-muted hover:text-[#05A845]'
              }`}
          >
            <Bell size={16} />
            {hasAlert ? 'Ubah Alert Harga' : 'Pasang Alert Harga'}
          </button>
        </div>
      </div>

      {analysisUnavailable && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200 leading-relaxed mb-4">
          Analisis mendalam belum tersedia untuk aset ini. Finly tetap menampilkan data dasar dan simulasi edukatif sementara.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <ScorePanel stock={stock} />
        {crypto ? <CryptoSentimentPanel stock={stock} /> : <MarketSignalPanel stock={stock} />}
        <TechnicalLevel stock={stock} />
      </div>

      {crypto && <CryptoInfoPanel stock={stock} />}

      <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-[16px] font-bold app-heading">Grafik Harga (harian)</h3>
          <div className="flex gap-2">
            {periodFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${period === item
                    ? 'bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] border-[#1A1A1A] dark:border-white'
                    : 'border-gray-100 dark:border-[#2e303a] app-muted hover:text-[#05A845]'
                  }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <CandlestickChart candles={candles} stock={stock} />
      </div>

      <FlagTable greenItems={stock.greenFlags} redItems={stock.redFlags} />

      {stock.aiNarrative ? (
        <NarrativeBlock stock={stock} />
      ) : (
        crypto ? <AiNarrative stock={stock} /> : <StockNarrative stock={stock} />
      )}

      <AnalysisBreakdown stock={stock} fundamental={stock.fundamentalAreas} technical={stock.technicalAreas} />

      <div className="app-card rounded-[24px] p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper size={18} className="text-[#05A845]" />
          <h3 className="text-[17px] font-bold app-heading">Berita dan Sentimen</h3>
          {stock.newsSentiment && <span className={`text-[12px] font-black ${sentimentTextClass(stock.newsSentiment)}`}>{stock.newsSentiment}</span>}
        </div>
        {stock.newsSummary && (
          <p className="text-[13px] leading-relaxed app-heading mb-4">{stock.newsSummary}</p>
        )}
        <div className="divide-y app-divider">
          {((stock.newsItems?.length ? stock.newsItems : toNewsItems(stock.news))).map((item, index) => (
            <div key={`${item.title}-${index}`} className="py-3">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="text-[14px] font-semibold app-heading break-words hover:text-[#05A845] transition-colors">
                  {item.title}
                </a>
              ) : (
                <p className="text-[14px] font-semibold app-heading break-words">{item.title}</p>
              )}
              <p className="text-[12px] app-muted mt-1">
                {item.source || 'Finly News'} {item.publishedAt ? `- ${String(item.publishedAt).slice(0, 10)}` : ''} {item.sentiment ? `- sentiment ${item.sentiment}` : `- sentiment ${String(stock.sentiment || 'netral').toLowerCase()}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] px-3 py-2.5 text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed flex gap-2">
        <Info size={15} className="shrink-0 mt-0.5 text-[#05A845]" />
        <p>Analisis ini bersifat edukatif berbasis data market, skor risiko, dan guardrail Finly. Ini bukan rekomendasi beli/jual dan bukan prediksi harga.</p>
      </div>
    </div>
  );
}

function ScorePanel({ stock }) {
  const score = safeNumber(stock.score);

  return (
    <div className="app-card rounded-[18px] p-5 sm:p-6 min-h-[260px]">
      <p className="text-[12px] app-muted font-semibold mb-2">Overall Score</p>
      <div className="flex items-end gap-1 mb-4">
        <span className={`text-[52px] sm:text-[58px] leading-none font-black ${scoreColor(score)}`}>{formatDecimal(score, 2)}</span>
        <span className="text-[16px] font-bold text-gray-400 mb-1">/10</span>
      </div>
      <ScoreBar label="Fundamental" value={stock.fundamental} color="bg-[#05A845]" />
      <ScoreBar label="Teknikal" value={stock.technical} color="bg-amber-400" />
    </div>
  );
}

function CryptoSentimentPanel({ stock }) {
  const sentiment = getFearGreed(stock);

  return (
    <div className="app-card rounded-[18px] p-5 sm:p-6 min-h-[260px]">
      <p className="text-[12px] app-muted font-semibold mb-2">Market Sentiment</p>
      <div className="flex items-end gap-3 mb-5">
        <span className={`text-[48px] sm:text-[54px] leading-none font-black ${sentiment.value < 45 ? 'text-red-500' : sentiment.value < 55 ? 'text-amber-500' : 'text-[#05A845]'}`}>
          {sentiment.value}
        </span>
        <span className="text-[16px] font-bold app-heading mb-2">{sentiment.label}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-[#05A845] mb-3">
        <span className="absolute top-1/2 -translate-y-1/2 h-4 w-1.5 rounded-full bg-[#1A1A1A] dark:bg-white" style={{ left: `${sentiment.value}%` }} />
      </div>
      <div className="flex justify-between text-[11px] app-muted font-semibold">
        <span>Fear</span>
        <span>Neutral</span>
        <span>Greed</span>
      </div>
      <p className="text-[12px] app-muted mt-5">Berdasarkan Fear & Greed Index, momentum harga, dan sinyal teknikal.</p>
    </div>
  );
}

function MarketSignalPanel({ stock }) {
  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5">
      <p className="text-[12px] app-muted font-semibold mb-2">Market Signal</p>
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-[30px] leading-none font-black ${sentimentTextClass(stock.sentiment)}`}>
          {stock.sentiment}
        </span>
      </div>
      <ScoreBar label="Momentum" value={stock.technical} color="bg-amber-400" />
      <ScoreBar label="Kualitas" value={stock.fundamental} color="bg-[#05A845]" />
    </div>
  );
}

function TechnicalLevel({ stock }) {
  const entry = Array.isArray(stock.entry) ? stock.entry : [stock.price, stock.price];
  const entryLow = formatAssetPrice(stock, entry[0]);
  const entryHigh = formatAssetPrice(stock, entry[1]);

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 xl:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} className="text-[#05A845]" />
        <h3 className="text-[15px] font-bold app-heading">Level Teknikal</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <Metric label="Entry" value={`${entryLow} - ${entryHigh}`} />
        <Metric label="Target" value={formatAssetPrice(stock, stock.target)} tone="green" />
        <Metric label="Stop Loss" value={formatAssetPrice(stock, stock.stopLoss)} tone="red" />
        <Metric label="Upside" value={formatSignedPercent(stock.upside)} />
        <Metric label="Risk/Reward" value={`1:${formatDecimal(stock.riskReward)}`} />
      </div>
    </div>
  );
}

function CryptoInfoPanel({ stock }) {
  const info = getCryptoInfo(stock);
  const items = [
    ['Market Cap', info.marketCap],
    ['Volume 24h', info.volume24h],
    ['Circulating', info.circulating],
    ['Max Supply', info.maxSupply],
    ['ATH', info.ath],
    ['From ATH', info.fromAth],
  ];

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
      <h3 className="text-[16px] font-bold app-heading mb-4">Info Crypto</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[11px] app-muted font-semibold mb-1">{label}</p>
            <p className={`text-[13px] font-black break-words ${label === 'From ATH' ? 'text-red-500' : 'app-heading'}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NarrativeBlock({ stock }) {
  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#05A845]" />
        <h3 className="text-[16px] font-bold app-heading">Ringkasan Analisis</h3>
      </div>
      <p className="text-[13px] leading-relaxed app-heading whitespace-pre-line">
        {stock.aiNarrative}
      </p>
    </div>
  );
}

function AiNarrative({ stock }) {
  const sentiment = getFearGreed(stock);
  const score = safeNumber(stock.score);
  const fundamental = safeNumber(stock.fundamental);
  const technical = safeNumber(stock.technical);

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#05A845]" />
        <h3 className="text-[16px] font-bold app-heading">Ringkasan Edukatif</h3>
      </div>
      <div className="space-y-4 text-[13px] leading-relaxed app-heading">
        <p>
          Analisis aset kripto <strong>{stock.name} ({stock.ticker})</strong> menunjukkan skor overall{' '}
          <strong>{formatDecimal(score)}/10</strong>, dengan fundamental{' '}
          <strong>{formatDecimal(fundamental)}</strong> dan teknikal{' '}
          <strong>{formatDecimal(technical)}</strong>.
        </p>
        <p>
          Sentimen pasar berada di area <strong>{sentiment.label}</strong>. Target estimasi berada di{' '}
          <strong className="text-[#05A845]">{formatAssetPrice(stock, stock.target)}</strong>, sementara stop loss berada di{' '}
          <strong className="text-red-500">{formatAssetPrice(stock, stock.stopLoss)}</strong>.
        </p>
        <p className="app-muted">
          Perlu dicatat bahwa aset kripto sangat volatil. Gunakan alert harga, batas risiko, dan dana yang memang siap menghadapi fluktuasi besar.
        </p>
      </div>
    </div>
  );
}

function StockNarrative({ stock }) {
  const score = safeNumber(stock.score);
  const fundamental = safeNumber(stock.fundamental);
  const technical = safeNumber(stock.technical);
  const roe = safeNumber(stock.roe);
  const margin = safeNumber(stock.margin);
  const pe = safeNumber(stock.pe);
  const technicalTone = technical >= 6
    ? 'sinyal teknikal cukup mendukung'
    : technical >= 5
      ? 'sinyal teknikal masih perlu konfirmasi'
      : 'sinyal teknikal masih lemah';

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#05A845]" />
        <h3 className="text-[16px] font-bold app-heading">Ringkasan Edukatif</h3>
      </div>
      <p className="text-[13px] leading-relaxed app-heading">
        {stock.name} ({stock.ticker}) memiliki skor overall{' '}
        <strong>{formatDecimal(score)}/10</strong>. Fundamental berada di{' '}
        <strong>{formatDecimal(fundamental)}</strong>, dengan ROE sekitar{' '}
        <strong>{Math.round(roe * 100)}%</strong>, margin{' '}
        <strong>{Math.round(margin * 100)}%</strong>, dan valuasi P/E{' '}
        <strong>{formatDecimal(pe)}</strong>. Dari sisi harga, {technicalTone}; area target estimasi ada di{' '}
        <strong className="text-[#05A845]">{formatAssetPrice(stock, stock.target)}</strong> dengan stop loss di{' '}
        <strong className="text-red-500">{formatAssetPrice(stock, stock.stopLoss)}</strong>. Data ini bersifat edukatif dan cocok dipakai sebagai bahan pantauan, bukan keputusan final.
      </p>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const toneClass = tone === 'green' ? 'text-[#05A845]' : tone === 'red' ? 'text-red-500' : 'app-heading';
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-[#2e303a] px-3 py-3">
      <p className="text-[11px] app-muted font-semibold mb-1">{label}</p>
      <p className={`text-[13px] sm:text-[14px] font-black leading-snug break-words ${toneClass}`}>{value}</p>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  const numericValue = safeNumber(value);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between gap-3 text-[12px] font-semibold mb-1">
        <span className="app-heading">{label}</span>
        <span className="app-muted">{formatDecimal(numericValue)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${Math.min(numericValue * 10, 100)}%` }} />
      </div>
    </div>
  );
}

function CandlestickChart({ candles, stock }) {
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const width = 900;
  const height = 300;
  const padding = { top: 18, right: 64, bottom: 34, left: 12 };
  const values = candles.flatMap((candle) => [candle.high, candle.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleY = (value) => padding.top + ((max - value) / (max - min || 1)) * (height - padding.top - padding.bottom);
  const step = (width - padding.left - padding.right) / candles.length;
  const currentY = scaleY(stock.price);

  const tooltip = hoveredCandle ? {
    x: Math.min(Math.max(hoveredCandle.x + 12, 12), width - 150),
    y: Math.max(hoveredCandle.closeY - 42, 12),
  } : null;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[640px] w-full h-[250px] sm:h-[300px]"
        onMouseLeave={() => setHoveredCandle(null)}
      >
        <rect x="0" y="0" width={width} height={height} className="fill-white dark:fill-[#1f2028]" />
        {[0, 1, 2, 3, 4].map((item) => {
          const y = padding.top + item * ((height - padding.top - padding.bottom) / 4);
          return <line key={item} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="stroke-gray-100 dark:stroke-white/[0.08]" />;
        })}
        {candles.map((candle, index) => {
          const x = padding.left + index * step + step / 2;
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const isUp = candle.close >= candle.open;
          const bodyHeight = Math.max(Math.abs(openY - closeY), 4);
          const bodyY = Math.min(openY, closeY);

          return (
            <g key={`${candle.open}-${index}`}>
              <line x1={x} x2={x} y1={highY} y2={lowY} className={isUp ? 'stroke-[#05A845]' : 'stroke-red-500'} strokeWidth="1.4" />
              <rect
                x={x - Math.max(step * 0.28, 3)}
                y={bodyY}
                width={Math.max(step * 0.56, 6)}
                height={bodyHeight}
                rx="1.5"
                className={isUp ? 'fill-[#05A845]' : 'fill-red-500'}
              />
              <rect
                x={x - step / 2}
                y={padding.top}
                width={step}
                height={height - padding.top - padding.bottom}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredCandle({ ...candle, index, x, highY, closeY, isUp })}
                onMouseMove={() => setHoveredCandle({ ...candle, index, x, highY, closeY, isUp })}
              />
            </g>
          );
        })}
        {hoveredCandle && (
          <>
            <line x1={hoveredCandle.x} x2={hoveredCandle.x} y1={padding.top} y2={height - padding.bottom} strokeDasharray="3 4" className="stroke-gray-400 dark:stroke-gray-500" />
            <circle cx={hoveredCandle.x} cy={hoveredCandle.closeY} r="4" className={hoveredCandle.isUp ? 'fill-[#05A845]' : 'fill-red-500'} />
            <g>
              <rect x={tooltip.x} y={tooltip.y} width="136" height="52" rx="10" className="fill-white dark:fill-[#151a20] stroke-gray-200 dark:stroke-white/[0.12]" />
              <text x={tooltip.x + 12} y={tooltip.y + 20} className="fill-gray-500 dark:fill-gray-400 text-[10px] font-bold">
                Harga
              </text>
              <text x={tooltip.x + 12} y={tooltip.y + 39} className="fill-gray-900 dark:fill-white text-[12px] font-black">
                {formatAssetPrice(stock, hoveredCandle.close)}
              </text>
            </g>
          </>
        )}
        <line x1={padding.left} x2={width - padding.right} y1={currentY} y2={currentY} strokeDasharray="3 4" className="stroke-red-400" />
        <rect x={width - padding.right + 7} y={currentY - 10} width="52" height="20" rx="4" className={stock.trend === 'up' ? 'fill-[#05A845]' : 'fill-red-500'} />
        <text x={width - padding.right + 33} y={currentY + 4} textAnchor="middle" className="fill-white text-[11px] font-bold">
          {formatAssetPrice(stock)}
        </text>
        {[max, (max + min) / 2, min].map((value) => (
          <text key={value} x={width - padding.right + 10} y={scaleY(value) + 4} className="fill-gray-400 text-[10px]">
            {formatCompactNumber(value, stock.market === 'NASDAQ' ? 'en-US' : 'id-ID')}
          </text>
        ))}
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="stroke-gray-300 dark:stroke-white/[0.18]" />
        {['Mar', 'Apr', 'Mei', 'Jun'].map((label, index) => (
          <text key={label} x={padding.left + 60 + index * 205} y={height - 10} className="fill-gray-400 text-[11px]">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function FlagTable({ greenItems, redItems }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <FlagCard title="Green Flags" type="green" items={greenItems} />
      <FlagCard title="Red Flags" type="red" items={redItems} />
    </div>
  );
}

function FlagCard({ title, type, items }) {
  const isGreen = type === 'green';

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        {isGreen ? (
          <ShieldCheck size={16} className="text-[#05A845] shrink-0" />
        ) : (
          <TriangleAlert size={16} className="text-red-500 shrink-0" />
        )}
        <h3 className={`text-[14px] font-black ${isGreen ? 'text-[#05A845]' : 'text-red-500'}`}>{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-[13px] app-heading leading-relaxed min-w-0">
            <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${isGreen ? 'bg-[#05A845]' : 'bg-red-500'}`} />
            <span className="break-words">{item}</span>
          </div>
        ))}
        {items.length === 0 && (
          <span className="text-[13px] app-muted">Belum ada sinyal utama.</span>
        )}
      </div>
    </div>
  );
}

function AnalysisBreakdown({ stock, fundamental, technical }) {
  const crypto = isCryptoAsset(stock);
  const stockFundamental = safeNumber(stock.fundamental);
  const stockTechnical = safeNumber(stock.technical);
  const stockScore = safeNumber(stock.score);
  const fundamentalRows = crypto ? [
    { label: 'Project Overview', value: Math.min(9, stockFundamental + 0.5) },
    { label: 'Tokenomics', value: Math.min(8.5, stockFundamental + 0.2) },
    { label: 'Team & Development', value: Math.min(9.5, stockFundamental + 1) },
    { label: 'Adoption', value: Math.max(5, stockFundamental - 0.8) },
    { label: 'Competition', value: Math.min(8.5, stockFundamental + 0.4) },
    { label: 'Risks', value: Math.max(5.5, stockScore) },
  ] : fundamental;
  const technicalRows = crypto ? [
    { label: 'Trend', value: stock.trend === 'up' ? 7.2 : stock.trend === 'down' ? 4.5 : 5.5 },
    { label: 'Support/Resistance', value: Math.min(8, stockTechnical + 0.6) },
    { label: 'Volume', value: Math.max(4.8, stockTechnical - 0.3) },
    { label: 'Momentum', value: Math.max(4.8, stockTechnical - 0.4) },
    { label: 'Entry Strategy', value: Math.min(8, stockTechnical + 0.2) },
  ] : technical;

  return (
    <div className="app-card rounded-[18px] p-4 sm:p-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-[16px] font-black app-heading">Ringkasan Skor Analisis</h3>
          <p className="text-[12px] app-muted">Skor ringkas dari area {crypto ? 'proyek/tokenomics' : 'fundamental'} dan teknikal.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompactBreakdown title={crypto ? 'Analisis Fundamental (6 area)' : 'Fundamental'} rows={fundamentalRows} tone="green" />
        <CompactBreakdown title={crypto ? 'Analisis Teknikal (5 area)' : 'Teknikal'} rows={technicalRows} tone="amber" />
      </div>
    </div>
  );
}

function CompactBreakdown({ title, rows, tone }) {
  const barClass = tone === 'green' ? 'bg-[#05A845]' : 'bg-amber-400';
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-[13px] font-black app-heading">{title}</h4>
        <span className="text-[11px] app-muted">{safeRows.length} area</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-x-3 gap-y-2">
        {safeRows.map((row) => {
          const value = safeNumber(row.value);

          return (
            <div key={row.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[12px] app-muted truncate">{row.label}</span>
                <span className={`text-right text-[12px] font-black ${scoreColor(value)}`}>
                  {formatDecimal(value)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
                <div className={`${barClass} h-full rounded-full`} style={{ width: `${Math.min(value * 10, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
