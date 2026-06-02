const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const formatDateFromBackend = (value) => {
  if (!value) return '-';

  const isoDate = String(value).slice(0, 10);
  const [year, month, day] = isoDate.split('-');

  if (year && month && day) {
    return `${day} ${monthNames[Number(month)] || month} ${year}`;
  }

  return String(value);
};

export const normalizeTransaction = (transaction = {}) => {
  const type = transaction.transaction_type || transaction.type || 'expense';
  const amount = Math.abs(Number(transaction.amount || 0));
  const title = transaction.title || transaction.description || transaction.notes || 'Transaksi';
  const merchant = transaction.merchant || transaction.source || '-';

  return {
    id: transaction.id,
    date: transaction.date || formatDateFromBackend(transaction.transaction_date),
    title,
    merchant,
    category: transaction.category || transaction.category_name || 'Tanpa Kategori',
    amount: type === 'income' ? amount : -amount,
    type,
    note: transaction.note || transaction.notes || transaction.description || '',
    hasReceipt: Boolean(transaction.hasReceipt),
  };
};

export const buildSummaryFromTransactions = (items) => {
  const totalIncome = items
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount || 0)), 0);

  const totalExpense = items
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount || 0)), 0);

  return {
    total_income: totalIncome,
    total_expense: totalExpense,
    net_balance: totalIncome - totalExpense,
  };
};

export const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Math.abs(amount));
