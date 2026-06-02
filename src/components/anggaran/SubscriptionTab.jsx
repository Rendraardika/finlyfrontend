import React from 'react';
import { Plus, Check, Pencil, Trash2, CalendarDays } from 'lucide-react';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const formatDateID = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const subscriptionColorClasses = {
  red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20',
  green: 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] border border-[#05A845]/10 dark:border-[#05A845]/20',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20',
};

const frequencyLabel = {
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

export default function SubscriptionTab({
  subscriptions = [],
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
  onTogglePaid,
  onUpdateDueDate,
}) {
  const totalSubscription = subscriptions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const unpaidCount = subscriptions.filter((item) => !item.isPaid).length;

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#EAF6ED] dark:bg-[#05A845]/10 rounded-[24px] p-6 md:p-8 border border-[#05A845]/20 dark:border-[#05A845]/25 shadow-sm gap-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[#05A845] mb-1 uppercase tracking-wider break-words">
            Total Tagihan Bulan Ini
          </h3>
          <p className="text-[30px] sm:text-[32px] font-bold text-[#1A1A1A] dark:text-white leading-tight break-words">
            {formatIDR(totalSubscription)}
          </p>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2 break-words">
            {unpaidCount > 0 ? `${unpaidCount} tagihan belum dibayar` : 'Semua tagihan sudah lunas'}
          </p>
        </div>

        <button
          onClick={onAddSubscription}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors w-full md:w-auto"
        >
          <Plus size={18} className="shrink-0" /> Tambah Tagihan
        </button>
      </div>

      <div className="bg-white dark:bg-[#1f2028] rounded-[24px] border border-gray-100 dark:border-[#2e303a] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#2e303a] flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <h3 className="text-[16px] font-bold text-[#1A1A1A] dark:text-white break-words">
            Daftar Tagihan & Langganan Aktif
          </h3>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-gray-500 dark:text-gray-400">
            Belum ada tagihan aktif. Tambahkan tagihan rutin pertamamu.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-[#2e303a]">
            {subscriptions.map((subscription) => (
              <SubscriptionItem
                key={subscription.id}
                subscription={subscription}
                onTogglePaid={onTogglePaid}
                onEdit={onEditSubscription}
                onDelete={onDeleteSubscription}
                onUpdateDueDate={onUpdateDueDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionItem({ subscription, onTogglePaid, onEdit, onDelete, onUpdateDueDate }) {
  const [isDuePickerOpen, setIsDuePickerOpen] = React.useState(false);
  const initial = subscription.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  const color = subscription.isPaid 
    ? subscriptionColorClasses.green 
    : subscription.color 
      ? subscriptionColorClasses[subscription.color] || subscriptionColorClasses.red
      : subscriptionColorClasses.red;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasDueDate = Boolean(subscription.dueDate);
  const dueDate = hasDueDate ? new Date(`${subscription.dueDate}T00:00:00`) : null;
  const daysUntilDue = dueDate ? Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
  
  const isLate = daysUntilDue !== null && daysUntilDue < 0 && !subscription.isPaid;
  const isUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3 && !subscription.isPaid;
  const statusBadge = isLate ? 'Terlambat' : isUrgent ? 'Segera Jatuh Tempo' : null;

  return (
    <div className="p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_auto] xl:items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[18px] shrink-0 ${color}`}>
          {initial}
        </div>

        <div className="min-w-0">
          <h4 className="text-[15px] font-bold text-[#1A1A1A] dark:text-white mb-1 break-words">
            {subscription.name}
          </h4>
          <span className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
            subscription.budgetGroup === 'wants'
              ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300'
              : 'bg-[#EAF6ED] text-[#05A845] dark:bg-[#05A845]/10'
          }`}>
            {subscription.billType === 'subscription' || subscription.budgetGroup === 'wants' ? 'Langganan' : 'Tagihan Wajib'}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        {hasDueDate ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#161616] px-3 py-2">
              <CalendarDays size={16} className="text-[#05A845] shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Jatuh Tempo</p>
                <p className="text-[13px] font-bold text-[#1A1A1A] dark:text-white">{formatDateID(subscription.dueDate)}</p>
              </div>
            </div>
            <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">
              {frequencyLabel[subscription.frequency] || 'Bulanan'} tiap tanggal {subscription.dueDay || '-'}
            </span>
            {statusBadge && (
              <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${isLate ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-600'}`}>
                {statusBadge}
              </span>
            )}
          </div>
        ) : (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsDuePickerOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#05A845]/20 bg-[#EAF6ED] px-3 py-2 text-[13px] font-bold text-[#05A845] hover:bg-[#DDF2E4] transition-colors"
            >
              <CalendarDays size={16} /> Atur Jatuh Tempo
            </button>
            {isDuePickerOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-gray-100 dark:border-[#2e303a] bg-white dark:bg-[#1f2028] p-3 shadow-xl">
                <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 mb-2 whitespace-nowrap">Pilih tanggal jatuh tempo</p>
                <input
                  type="date"
                  onChange={(event) => {
                    onUpdateDueDate?.(subscription.id, event.target.value);
                    setIsDuePickerOpen(false);
                  }}
                  className="w-[190px] rounded-xl border border-gray-200 dark:border-[#2e303a] bg-white px-3 py-2 text-[13px] font-semibold text-[#1A1A1A] focus:border-[#05A845] focus:outline-none focus:ring-2 focus:ring-[#05A845]/10 dark:bg-[#161616] dark:text-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_auto] items-stretch sm:items-center gap-3 border-t xl:border-t-0 border-gray-100 dark:border-[#2e303a] pt-4 xl:pt-0">
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2">
          <p className="text-[16px] font-bold text-[#1A1A1A] dark:text-white whitespace-nowrap">
            {formatIDR(subscription.amount)}
          </p>

          {subscription.isPaid ? (
            <button
              type="button"
              onClick={() => onTogglePaid(subscription.id)}
              className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-green-100 dark:bg-[#05A845]/20 text-green-700 dark:text-[#05A845] flex items-center gap-1 whitespace-nowrap hover:bg-green-200 dark:hover:bg-[#05A845]/30 transition-colors"
              title="Klik untuk ubah menjadi belum dibayar"
            >
              <Check size={12} /> Lunas
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTogglePaid(subscription.id)}
              className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 hover:bg-orange-500 hover:text-white transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
            >
              Tandai Lunas
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(subscription)}
            aria-label={`Edit ${subscription.name}`}
            title="Edit"
            className="w-9 h-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-[#EAF6ED] dark:hover:bg-[#05A845]/10 hover:text-[#05A845] focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 transition-colors flex items-center justify-center"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(subscription.id)}
            aria-label={`Hapus ${subscription.name}`}
            title="Hapus"
            className="w-9 h-9 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
