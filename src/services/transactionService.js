import api, { USE_MOCKS } from './api';
import { buildTransactionSummary, mockTransactions } from './mockData';

const DEMO_TRANSACTIONS_KEY = 'finlyDemoTransactions';

const readDemoTransactions = () => {
  try {
    if (typeof localStorage === 'undefined') return [...mockTransactions];
    const saved = localStorage.getItem(DEMO_TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : [...mockTransactions];
  } catch (_error) {
    return [...mockTransactions];
  }
};

const saveDemoTransactions = () => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(demoTransactions));
  } catch (_error) {
  }
};

let demoTransactions = readDemoTransactions();

const toBackendPayload = (transactionData) => ({
  transaction_type: transactionData.transaction_type || transactionData.type,
  amount: Math.abs(Number(transactionData.amount || 0)),
  title: transactionData.title || transactionData.description || 'Transaksi',
  description: transactionData.description || transactionData.title || '',
  merchant: transactionData.merchant || null,
  category_id: transactionData.category_id || transactionData.categoryId || null,
  category_name: transactionData.category_name || transactionData.category || null,
  notes: transactionData.notes || transactionData.note || '',
  transaction_date: transactionData.transaction_date || transactionData.transactionDate || transactionData.date,
  payment_method: transactionData.payment_method || transactionData.paymentMethod || null,
  input_source: transactionData.input_source || 'manual',
});

export const getTransactions = async (params = {}) => {
  try {
    if (USE_MOCKS) {
      return {
        success: true,
        data: {
          transactions: demoTransactions,
          summary: buildTransactionSummary(demoTransactions),
          pagination: {
            current_page: Number(params.page || 1),
            total_pages: 1,
            total_data: demoTransactions.length,
            limit: demoTransactions.length,
          },
        },
      };
    }

    const response = await api.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transaction by ID
export const getTransactionById = async (id) => {
  try {
    if (USE_MOCKS) {
      return {
        success: true,
        data: {
          transaction: demoTransactions.find((transaction) => String(transaction.id) === String(id)),
        },
      };
    }

    const response = await api.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw error;
  }
};

export const createTransaction = async (transactionData) => {
  try {
    if (USE_MOCKS) {
      const payload = toBackendPayload(transactionData);
      const transaction = {
        id: Date.now(),
        category_name: payload.category_name,
        transaction_type: payload.transaction_type,
        amount: payload.amount,
        title: payload.title,
        description: payload.description,
        merchant: payload.merchant,
        notes: payload.notes,
        transaction_date: payload.transaction_date,
      };

      demoTransactions = [transaction, ...demoTransactions];
      saveDemoTransactions();

      return {
        success: true,
        message: 'Transaksi demo berhasil ditambahkan.',
        data: {
          transaction,
          alert: null,
        },
      };
    }

    const response = await api.post('/transactions', toBackendPayload(transactionData));
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (id, transactionData) => {
  try {
    if (USE_MOCKS) {
      const payload = toBackendPayload(transactionData);
      const transaction = {
        id,
        category_name: payload.category_name,
        transaction_type: payload.transaction_type,
        amount: payload.amount,
        title: payload.title,
        description: payload.description,
        merchant: payload.merchant,
        notes: payload.notes,
        transaction_date: payload.transaction_date,
      };

      demoTransactions = demoTransactions.map((item) => (
        String(item.id) === String(id) ? transaction : item
      ));
      saveDemoTransactions();

      return {
        success: true,
        message: 'Transaksi demo berhasil diubah.',
        data: {
          transaction,
        },
      };
    }

    try {
      const response = await api.patch(`/transactions/${id}`, toBackendPayload(transactionData));
      return response.data;
    } catch (patchError) {
      const status = patchError.response?.status;
      if (status !== 404 && status !== 405) throw patchError;

      const response = await api.put(`/transactions/${id}`, toBackendPayload(transactionData));
      return response.data;
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    if (USE_MOCKS) {
      demoTransactions = demoTransactions.filter((transaction) => String(transaction.id) !== String(id));
      saveDemoTransactions();

      return {
        success: true,
        message: 'Transaksi demo berhasil dihapus.',
      };
    }

    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Get transactions by month
export const getTransactionsByMonth = async (month, year) => {
  try {
    if (USE_MOCKS) {
      return getTransactions({ month, year });
    }

    const response = await api.get('/transactions', {
      params: { month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions by month:', error);
    throw error;
  }
};

export const getTransactionStats = async () => {
  try {
    if (USE_MOCKS) {
      return {
        success: true,
        data: {
          summary: buildTransactionSummary(demoTransactions),
        },
      };
    }

    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    throw error;
  }
};

export const scanReceipt = async (file) => {
  try {
    if (USE_MOCKS) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        success: true,
        data: {
          merchant: 'Kopi Kenangan',
          total: 185000,
          transaction_date: '2026-05-27',
          confidence: { merchant: 0.9, total: 0.95, transaction_date: 0.85 },
          source: { merchant: 'ocr', total: 'ocr', transaction_date: 'ocr' },
          doc_type: 'receipt',
          processing_ms: 1200,
          model_version: 'qwen2-vl-mock'
        }
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/scan/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error scanning receipt:', error);
    throw error;
  }
};
