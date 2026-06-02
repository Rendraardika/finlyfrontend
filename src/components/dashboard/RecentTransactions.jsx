import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Coffee, Download, Car, Plus, Receipt, Sparkles } from 'lucide-react';

const iconByCategory = {
  'Makanan & Minuman': <Coffee size={18} />,
  Transportasi: <Car size={18} />,
  Gaji: <Download size={18} />,
  'Hasil Investasi': <Download size={18} />,
};

const formatTransactionDate = (date) => {
  if (!date) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
};

const getBillStatusLabel = (bill) => {
  if (!bill?.due_date) return 'Belum diatur';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${String(bill.due_date).slice(0, 10)}T00:00:00`);
  const days = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(dueDate.getTime())) return 'Belum diatur';
  if (days < 0) return 'Terlambat';
  if (days <= 3) return 'Segera jatuh tempo';
  return 'Terjadwal';
};

const isAggregateBillTransaction = (trx) => {
  const name = String(trx.name || trx.title || '').toLowerCase();
  const notes = String(trx.notes || '').toLowerCase();

  return (
    name.includes('tagihan wajib bulanan') ||
    name.includes('langganan bulanan') ||
    notes.startsWith('auto:onboarding_mandatory:')
  );
};

const buildBillItems = (bills) => bills.map((bill) => {
  const isSubscription = bill.bill_type === 'subscription' || bill.budget_group === 'wants';

  return {
    id: `bill-${bill.id}`,
    name: bill.name,
    category: isSubscription ? 'Langganan' : 'Tagihan Wajib',
    date: bill.due_date,
    amount: Number(bill.amount || 0),
    type: 'expense',
    isBill: true,
    isSubscription,
    statusLabel: getBillStatusLabel(bill),
  };
});

export default function TransaksiTerakhir({ formatIDR, transactions = [], bills = [] }) {
  const navigate = useNavigate();
  const visibleTransactions = transactions.filter((trx) => !isAggregateBillTransaction(trx));
  const displayItems = [...buildBillItems(bills), ...visibleTransactions].slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#1f2028] rounded-[24px] p-5 sm:p-8 border border-gray-100 dark:border-[#2e303a] shadow-sm">
      <div className="flex justify-between items-center gap-3 mb-6">
        <h3 className="text-[16px] sm:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
          Transaksi Terakhir
        </h3>

        <button
          onClick={() => navigate('/transaksi')}
          className="text-[#05A845] text-[13px] font-semibold hover:underline shrink-0"
        >
          Lihat Semua
        </button>
      </div>

      {displayItems.length === 0 ? (
        <div className="text-center py-12">
          <Download size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-[14px] mb-4">Belum ada transaksi</p>
          <button
            onClick={() => navigate('/transaksi')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#05A845] text-white font-semibold text-[13px] hover:bg-[#048A38] transition-colors"
          >
            <Plus size={16} /> Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {displayItems.map((trx) => (
            <div
              key={trx.id}
              className="flex items-start sm:items-center justify-between gap-3 group hover:bg-gray-50 dark:hover:bg-white/[0.04] p-2 -mx-2 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F8F9FA] dark:bg-white/[0.08] border border-gray-100 dark:border-[#2e303a] group-hover:border-[#05A845]/50 dark:group-hover:border-[#05A845]/30 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-[#05A845] dark:group-hover:text-[#05A845] transition-all shrink-0">
                  {trx.isBill
                    ? trx.isSubscription ? <Sparkles size={18} /> : <Receipt size={18} />
                    : iconByCategory[trx.category] || <ShoppingBag size={18} />}
                </div>

                <div className="min-w-0">
                  <h4 className="font-semibold text-[#1A1A1A] dark:text-white text-[14px] sm:text-[15px] truncate">
                    {trx.name}
                  </h4>
                  <p className="text-[#666666] dark:text-gray-400 text-[12px] sm:text-[13px] truncate">
                    {trx.isBill
                      ? `${trx.category} - ${trx.statusLabel}${trx.date ? `, ${formatTransactionDate(trx.date)}` : ''}`
                      : `${trx.category} - ${formatTransactionDate(trx.date)}`}
                  </p>
                </div>
              </div>

              <div className={`font-bold text-[13px] sm:text-[15px] shrink-0 text-right whitespace-nowrap ${trx.type === 'income' ? 'text-[#05A845]' : 'text-red-500 dark:text-red-400'}`}>
                {trx.type === 'income' ? '+' : '-'}{formatIDR(Math.abs(trx.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
