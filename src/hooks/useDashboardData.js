import { useEffect, useMemo, useState } from 'react';
import { getTransactionStats, getTransactions } from '../services/transactionService';
import { USE_MOCKS } from '../services/api';
import {
  buildCategoryBreakdown,
  buildDashboardData,
  buildRecentTransactions,
  mockTransactions,
} from '../services/mockData';

export default function useDashboardData() {
  const [transactions, setTransactions] = useState(() => (USE_MOCKS ? mockTransactions : []));
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [upcomingBills, setUpcomingBills] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await getTransactions({ limit: 10 });
        const nextTransactions = response?.data?.transactions || response?.transactions || [];
        if (isMounted) {
          setTransactions(nextTransactions);
        }

        try {
          const statsResponse = await getTransactionStats();
          const nextSummary = statsResponse?.data?.summary || statsResponse?.summary || null;
          if (isMounted && nextSummary) {
            setDashboardSummary(nextSummary);
          }
          if (isMounted) {
            setUpcomingBills(statsResponse?.data?.upcoming_bills || statsResponse?.upcoming_bills || []);
          }
        } catch (_error) {
          if (isMounted) {
            setDashboardSummary(null);
            setUpcomingBills([]);
          }
        }
      } catch (error) {
        console.warn('Gagal memuat transaksi dashboard.', error);
        if (isMounted && !USE_MOCKS) {
          setTransactions([]);
          setDashboardSummary(null);
          setUpcomingBills([]);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardData = useMemo(() => buildDashboardData(transactions, dashboardSummary), [dashboardSummary, transactions]);
  const recentTransactions = useMemo(() => buildRecentTransactions(transactions), [transactions]);
  const chartDataSources = useMemo(() => ({
    pengeluaran: buildCategoryBreakdown(transactions, 'expense'),
    pemasukan: buildCategoryBreakdown(transactions, 'income'),
  }), [transactions]);

  return { dashboardData, recentTransactions, chartDataSources, upcomingBills };
}
