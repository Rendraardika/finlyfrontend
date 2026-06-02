export const BUDGET_PERIODS_STORAGE_KEY = 'finlyBudgetCategoriesByPeriod';

const budgetCategoryMatchers = {
  'Kebutuhan Pokok': ['Makanan & Minuman', 'Transportasi', 'Tagihan & Utilitas', 'Kesehatan'],
  'Hiburan & Keinginan': ['Belanja', 'Hiburan'],
  'Tabungan & Investasi': ['Tabungan & Investasi', 'Investasi'],
  'Utang & Cicilan': ['Utang & Cicilan', 'Cicilan'],
};

export const getPeriodKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatPeriodLabel = (periodKey) => {
  const [year, month] = periodKey.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
};

export const buildMonthOptions = (centerDate) => {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(centerDate.getFullYear(), centerDate.getMonth() - 5 + index, 1);
    const value = getPeriodKey(date);
    return {
      value,
      label: formatPeriodLabel(value),
    };
  });
};

export const cloneBudgetCategories = (categories) => categories.map((item) => ({ ...item }));

export const normalizeBudgetCategory = (item, index = 0) => ({
  id: item.category_id || item.id || `${item.category_name || item.title || index}-${index}`,
  budgetItemId: item.budget_item_id || item.budgetItemId || null,
  categoryId: item.category_id || item.categoryId || item.id || null,
  title: item.title || item.category_name || item.name || 'Kategori',
  spent: Number(item.spent ?? item.used_amount ?? item.total_used ?? 0),
  limit: Number(item.limit ?? item.limit_amount ?? item.budget_limit ?? 0),
  color: item.color || ['green', 'yellow', 'blue', 'purple'][index % 4],
  icon: item.icon || 'tag',
  budgetGroup: item.budget_group || item.budgetGroup || 'needs',
  alertThresholdPercent: Number(item.alert_threshold_percent || item.alertThresholdPercent || 85),
  isDefault: item.isDefault ?? item.is_default ?? false,
  fromBackend: item.fromBackend ?? (item.budget_item_id !== undefined || item.used_amount !== undefined),
});

export const normalizeSubscription = (bill, index = 0) => ({
  id: bill.id || bill.bill_id || Date.now() + index,
  name: bill.name || bill.title || bill.bill_name || 'Tagihan',
  dueDate: String(bill.dueDate || bill.due_date || bill.due_at || '').slice(0, 10),
  dueDay: Number(bill.dueDay || bill.due_day || (bill.dueDate || bill.due_date ? String(bill.dueDate || bill.due_date).slice(8, 10) : 0)) || null,
  frequency: bill.frequency || bill.billing_frequency || bill.recurrence_interval || bill.period || 'monthly',
  amount: Number(bill.amount || bill.bill_amount || bill.nominal || 0),
  isPaid: Boolean(bill.isPaid ?? bill.is_paid ?? bill.paid ?? bill.status === 'paid' ?? false),
  color: bill.color || 'green',
  billType: bill.bill_type || bill.billType || 'bill',
  categoryId: bill.category_id || bill.categoryId || null,
  categoryName: bill.category_name || bill.categoryName || (bill.bill_type === 'subscription' ? 'Langganan' : 'Tagihan Wajib'),
  budgetGroup: bill.budget_group || bill.budgetGroup || (bill.bill_type === 'subscription' ? 'wants' : 'needs'),
});

export const normalizeDebt = (debt, index = 0) => {
  const total = Number(debt.total ?? debt.total_amount ?? debt.target_amount ?? debt.amount ?? 0);
  const paid = Number(debt.paid ?? debt.paid_amount ?? debt.current_amount ?? 0);

  return {
    id: debt.id || debt.debt_id || Date.now() + index,
    name: debt.name || debt.title || debt.debt_name || 'Cicilan',
    total,
    paid,
    monthly: Number(debt.monthly ?? debt.monthly_target ?? debt.monthly_payment ?? debt.installment_amount ?? 0),
    dueDate: String(debt.dueDate || debt.due_date || debt.deadline || debt.target_date || '').slice(0, 10),
    debtType: debt.debtType || debt.debt_type || 'installment',
    linkedBillId: debt.linkedBillId || debt.linked_bill_id || null,
    estimatedRemainingMonths: debt.estimatedRemainingMonths ?? debt.estimated_remaining_months ?? null,
    estimatedPaidOffDate: String(debt.estimatedPaidOffDate || debt.estimated_paid_off_date || '').slice(0, 10),
    color: debt.color || 'red',
    icon: debt.icon || 'credit',
    categoryId: debt.category_id || debt.categoryId || null,
    categoryName: debt.category_name || debt.categoryName || 'Utang & Cicilan',
    budgetGroup: debt.budget_group || debt.budgetGroup || 'debt',
  };
};

const groupPresentation = {
  needs: { title: 'Kebutuhan Pokok', color: 'green', icon: 'home', order: 1 },
  wants: { title: 'Dana Fleksibel', color: 'yellow', icon: 'shopping', order: 2 },
  savings: { title: 'Dana Darurat & Tujuan', color: 'blue', icon: 'trending', order: 3 },
  investment: { title: 'Investasi', color: 'green', icon: 'trending', order: 4 },
  debt: { title: 'Utang & Cicilan', color: 'red', icon: 'credit', order: 5 },
};

export const aggregateBudgetCategories = (categories = []) => {
  const grouped = new Map();

  categories.forEach((category) => {
    const budgetGroup = category.budgetGroup || category.budget_group || 'needs';
    const presentation = groupPresentation[budgetGroup] || {
      title: category.title || category.category_name || 'Kategori Lainnya',
      color: category.color || 'green',
      icon: category.icon || 'tag',
      order: 99,
    };
    const key = budgetGroup;
    const existing = grouped.get(key) || {
      id: key,
      categoryId: null,
      title: presentation.title,
      spent: 0,
      limit: 0,
      color: presentation.color,
      icon: presentation.icon,
      budgetGroup,
      alertThresholdPercent: Number(category.alertThresholdPercent || 85),
      isDefault: true,
      fromBackend: true,
      order: presentation.order,
      children: [],
    };

    existing.spent += Number(category.spent) || 0;
    existing.limit += Number(category.limit) || 0;
    existing.children.push(category);
    grouped.set(key, existing);
  });

  return Array.from(grouped.values()).sort((a, b) => a.order - b.order);
};

export const readSavedBudgetPeriods = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem(BUDGET_PERIODS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (_error) {
    return null;
  }
};

export const saveBudgetPeriods = (periods) => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(BUDGET_PERIODS_STORAGE_KEY, JSON.stringify(periods));
  } catch (_error) {
  }
};

export const transactionMatchesBudgetCategory = (transactionCategory, budgetTitle) => {
  const normalizedTransactionCategory = String(transactionCategory || '').trim().toLowerCase();
  const normalizedBudgetTitle = String(budgetTitle || '').trim().toLowerCase();
  const matchers = budgetCategoryMatchers[budgetTitle] || [budgetTitle];

  return normalizedTransactionCategory === normalizedBudgetTitle
    || matchers.some((matcher) => String(matcher).trim().toLowerCase() === normalizedTransactionCategory);
};

export const calculateCategorySpent = (category, transactions) => {
  return transactions
    .filter((transaction) => transaction.transaction_type === 'expense')
    .filter((transaction) => transactionMatchesBudgetCategory(transaction.category_name, category.title))
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
};

export const applyTransactionsToBudgetCategories = (categories, transactions) => (
  categories.map((category) => ({
    ...category,
    spent: category.fromBackend ? category.spent : calculateCategorySpent(category, transactions),
  }))
);

export const initialBudgetPeriod = getPeriodKey(new Date());
