import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wallet, Zap, ArrowUpRight, ArrowDownRight,
  Receipt, CreditCard, Sparkles, Lightbulb
} from 'lucide-react';

import AppLayout from '../components/AppLayout';
import TransaksiTerakhir from '../components/dashboard/RecentTransactions';
import StatistikChart from '../components/dashboard/StatisticChart';
import useDashboardData from '../hooks/useDashboardData';
import { formatIDR } from '../utils/transactionViewModel';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dashboardData, recentTransactions, chartDataSources, upcomingBills } = useDashboardData();

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Naura';

  return (
    <AppLayout activeMenu="dashboard">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full">

        <div className="mb-6">
          <h1 className="text-[22px] sm:text-[26px] font-bold page-title mb-1 break-words">
            Halo, {firstName}!
          </h1>
          <p className="page-subtitle text-[14px] sm:text-[15px] break-words">
            Ini ringkasan keuanganmu hari ini.
          </p>
        </div>

        <div className="mb-8">

          <div className="bg-gradient-to-r from-[#05A845] to-[#048A38] rounded-[24px] p-5 text-white relative overflow-hidden shadow-lg shadow-green-600/20">
            <div className="absolute right-[-10%] top-[-50%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
              <div className="min-w-0 w-full md:w-auto">
                <div className="flex items-center gap-2 text-green-100 text-[12px] sm:text-[13px] font-medium mb-2 uppercase tracking-wide">
                  <Wallet size={16} className="shrink-0" />
                  <span className="break-words">Total Saldo Aktif</span>
                </div>

                <h2 className="text-[29px] sm:text-[34px] lg:text-[38px] font-bold tracking-tight leading-tight break-words">
                  {formatIDR(dashboardData.activeBalance)}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto">
                <div className="bg-black/15 backdrop-blur-md rounded-xl px-3 py-2 border border-white/15 min-w-0 sm:min-w-[170px]">
                  <div className="flex items-center gap-2 text-green-50 mb-1">
                    <div className="bg-white/25 p-1 rounded-full shrink-0">
                      <ArrowDownRight size={14} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider break-words">Masuk</span>
                  </div>
                  <p className="font-bold text-[14px] sm:text-[15px] break-words">{formatIDR(dashboardData.totalIncome)}</p>
                </div>

                <div className="bg-black/15 backdrop-blur-md rounded-xl px-3 py-2 border border-white/15 min-w-0 sm:min-w-[170px]">
                  <div className="flex items-center gap-2 text-red-50 mb-1">
                    <div className="bg-red-500/35 p-1 rounded-full shrink-0">
                      <ArrowUpRight size={14} className="text-red-200" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider break-words">Keluar</span>
                  </div>
                  <p className="font-bold text-[14px] sm:text-[15px] break-words">{formatIDR(dashboardData.totalExpense)}</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-black/10 rounded-2xl px-4 py-3 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[12px] text-green-50 mb-2 font-medium">
                <span className="flex items-center gap-1 min-w-0">
                  <Zap size={14} className="text-yellow-300 fill-yellow-300 shrink-0" />
                  <span className="break-words">Batas Aman Pengeluaran</span>
                </span>
                <span className="break-words">Sisa: {formatIDR(dashboardData.safeLimitRemaining)}</span>
              </div>

              <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
                <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${dashboardData.safeLimitPercent}%` }}>
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-[18px] font-bold page-title mb-4">Fitur Andalan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FeatureCard
              icon={<Receipt size={20} />}
              title="Reminder Tagihan"
              colorTheme="blue"
              onClick={() => navigate('/anggaran', { state: { activeTab: 'langganan' } })}
            />
            <FeatureCard
              icon={<CreditCard size={20} />}
              title="Utang & Cicilan"
              colorTheme="red"
              onClick={() => navigate('/anggaran', { state: { activeTab: 'utang' } })}
            />
            <FeatureCard
              icon={<Sparkles size={20} />}
              title="Smart AI Input"
              colorTheme="purple"
              onClick={() => navigate('/transaksi', { state: { openSmartAI: true } })}
            />
            <FeatureCard
              icon={<Lightbulb size={20} />}
              title="AI Financial Insight"
              colorTheme="yellow"
              onClick={() => navigate('/investasi')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 items-start">
          <TransaksiTerakhir
            formatIDR={formatIDR}
            transactions={recentTransactions}
            bills={upcomingBills}
          />
          <StatistikChart formatIDR={formatIDR} chartDataSources={chartDataSources} />
        </div>

      </div>
    </AppLayout>
  );
}

function FeatureCard({ icon, title, onClick, colorTheme }) {
  const themes = {
    blue: {
      icon: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400',
      title: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
      border: 'hover:border-blue-500/30',
      surface: 'hover:bg-blue-50/70 dark:hover:bg-blue-500/10',
    },
    red: {
      icon: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400',
      title: 'group-hover:text-red-500 dark:group-hover:text-red-400',
      border: 'hover:border-red-500/30',
      surface: 'hover:bg-red-50/70 dark:hover:bg-red-500/10',
    },
    purple: {
      icon: 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400',
      title: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
      border: 'hover:border-purple-500/30',
      surface: 'hover:bg-purple-50/70 dark:hover:bg-purple-500/10',
    },
    yellow: {
      icon: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      title: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
      border: 'hover:border-yellow-500/30',
      surface: 'hover:bg-yellow-50/70 dark:hover:bg-yellow-500/10',
    },
    green: {
      icon: 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845]',
      title: 'group-hover:text-[#05A845]',
      border: 'hover:border-[#05A845]/30',
      surface: 'hover:bg-[#EAF6ED]/70 dark:hover:bg-[#05A845]/10',
    },
  };

  const currentTheme = themes[colorTheme] || themes.green;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1f2028] rounded-[20px] p-5 border border-gray-100 dark:border-[#2e303a] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center min-w-0 ${currentTheme.border} ${currentTheme.surface}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${currentTheme.icon}`}>
        {icon}
      </div>
      <h4 className={`font-bold text-[#1A1A1A] dark:text-white text-[14px] transition-colors break-words ${currentTheme.title}`}>
        {title}
      </h4>
    </div>
  );
}
