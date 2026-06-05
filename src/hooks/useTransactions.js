import { useEffect, useState } from 'react';
import { createTransaction, deleteTransaction, getTransactions, updateTransaction, scanReceipt } from '../services/transactionService';
import { buildSummaryFromTransactions, normalizeTransaction } from '../utils/transactionViewModel';

export default function useTransactions({ showError, showSuccess, showInfo }) {
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await getTransactions();

        if (response.success) {
          const transactionsList = response.data?.transactions || [];
          setTransactions(transactionsList.map(normalizeTransaction));
          setTransactionSummary(response.data?.summary || null);
        } else {
          throw new Error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setLoadError('Terjadi kesalahan saat memuat data. Silakan coba lagi.');
        showError('Gagal memuat transaksi. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [showError]);

  const deleteById = async (id) => {
    try {
      await deleteTransaction(id);
      const nextTransactions = transactions.filter((trx) => trx.id !== id);
      setTransactions(nextTransactions);
      setTransactionSummary(buildSummaryFromTransactions(nextTransactions));
      showSuccess('Transaksi berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      const status = error.response?.status;
      if (status === 404 || status === 405) {
        showInfo('Backend belum menyediakan fitur hapus transaksi.');
        return false;
      }

      showError('Gagal menghapus transaksi');
      return false;
    }
  };

  const saveTransaction = async (transaction, editingData) => {
    try {
      const response = editingData
        ? await updateTransaction(editingData.id, transaction)
        : await createTransaction(transaction);
      const savedTransaction = response.data?.transaction;
      const mergedTransaction = editingData
        ? { ...editingData, ...(savedTransaction || {}), ...transaction }
        : (savedTransaction || transaction);
      const normalizedTransaction = normalizeTransaction(mergedTransaction);
      const nextTransactions = editingData
        ? transactions.map((trx) => (trx.id === editingData.id ? normalizedTransaction : trx))
        : [normalizedTransaction, ...transactions];

      setTransactions(nextTransactions);
      setTransactionSummary(buildSummaryFromTransactions(nextTransactions));
      showSuccess(editingData ? 'Transaksi berhasil diubah' : 'Transaksi berhasil disimpan');
      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      const status = error.response?.status;
      const fallbackMessage = editingData && (status === 404 || status === 405)
        ? 'Backend belum menyediakan fitur edit transaksi.'
        : 'Gagal menyimpan transaksi';

      showError(fallbackMessage);
      throw error;
    }
  };

  const saveSmartTransaction = async (transactionData) => {
    try {
      const payload = {
        type: 'expense',
        transaction_type: 'expense',
        amount: Number(transactionData.amount || 0),
        title: transactionData.title || 'Transaksi AI',
        description: transactionData.title || '',
        merchant: transactionData.merchant || null,
        category: transactionData.category_name || 'lainnya',
        category_name: transactionData.category_name || 'lainnya',
        note: transactionData.notes || '',
        notes: transactionData.notes || '',
        transaction_date: transactionData.transaction_date,
      };
      const response = await createTransaction(payload);
      const savedTransaction = response.data?.transaction;
      const nextTransactions = [
        normalizeTransaction(savedTransaction || payload),
        ...transactions,
      ];

      setTransactions(nextTransactions);
      setTransactionSummary(buildSummaryFromTransactions(nextTransactions));
      showSuccess('Transaksi dari AI berhasil disimpan');
      return true;
    } catch (error) {
      console.error('Error saving smart transaction:', error);
      showError('Gagal menyimpan transaksi dari AI');
      return false;
    }
  };

  const scanReceiptImage = async (file) => {
    try {
      const response = await scanReceipt(file);
      return response;
    } catch (error) {
      console.error('Error in scanReceiptImage hook:', error);
      showError(error.response?.data?.message || 'Gagal memindai struk belanja.');
      throw error;
    }
  };

  return {
    transactions,
    transactionSummary,
    isLoading,
    loadError,
    deleteById,
    saveTransaction,
    saveSmartTransaction,
    scanReceiptImage,
  };
}
