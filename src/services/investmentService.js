import api, { USE_MOCKS } from './api';
import { mockRecommendations } from './mockData';

const mockAnswerScores = {
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
  preferences: {
    'Belum tahu': 0,
    Emas: 0.25,
    'Obligasi/SBN': 0.25,
    'Reksa Dana': 0.5,
    Saham: 1,
    Crypto: 2,
  },
};

const scoreMockAnswer = (key, value) => {
  if (Array.isArray(value)) {
    return value.reduce((max, item) => Math.max(max, scoreMockAnswer(key, item)), 0);
  }
  if (typeof value === 'number') return value;
  const numeric = mockAnswerScores[key]?.[value] ?? Number(value);
  return Number.isFinite(Number(numeric)) ? Number(numeric) : 0;
};

export const getInvestments = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        recommendations: mockRecommendations,
      },
    };
  }

  const response = await api.get('/investments/recommendations', {
    params: { status: 'all' },
  });
  return response.data;
};

export const getInvestmentById = async (id) => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: mockRecommendations.find((item) => String(item.id) === String(id)) || null,
    };
  }

  const response = await api.get('/investments/recommendations', {
    params: { status: 'all' },
  });
  const recommendations = response.data?.data?.recommendations || [];

  return {
    success: response.data?.success ?? true,
    data: recommendations.find((item) => String(item.id) === String(id)) || null,
  };
};

export const getInvestmentsByRisk = async () => {
  return getInvestments();
};

export const buyInvestment = async (investmentId, amount) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Pilihan investasi demo berhasil disimpan.',
      data: {
        id: Date.now(),
        recommendation_id: investmentId,
        amount,
      },
    };
  }

  const response = await api.post('/investments/choices', {
    recommendation_id: investmentId,
    investment_type: 'manual',
    product_name: `Rekomendasi #${investmentId}`,
    amount,
  });
  return response.data;
};

export const getMyInvestments = async () => {
  return getInvestments();
};

export const submitRiskQuiz = async (answers) => {
  if (USE_MOCKS) {
    const answerValues = answers?.answers || answers;
    const score = Array.isArray(answerValues)
      ? answerValues.reduce((total, answer) => total + Number(answer || 0), 0)
      : answerValues && typeof answerValues === 'object'
        ? Object.entries(answerValues).reduce((total, [key, answer]) => total + scoreMockAnswer(key, answer), 0)
      : 0;

    return {
      success: true,
      message: 'Risk profile demo berhasil dibuat.',
      data: {
        risk_profile: {
          id: Date.now(),
          risk_level: score >= 70 ? 'aggressive' : score >= 40 ? 'moderate' : 'conservative',
          score,
        },
        recommendations: mockRecommendations,
      },
    };
  }

  const payload = answers && typeof answers === 'object' && !Array.isArray(answers) && 'answers' in answers
    ? answers
    : { answers };
  const response = await api.post('/investments/risk-profile', payload);
  return response.data;
};

export const getInvestmentAnalysisDetail = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        fund_source: {
          investment_potential: 500000,
        },
      },
    };
  }

  const response = await api.get('/investments/analysis-detail');
  return response.data;
};

export const getInvestmentMarket = async () => {
  const response = await api.get('/investments/market');
  return response.data;
};

export const getInvestmentMarketByRisk = async (riskLevel) => {
  const response = await api.get(`/investments/market/${riskLevel}`);
  return response.data;
};

export const getInvestmentProductDetail = async (type, symbol) => {
  const response = await api.get(`/investments/products/${type}/${encodeURIComponent(symbol)}`);
  return response.data;
};

export const getInvestmentProductAnalysis = async (type, symbol) => {
  const response = await api.get(`/investments/products/${type}/${encodeURIComponent(symbol)}/analysis`);
  return response.data;
};
