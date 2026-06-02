import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useNotification } from '../context/useNotification';

import CategoryTab from '../components/anggaran/CategoryTab';
import SubscriptionTab from '../components/anggaran/SubscriptionTab';
import DebtTab from '../components/anggaran/DebtTab';
import KprSimulator from '../components/anggaran/KprSimulator';

import { EditBudgetModal, AddSubscriptionModal, AddDebtModal } from '../components/anggaran/BudgetModals';
import { mockBudgetCategories, mockDebts, mockSubscriptions } from '../services/mockData';
import { getTransactions } from '../services/transactionService';
import {
  createDebt,
  createSubscription,
  getBudgetProgress,
  getDebts,
  getSubscriptions,
  saveBudgetLimits,
  updateDebt,
  updateSubscription,
} from '../services/budgetService';
import {
  applyTransactionsToBudgetCategories,
  aggregateBudgetCategories,
  buildMonthOptions,
  cloneBudgetCategories,
  initialBudgetPeriod,
  normalizeBudgetCategory,
  normalizeDebt,
  normalizeSubscription,
  readSavedBudgetPeriods,
  saveBudgetPeriods,
} from '../utils/budgetViewModel';

export default function Anggaran() {
  const [activeTab, setActiveTab] = useState('kategori');
  const { confirm } = useConfirm();
  const { showSuccess } = useToast();
  const { refreshNotifications } = useNotification();

  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState(initialBudgetPeriod);
  const budgetMonthOptions = React.useMemo(() => buildMonthOptions(new Date()), []);
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [budgetCategoriesByPeriod, setBudgetCategoriesByPeriod] = useState(() => {
    const savedPeriods = readSavedBudgetPeriods();
    return savedPeriods || {
      [initialBudgetPeriod]: cloneBudgetCategories(mockBudgetCategories),
    };
  });
  const baseBudgetCategories = budgetCategoriesByPeriod[selectedBudgetPeriod] || cloneBudgetCategories(mockBudgetCategories);
  const budgetCategories = applyTransactionsToBudgetCategories(baseBudgetCategories, budgetTransactions);
  const [subscriptions, setSubscriptions] = useState(() => mockSubscriptions.map((item) => ({ ...item })));
  const [debts, setDebts] = useState(() => mockDebts.map((item) => ({ ...item })));

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);

  const location = useLocation();

  React.useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  const loadBudgetData = React.useCallback(async () => {
      try {
        const [transactionResponse, progressResponse] = await Promise.allSettled([
          getTransactions(),
          getBudgetProgress({ month: selectedBudgetPeriod }),
        ]);

        const transactions = transactionResponse.status === 'fulfilled'
          ? transactionResponse.value?.data?.transactions || []
          : [];
        const periodTransactions = transactions.filter((transaction) => (
          String(transaction.transaction_date || '').startsWith(selectedBudgetPeriod)
        ));

          setBudgetTransactions(periodTransactions);

          if (progressResponse.status === 'fulfilled') {
            const items = progressResponse.value?.data?.items || progressResponse.value?.data?.categories || [];
            if (items.length > 0) {
              const normalizedItems = aggregateBudgetCategories(items.map(normalizeBudgetCategory));
              setBudgetCategoriesByPeriod((prev) => ({
                ...prev,
                [selectedBudgetPeriod]: normalizedItems,
              }));
            }
          }
      } catch (_error) {
          setBudgetTransactions([]);
      }
  }, [selectedBudgetPeriod]);

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await loadBudgetData();
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [loadBudgetData]);

  const loadRecurringData = React.useCallback(async () => {
      const [subscriptionsResponse, debtsResponse] = await Promise.allSettled([
        getSubscriptions({ month: selectedBudgetPeriod }),
        getDebts(),
      ]);

      if (subscriptionsResponse.status === 'fulfilled') {
        const bills = subscriptionsResponse.value?.data?.bills || subscriptionsResponse.value?.data?.items || [];
        setSubscriptions(bills.map(normalizeSubscription));
      }

      if (debtsResponse.status === 'fulfilled') {
        const nextDebts = debtsResponse.value?.data?.debts || debtsResponse.value?.data?.items || [];
        setDebts(nextDebts.map(normalizeDebt));
      }
  }, [selectedBudgetPeriod]);

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await loadRecurringData();
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [loadRecurringData]);

  const refreshBudgetScreen = React.useCallback(async () => {
    await Promise.allSettled([
      loadBudgetData(),
      loadRecurringData(),
      refreshNotifications ? refreshNotifications() : Promise.resolve(),
    ]);
  }, [loadBudgetData, loadRecurringData, refreshNotifications]);

  const handleSaveBudgetCategories = async (updatedCategories) => {
    try {
      await saveBudgetLimits({
        month: selectedBudgetPeriod,
        items: updatedCategories.map((category) => ({
          category_id: Number(category.categoryId || category.id) ? Number(category.categoryId || category.id) : null,
          category_name: category.title,
          budget_group: category.budgetGroup || category.budget_group || 'needs',
          limit_amount: Number(category.limit) || 0,
          alert_threshold_percent: category.alertThresholdPercent || 85,
        })),
      });
      await refreshBudgetScreen();
    } catch (_error) {
    }

    setBudgetCategoriesByPeriod((prev) => {
      const nextPeriods = {
        ...prev,
        [selectedBudgetPeriod]: updatedCategories.map((category) => ({
          ...category,
          spent: 0,
        })),
      };

      saveBudgetPeriods(nextPeriods);
      return nextPeriods;
    });
    setIsEditBudgetOpen(false);
  };

  const openAddSubscription = () => {
    setEditingSubscription(null);
    setIsSubscriptionModalOpen(true);
  };

  const openEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
    setIsSubscriptionModalOpen(true);
  };

  const handleSaveSubscription = async (payload) => {
    if (payload.id) {
      try {
        const response = await updateSubscription(payload.id, {
          name: payload.name,
          title: payload.name,
          amount: payload.amount,
          recurrence_interval: payload.frequency,
          due_date: payload.dueDate,
          bill_type: payload.billType,
          category_name: payload.categoryName,
          budget_group: payload.budgetGroup,
        });
        const savedPayload = normalizeSubscription(response?.data?.bill || response?.data || payload);
        setSubscriptions((prev) =>
          prev.map((item) => (item.id === payload.id ? { ...item, ...savedPayload } : item))
        );
      } catch (_error) {
      setSubscriptions((prev) =>
        prev.map((item) => (item.id === payload.id ? { ...item, ...payload } : item))
      );
      }
    } else {
      let savedPayload = payload;
      try {
        const response = await createSubscription({
          name: payload.name,
          title: payload.name,
          amount: payload.amount,
          billing_frequency: payload.frequency,
          recurrence_interval: payload.frequency,
          due_day: payload.dueDay,
          due_date: payload.dueDate,
          bill_type: payload.billType,
          category_name: payload.categoryName,
          budget_group: payload.budgetGroup,
        });
        savedPayload = normalizeSubscription(response?.data?.bill || response?.data || payload);
      } catch (_error) {
      }

      setSubscriptions((prev) => [
        ...prev,
        {
          ...savedPayload,
          id: savedPayload.id || Date.now(),
        },
      ]);
    }

    setIsSubscriptionModalOpen(false);
    setEditingSubscription(null);
    await refreshBudgetScreen();
  };

  const handleDeleteSubscription = async (id) => {
    const selectedSubscription = subscriptions.find((item) => item.id === id);
    const isConfirmed = await confirm({
      title: 'Hapus Tagihan',
      message: `Yakin ingin menghapus tagihan "${selectedSubscription?.name || 'ini'}"?`,
      confirmText: 'Hapus',
      isDanger: true,
    });
    if (!isConfirmed) return;

    setSubscriptions((prev) => prev.filter((item) => item.id !== id));
    showSuccess('Tagihan berhasil dihapus');
  };

  const handleToggleSubscriptionPaid = async (id) => {
    const selectedSubscription = subscriptions.find((item) => item.id === id);
    const nextPaid = !selectedSubscription?.isPaid;

    try {
      await updateSubscription(id, { status: nextPaid ? 'paid' : 'unpaid' });
    } catch (_error) {
    }

    setSubscriptions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPaid: nextPaid } : item))
    );
    await refreshBudgetScreen();
  };

  const handleUpdateSubscriptionDueDate = async (id, dueDate) => {
    const selectedSubscription = subscriptions.find((item) => item.id === id);
    if (!selectedSubscription || !dueDate) return;

    try {
      const response = await updateSubscription(id, {
        due_date: dueDate,
        name: selectedSubscription.name,
        amount: selectedSubscription.amount,
        recurrence_interval: selectedSubscription.frequency,
        bill_type: selectedSubscription.billType,
        category_id: selectedSubscription.categoryId,
        category_name: selectedSubscription.categoryName,
        budget_group: selectedSubscription.budgetGroup,
      });
      const savedPayload = normalizeSubscription(response?.data?.bill || response?.data || {
        ...selectedSubscription,
        dueDate,
      });
      setSubscriptions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...savedPayload } : item))
      );
      await refreshBudgetScreen();
    } catch (_error) {
    }
  };

  const openAddDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const openEditDebt = (debt) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const openDebtFromKpr = (debtDraft) => {
    setEditingDebt(debtDraft);
    setActiveTab('utang');
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = async (payload) => {
    const safePayload = {
      ...payload,
      paid: Math.min(Number(payload.paid) || 0, Number(payload.total) || 0),
    };

    if (safePayload.id) {
      const previousDebt = debts.find((item) => item.id === safePayload.id);
      const paymentDelta = Math.max((Number(safePayload.paid) || 0) - (Number(previousDebt?.paid) || 0), 0);

      if (paymentDelta > 0) {
        try {
          await updateDebt(safePayload.id, { amount: paymentDelta });
        } catch (_error) {
        }
      }

      setDebts((prev) =>
        prev.map((item) => (item.id === safePayload.id ? { ...item, ...safePayload } : item))
      );
    } else {
      let savedDebt = safePayload;
      try {
        const response = await createDebt({
          name: safePayload.name,
          title: safePayload.name,
          debt_type: safePayload.debtType || 'installment',
          total_amount: safePayload.total,
          monthly_target: safePayload.monthly,
          paid_amount: safePayload.paid,
          due_date: safePayload.dueDate,
          category_name: 'Utang & Cicilan',
          budget_group: 'debt',
        });
        savedDebt = normalizeDebt(response?.data?.debt || response?.data || safePayload);
      } catch (_error) {
      }

      setDebts((prev) => [
        ...prev,
        {
          ...savedDebt,
          id: savedDebt.id || Date.now(),
        },
      ]);
    }

    setIsDebtModalOpen(false);
    setEditingDebt(null);
    await refreshBudgetScreen();
  };

  const handleDeleteDebt = async (id) => {
    const selectedDebt = debts.find((item) => item.id === id);
    const isConfirmed = await confirm({
      title: 'Hapus Cicilan',
      message: `Yakin ingin menghapus cicilan "${selectedDebt?.name || 'ini'}"?`,
      confirmText: 'Hapus',
      isDanger: true,
    });
    if (!isConfirmed) return;

    setDebts((prev) => prev.filter((item) => item.id !== id));
    showSuccess('Cicilan berhasil dihapus');
  };

  return (
    <AppLayout activeMenu="anggaran">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-[26px] font-bold page-title mb-1">Anggaran Bulanan</h1>
          <p className="page-subtitle text-[15px]">Kelola dan pantau pengeluaranmu bulan ini.</p>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-gray-200 dark:border-[#2e303a] mb-8 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('kategori')} className={`px-6 py-3 font-medium text-[15px] border-b-2 transition-colors whitespace-nowrap ${activeTab === 'kategori' ? 'text-[#05A845] border-[#05A845]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}>Limit Kategori</button>
          <button onClick={() => setActiveTab('langganan')} className={`px-6 py-3 font-medium text-[15px] border-b-2 transition-colors whitespace-nowrap ${activeTab === 'langganan' ? 'text-[#05A845] border-[#05A845]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}>Tagihan & Langganan</button>
          <button onClick={() => setActiveTab('utang')} className={`px-6 py-3 font-medium text-[15px] border-b-2 transition-colors whitespace-nowrap ${activeTab === 'utang' ? 'text-[#05A845] border-[#05A845]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}>Utang & Cicilan</button>
          <button onClick={() => setActiveTab('kpr')} className={`px-6 py-3 font-medium text-[15px] border-b-2 transition-colors whitespace-nowrap ${activeTab === 'kpr' ? 'text-[#05A845] border-[#05A845]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'}`}>Simulasi KPR</button>
        </div>

        {/* RENDERING ACTIVE TAB */}
        {activeTab === 'kategori' && (
          <CategoryTab
            categories={budgetCategories}
            selectedPeriod={selectedBudgetPeriod}
            monthOptions={budgetMonthOptions}
            onSelectedPeriodChange={setSelectedBudgetPeriod}
            setIsEditBudgetOpen={setIsEditBudgetOpen}
          />
        )}

        {activeTab === 'langganan' && (
          <SubscriptionTab
            subscriptions={subscriptions}
            onAddSubscription={openAddSubscription}
            onEditSubscription={openEditSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onTogglePaid={handleToggleSubscriptionPaid}
            onUpdateDueDate={handleUpdateSubscriptionDueDate}
          />
        )}

        {activeTab === 'utang' && (
          <DebtTab
            debts={debts}
            onAddDebt={openAddDebt}
            onEditDebt={openEditDebt}
            onDeleteDebt={handleDeleteDebt}
          />
        )}

        {activeTab === 'kpr' && <KprSimulator onSaveAsDebt={openDebtFromKpr} />}
      </div>

      {/* RENDERING MODALS */}
      <EditBudgetModal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        categories={budgetCategories}
        onSaveCategories={handleSaveBudgetCategories}
      />

      <AddSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setEditingSubscription(null);
        }}
        editingData={editingSubscription}
        onSave={handleSaveSubscription}
      />

      <AddDebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        editingData={editingDebt}
        onSave={handleSaveDebt}
      />
    </AppLayout>
  );
}
