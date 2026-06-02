import React, { useEffect, useState } from 'react';
import { X, Home, ShoppingBag, TrendingUp, CreditCard, Tag, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import CustomSelect from '../ui/CustomSelect';

const customCategoryColors = ['blue', 'purple', 'pink', 'orange', 'teal', 'yellow'];

const billingFrequencyOptions = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

const billCategoryOptions = [
  { value: 'needs', label: 'Tagihan wajib / Kebutuhan Pokok' },
  { value: 'wants', label: 'Langganan opsional / Hiburan' },
];

const debtTypeOptions = [
  { value: 'loan', label: 'Pinjaman' },
  { value: 'installment', label: 'Cicilan' },
];

const dueDayOptions = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: `Tanggal ${index + 1}`,
}));

const getCyclingCategoryColor = (index) => {
  return customCategoryColors[index % customCategoryColors.length];
};

const formatNumberInput = (value) => {
  const number = Number(value) || 0;
  return number ? new Intl.NumberFormat('id-ID').format(number) : '';
};

const parseNumberInput = (value) => {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
};

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const buildNextDueDate = (dueDay, frequency = 'monthly') => {
  const day = Number(dueDay);
  if (!day) return '';

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const makeDate = (targetYear, targetMonth) => {
    const lastDate = new Date(targetYear, targetMonth + 1, 0).getDate();
    return new Date(targetYear, targetMonth, Math.min(day, lastDate));
  };

  let dueDate = makeDate(year, month);
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) {
    dueDate = frequency === 'yearly'
      ? makeDate(year + 1, month)
      : makeDate(year, month + 1);
  }

  return dueDate.toISOString().slice(0, 10);
};

function getCategoryIcon(category) {
  switch (category.icon) {
    case 'home':
      return <Home size={18} />;
    case 'shopping':
      return <ShoppingBag size={18} />;
    case 'trending':
      return <TrendingUp size={18} />;
    case 'credit':
      return <CreditCard size={18} />;
    default:
      return <Tag size={18} />;
  }
}

const iconColorClasses = {
  green: 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] border border-[#05A845]/10 dark:border-[#05A845]/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20',
  pink: 'bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20',
  teal: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20',
};

function BudgetEditItem({ category, onChangeTitle, onChangeLimit, onDelete }) {
  const iconColor = iconColorClasses[category.color] || iconColorClasses.green;

  return (
    <div className="bg-white dark:bg-[#2a2d36] p-4 rounded-xl border border-gray-200 dark:border-[#3a3d46] flex items-start sm:items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
        {getCategoryIcon(category)}
      </div>

      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-2 md:gap-3">
        <div className="min-w-0">
          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
            Nama Kategori
          </label>

          <input
            type="text"
            value={category.title}
            onChange={(e) => onChangeTitle(category.id, e.target.value)}
            placeholder="Ketik nama kategori..."
            className="w-full min-w-0 px-3 py-2 border border-gray-200 dark:border-[#2e303a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616] text-[13px] font-medium"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
            Limit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[14px] font-semibold text-gray-400 dark:text-gray-500">Rp</span>
            <input
              type="text"
              value={category.inputLimit}
              onChange={(e) => onChangeLimit(category.id, e.target.value)}
              placeholder="0"
              className="w-full min-w-0 pl-9 pr-3 py-2 border border-gray-200 dark:border-[#2e303a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#161616] text-[14px] font-bold"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(category.id)}
        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-7 shrink-0"
        aria-label="Hapus kategori"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export function EditBudgetModal({ isOpen, onClose, categories = [], onSaveCategories }) {
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirm();
  const [draftCategories, setDraftCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setDraftCategories(
        categories.map((category) => ({
          ...category,
          inputLimit: formatNumberInput(category.limit),
        }))
      );
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const totalLimit = draftCategories.reduce((sum, category) => sum + (Number(category.limit) || 0), 0);

  const handleChangeTitle = (id, value) => {
    setDraftCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, title: value } : category
      )
    );
  };

  const handleChangeLimit = (id, value) => {
    const parsedLimit = parseNumberInput(value);
    setDraftCategories((prev) =>
      prev.map((category) =>
        category.id === id
          ? { ...category, limit: parsedLimit, inputLimit: formatNumberInput(parsedLimit) }
          : category
      )
    );
  };

  const handleAddCategory = () => {
    const customCount = draftCategories.filter((category) => !category.isDefault).length;
    const color = customCategoryColors[customCount % customCategoryColors.length];

    setDraftCategories((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: '',
        spent: 0,
        limit: 0,
        inputLimit: '',
        color,
        icon: 'tag',
        isDefault: false,
      },
    ]);
  };

  const handleDeleteCategory = async (id) => {
    const selectedCategory = draftCategories.find((category) => category.id === id);
    if (!selectedCategory) return;

    const isConfirmed = await confirm({
      title: 'Hapus Kategori?',
      message: `Kategori "${selectedCategory.title || 'baru'}" akan dihapus.`,
      confirmText: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      setDraftCategories((prev) => prev.filter((category) => category.id !== id));
    }
  };

  const handleSave = () => {
    const hasEmptyName = draftCategories.some((category) => !category.title.trim());

    if (hasEmptyName) {
      showError('Nama kategori tidak boleh kosong.');
      return;
    }

    const hasInvalidLimit = draftCategories.some((category) => Number(category.limit) <= 0);

    if (hasInvalidLimit) {
      showError('Limit anggaran harus lebih dari 0.');
      return;
    }

    const cleanedCategories = draftCategories.map(({ inputLimit, ...category }) => ({
      ...category,
      title: category.title.trim(),
      limit: Number(category.limit) || 0,
      spent: Number(category.spent) || 0,
    }));

    onSaveCategories(cleanedCategories);
    showSuccess('Anggaran berhasil disimpan');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-start gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="min-w-0">
            <h3 className="text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">Sesuaikan Anggaran</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 break-words">Atur nama dan limit pengeluaran. Semua kategori bisa diedit atau dihapus.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-gray-50/50 dark:bg-white/[0.02]">
          {draftCategories.map((category) => (
            <BudgetEditItem
              key={category.id}
              category={category}
              onChangeTitle={handleChangeTitle}
              onChangeLimit={handleChangeLimit}
              onDelete={handleDeleteCategory}
            />
          ))}

          <button
            type="button"
            onClick={handleAddCategory}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-[#3a3d46] rounded-xl flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:bg-[#EAF6ED]/50 dark:hover:bg-[#05A845]/10 hover:border-[#05A845] hover:text-[#05A845] transition-colors font-semibold text-[14px]"
          >
            <Plus size={18} /> Tambah Kategori Baru
          </button>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4 bg-white dark:bg-[#1f2028]">
          <div className="text-center md:text-left w-full md:w-auto">
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-semibold mb-1">Total Limit Anggaran</p>
            <p className="text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">{formatIDR(totalLimit)}</p>
          </div>
          <div className="flex gap-2 md:gap-3 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">Batal</button>
            <button onClick={handleSave} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddSubscriptionModal({ isOpen, onClose, editingData, onSave }) {
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    amountInput: '',
    frequency: 'monthly',
    dueDay: '',
    budgetGroup: 'needs',
  });
  const [errors, setErrors] = useState({ name: '', amount: '', frequency: '', dueDay: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: editingData?.name || '',
        amount: Number(editingData?.amount) || 0,
        amountInput: formatNumberInput(editingData?.amount || 0),
        frequency: editingData?.frequency || 'monthly',
        dueDay: String(editingData?.dueDay || (editingData?.dueDate ? Number(String(editingData.dueDate).slice(8, 10)) : '')),
        budgetGroup: editingData?.budgetGroup || editingData?.budget_group || 'needs',
      });
      setErrors({ name: '', amount: '', frequency: '', dueDay: '' });
    }
  }, [isOpen, editingData]);

  if (!isOpen) return null;

  const handleAmountChange = (value) => {
    const amount = parseNumberInput(value);
    setFormData((prev) => ({
      ...prev,
      amount,
      amountInput: formatNumberInput(amount),
    }));
    if (amount > 0) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const handleSave = () => {
    const newErrors = { name: '', amount: '', frequency: '', dueDay: '' };
    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = 'Nama tagihan tidak boleh kosong';
      hasError = true;
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Nominal harus lebih dari 0';
      hasError = true;
    }

    if (!formData.frequency) {
      newErrors.frequency = 'Periode tagihan wajib dipilih';
      hasError = true;
    }

    if (!formData.dueDay) {
      newErrors.dueDay = 'Tanggal jatuh tempo wajib dipilih';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      showError('Mohon lengkapi data yang diperlukan');
      return;
    }

    onSave({
      id: editingData?.id,
      name: formData.name.trim(),
      amount: formData.amount,
      frequency: formData.frequency,
      dueDay: Number(formData.dueDay),
      dueDate: buildNextDueDate(formData.dueDay, formData.frequency),
      billType: formData.budgetGroup === 'wants' ? 'subscription' : 'bill',
      categoryName: formData.budgetGroup === 'wants' ? 'Hiburan & Keinginan' : 'Tagihan & Utilitas',
      budgetGroup: formData.budgetGroup,
      isPaid: editingData?.isPaid || false,
      color: editingData?.color || 'green',
    });
    showSuccess('Tagihan berhasil disimpan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-start gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="min-w-0">
            <h3 className="text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
              {editingData ? 'Edit Tagihan' : 'Tambah Tagihan Baru'}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 break-words">Catat langganan atau tagihan rutinmu.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Nama Langganan / Tagihan</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Contoh: Netflix, Listrik, Internet"
              className={`w-full min-w-0 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] ${errors.name ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845]'}`}
            />
            {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-4 md:space-y-5">
            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Kategori Anggaran</label>
              <CustomSelect
                value={formData.budgetGroup}
                options={billCategoryOptions}
                onChange={(value) => setFormData((prev) => ({ ...prev, budgetGroup: value || 'needs' }))}
                placeholder="Pilih kategori"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Tagihan wajib masuk Kebutuhan Pokok, langganan opsional masuk Hiburan.
              </p>
            </div>

            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Nominal Tagihan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[16px] font-bold text-[#1A1A1A] dark:text-white">Rp</span>
                <input
                  type="text"
                  value={formData.amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className={`w-full min-w-0 pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[16px] font-bold text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] ${errors.amount ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845]'}`}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-[12px] mt-1">{errors.amount}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="min-w-0">
                <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Periode Tagihan</label>
                <CustomSelect
                  value={formData.frequency}
                  options={billingFrequencyOptions}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, frequency: value }));
                    if (value) {
                      setErrors((prev) => ({ ...prev, frequency: '' }));
                    }
                  }}
                  placeholder="Pilih periode"
                  buttonClassName={errors.frequency ? 'border-red-400 dark:border-red-500' : ''}
                />
                {errors.frequency && <p className="text-red-500 text-[12px] mt-1">{errors.frequency}</p>}
              </div>

              <div className="min-w-0">
                <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Jatuh Tempo Tiap Tanggal</label>
                <CustomSelect
                  value={formData.dueDay}
                  options={dueDayOptions}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, dueDay: value }));
                    if (value) {
                      setErrors((prev) => ({ ...prev, dueDay: '' }));
                    }
                  }}
                  placeholder="Pilih tanggal"
                  buttonClassName={errors.dueDay ? 'border-red-400 dark:border-red-500' : ''}
                />
                {errors.dueDay && <p className="text-red-500 text-[12px] mt-1">{errors.dueDay}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-white dark:hover:bg-white/[0.04] transition-colors">Batal</button>
          <button onClick={handleSave} className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors">
            {editingData ? 'Simpan Perubahan' : 'Simpan Tagihan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddDebtModal({ isOpen, onClose, editingData, onSave }) {
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    debtType: 'installment',
    name: '',
    total: 0,
    totalInput: '',
    monthly: 0,
    monthlyInput: '',
    paid: 0,
    paidInput: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState({ name: '', total: '', paid: '', dueDate: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        debtType: editingData?.debtType || editingData?.debt_type || 'installment',
        name: editingData?.name || '',
        total: Number(editingData?.total) || 0,
        totalInput: formatNumberInput(editingData?.total || 0),
        monthly: Number(editingData?.monthly) || 0,
        monthlyInput: formatNumberInput(editingData?.monthly || 0),
        paid: Number(editingData?.paid) || 0,
        paidInput: formatNumberInput(editingData?.paid || 0),
        dueDate: editingData?.dueDate || '',
      });
      setErrors({ name: '', total: '', paid: '', dueDate: '' });
    }
  }, [isOpen, editingData]);

  if (!isOpen) return null;

  const handleMoneyChange = (field, value) => {
    const parsed = parseNumberInput(value);
    setFormData((prev) => ({
      ...prev,
      [field]: parsed,
      [`${field}Input`]: formatNumberInput(parsed),
    }));
  };

  const handleSave = () => {
    const newErrors = { name: '', total: '', paid: '', dueDate: '' };
    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = 'Nama cicilan atau utang tidak boleh kosong';
      hasError = true;
    }

    if (!formData.total || formData.total <= 0) {
      newErrors.total = 'Total utang harus lebih dari 0';
      hasError = true;
    }

    if (formData.paid > formData.total) {
      newErrors.paid = 'Nominal yang sudah dibayar tidak boleh lebih besar dari total utang';
      hasError = true;
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Tanggal jatuh tempo wajib diisi';
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      showError('Mohon lengkapi data yang diperlukan');
      return;
    }

    onSave({
      id: editingData?.id,
      name: formData.name.trim(),
      debtType: formData.debtType,
      total: formData.total,
      monthly: formData.monthly,
      paid: formData.paid,
      dueDate: formData.dueDate,
      color: editingData?.color || 'red',
    });
    showSuccess('Cicilan berhasil disimpan');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-start gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <div className="min-w-0">
            <h3 className="text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
              {editingData?.id ? 'Edit Cicilan / Utang' : 'Catat Pinjaman / Cicilan'}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 break-words">Pantau progres pelunasan utangmu.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-4 py-3">
            <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
              Pinjaman akan menambah saldo aktif sebagai pemasukan. Cicilan bulanannya tetap dicatat sebagai tagihan wajib.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Jenis Catatan</label>
            <CustomSelect
              value={formData.debtType}
              options={debtTypeOptions}
              onChange={(value) => setFormData((prev) => ({ ...prev, debtType: value || 'installment' }))}
              placeholder="Pilih jenis"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Pilih Pinjaman jika uangnya masuk ke saldo. Pilih Cicilan jika hanya mencatat kewajiban bayar.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Nama Pinjaman / Cicilan</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Contoh: KPR, Kendaraan, Pinjaman"
              className={`w-full min-w-0 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] ${errors.name ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500'}`}
            />
            {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Total Utang Keseluruhan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[14px] font-bold text-gray-400">Rp</span>
                <input
                  type="text"
                  value={formData.totalInput}
                  onChange={(e) => {
                    handleMoneyChange('total', e.target.value);
                    if (e.target.value && parseNumberInput(e.target.value) > 0) {
                      setErrors((prev) => ({ ...prev, total: '' }));
                    }
                  }}
                  placeholder="0"
                  className={`w-full min-w-0 pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] font-bold ${errors.total ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500'}`}
                />
              </div>
              {errors.total && <p className="text-red-500 text-[12px] mt-1">{errors.total}</p>}
            </div>

            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Target Cicilan per Bulan</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[14px] font-bold text-gray-400">Rp</span>
                <input
                  type="text"
                  value={formData.monthlyInput}
                  onChange={(e) => handleMoneyChange('monthly', e.target.value)}
                  placeholder="0"
                  className="w-full min-w-0 pl-10 pr-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500 text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] font-bold"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Boleh dikosongi jika cicilannya fleksibel.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Sudah Dibayar (Opsional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[14px] font-bold text-gray-400">Rp</span>
                <input
                  type="text"
                  value={formData.paidInput}
                  onChange={(e) => {
                    handleMoneyChange('paid', e.target.value);
                    if (parseNumberInput(e.target.value) <= formData.total) {
                      setErrors((prev) => ({ ...prev, paid: '' }));
                    }
                  }}
                  placeholder="0"
                  className={`w-full min-w-0 pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] font-bold ${errors.paid ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500'}`}
                />
              </div>
              {errors.paid && <p className="text-red-500 text-[12px] mt-1">{errors.paid}</p>}
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Isi nominal ini jika utang sudah berjalan sebelumnya.</p>
            </div>

            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Jatuh Tempo Cicilan Bulanan</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }));
                  if (e.target.value) {
                    setErrors((prev) => ({ ...prev, dueDate: '' }));
                  }
                }}
                className={`w-full min-w-0 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] ${errors.dueDate ? 'border-red-400 dark:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 dark:border-[#2e303a] focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500'}`}
              />
              {errors.dueDate && <p className="text-red-500 text-[12px] mt-1">{errors.dueDate}</p>}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-white dark:hover:bg-white/[0.04] transition-colors">Batal</button>
          <button onClick={handleSave} className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-[14px] hover:bg-red-600 shadow-sm transition-colors">
            {editingData?.id ? 'Simpan Perubahan' : 'Simpan Catatan'}
          </button>
        </div>
      </div>
    </div>
  );
}
