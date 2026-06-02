import api, { USE_MOCKS } from './api';
import { mockBudgetCategories, mockCategories, mockDebts, mockSubscriptions } from './mockData';

let demoCategories = [...mockCategories];

export const getCategories = async (type) => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        categories: type
          ? demoCategories.filter((category) => category.transaction_type === type)
          : demoCategories,
      },
    };
  }

  const response = await api.get('/categories', {
    params: type ? { type } : {},
  });
  return response.data;
};

export const createCategory = async (categoryData) => {
  if (USE_MOCKS) {
    const category = {
      id: Date.now(),
      name: categoryData.name,
      transaction_type: categoryData.transaction_type,
      budget_group: categoryData.budget_group || 'other',
    };

    demoCategories = [category, ...demoCategories];

    return {
      success: true,
      message: 'Kategori demo berhasil dibuat.',
      data: {
        category,
      },
    };
  }

  const response = await api.post('/categories', categoryData);
  return response.data;
};

export const updateCategory = async () => {
  throw new Error('Backend belum menyediakan endpoint update kategori.');
};

export const deleteCategory = async () => {
  throw new Error('Backend belum menyediakan endpoint hapus kategori.');
};

export const getBudgetProgress = async (params = {}) => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        period_label: params.month || 'Mei 2026',
        summary: {
          total_budget: 12000000,
          total_used: 6450000,
          total_remaining: 5550000,
          used_percent: 53.75,
        },
        items: mockBudgetCategories,
      },
    };
  }

  const response = await api.get('/budgets/progress', { params });
  return response.data;
};

export const saveBudgetLimits = async (data) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Limit kategori demo berhasil disimpan.',
      data: {
        items: data.items || [],
      },
    };
  }

  const response = await api.patch('/budgets/limits', data);
  return response.data;
};

export const getSubscriptions = async (params = {}) => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        bills: mockSubscriptions,
        total_due: mockSubscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        total_unpaid: mockSubscriptions.filter((item) => !item.isPaid).reduce((sum, item) => sum + Number(item.amount || 0), 0),
      },
    };
  }

  const response = await api.get('/budgets/bills', { params });
  return response.data;
};

export const createSubscription = async (subscriptionData) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Tagihan demo berhasil ditambahkan.',
      data: {
        bill: {
          id: Date.now(),
          ...subscriptionData,
        },
      },
    };
  }

  const response = await api.post('/budgets/bills', subscriptionData);
  return response.data;
};

export const updateSubscription = async (id, subscriptionData) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Tagihan demo berhasil diperbarui.',
      data: {
        bill: {
          id,
          ...subscriptionData,
        },
      },
    };
  }

  if (subscriptionData?.status === 'paid') {
    const response = await api.patch(`/budgets/bills/${id}/paid`);
    return response.data;
  }

  if (subscriptionData?.status === 'unpaid') {
    const response = await api.patch(`/budgets/bills/${id}/unpaid`);
    return response.data;
  }

  const response = await api.patch(`/budgets/bills/${id}`, subscriptionData);
  return response.data;
};

export const deleteSubscription = async () => {
  throw new Error('Backend belum menyediakan endpoint hapus tagihan.');
};

export const getDebts = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        total_remaining_debt: mockDebts.reduce((sum, item) => sum + Math.max(Number(item.total || 0) - Number(item.paid || 0), 0), 0),
        debts: mockDebts,
      },
    };
  }

  const response = await api.get('/budgets/debts');
  return response.data;
};

export const createDebt = async (debtData) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Cicilan demo berhasil dicatat.',
      data: {
        debt: {
          id: Date.now(),
          ...debtData,
          debt_type: debtData.debt_type || debtData.debtType || 'installment',
        },
      },
    };
  }

  const response = await api.post('/budgets/debts', debtData);
  return response.data;
};

export const updateDebt = async (id, debtData) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Cicilan demo berhasil diperbarui.',
      data: {
        debt: {
          id,
          ...debtData,
        },
      },
    };
  }

  const amount = debtData?.amount || debtData?.nominal || debtData?.paid_amount;
  const response = await api.post(`/budgets/debts/${id}/payments`, { amount });
  return response.data;
};

export const deleteDebt = async () => {
  throw new Error('Backend belum menyediakan endpoint hapus cicilan.');
};
