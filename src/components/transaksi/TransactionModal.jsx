import React, { useEffect, useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createCategory, getCategories } from '../../services/budgetService';
import CustomSelect from '../ui/CustomSelect';

const defaultCategories = {
  expense: [
    'Kebutuhan Pokok',
    'Makanan & Minuman',
    'Transportasi',
    'Tagihan & Utilitas',
    'Tempat Tinggal',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Cicilan & Utang',
    'Tabungan & Investasi',
    'Lainnya',
  ],
  income: [
    'Gaji',
    'Uang Saku',
    'Bonus / THR',
    'Hasil Investasi',
    'Freelance',
    'Hadiah',
    'Lainnya',
  ],
};

const normalizeCategoryForType = (category, type) => {
  if (!category) return '';

  const aliases = {
    expense: {
      'F&B': 'Makanan & Minuman',
      Utilitas: 'Tagihan & Utilitas',
    },
    income: {
      Bonus: 'Bonus / THR',
      Investasi: 'Hasil Investasi',
    },
  };

  return aliases[type]?.[category] || category;
};

export default function TransactionModal({
  isOpen, onClose, editingData, manualType, setManualType, nominalInput, handleNominalChange, onSaveTransaction
}) {
  const { showError, showWarning } = useToast();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      try {
        const response = await getCategories(manualType);
        const backendCategories = response?.data?.categories || [];
        const names = backendCategories.map((category) => category.name).filter(Boolean);

        if (names.length > 0) {
          setCategories((prev) => ({
            ...prev,
            [manualType]: names,
          }));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        showWarning('Kategori backend belum bisa dimuat, pakai kategori lokal dulu.');
      }
    };

    loadCategories();
  }, [isOpen, manualType, showWarning]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      return;
    }

    const initialCategory = normalizeCategoryForType(editingData?.category, manualType);

    if (initialCategory) {
      setCategories((prev) => {
        if (prev[manualType].includes(initialCategory)) return prev;
        return {
          ...prev,
          [manualType]: [...prev[manualType], initialCategory],
        };
      });
    }

    if (editingData) {
      setSelectedCategory(initialCategory);
      setTitle(editingData.title || '');
      setMerchant(editingData.merchant || '');
      setDate(editingData.date ? convertDateToInput(editingData.date) : new Date().toISOString().split('T')[0]);
      setNote(editingData.note || '');
    } else {
      setSelectedCategory('');
      setTitle('');
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    
    setNewCategory('');
    setShowAddCategory(false);
  }, [isOpen, editingData, manualType]);

  const convertDateToInput = (dateStr) => {
    const monthMap = {
      'Okt': '10', 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'Mei': '05',
      'Jun': '06', 'Jul': '07', 'Agu': '08', 'Sep': '09', 'Nov': '11', 'Des': '12'
    };
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = monthMap[parts[1]] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  const handleTypeChange = (type) => {
    setManualType(type);
    setSelectedCategory('');
    setNewCategory('');
    setShowAddCategory(false);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'add-new') {
      setShowAddCategory(true);
      return;
    }
    setSelectedCategory(value);
    setShowAddCategory(false);
  };

  const handleAddCategory = async () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) return;

    setIsSavingCategory(true);
    try {
      await createCategory({
        name: trimmedCategory,
        transaction_type: manualType,
        budget_group: manualType === 'income' ? 'income' : 'other',
      });
    } catch (error) {
      console.error('Error creating category:', error);
      showWarning('Kategori belum tersimpan ke backend, tapi tetap dipakai di form ini.');
    } finally {
      setIsSavingCategory(false);

      setCategories((prev) => {
        const currentCategories = prev[manualType];
        const isDuplicate = currentCategories.some(
          (category) => category.toLowerCase() === trimmedCategory.toLowerCase()
        );
        if (isDuplicate) return prev;
        return {
          ...prev,
          [manualType]: [...currentCategories, trimmedCategory],
        };
      });

      setSelectedCategory(trimmedCategory);
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleSave = async () => {
    if (!nominalInput || nominalInput === '') {
      showError('Nominal harus diisi');
      return;
    }
    if (!title.trim()) {
      showError('Deskripsi transaksi harus diisi');
      return;
    }
    if (!merchant.trim()) {
      showError(manualType === 'income' ? 'Sumber dana harus diisi' : 'Nama toko/merchant harus diisi');
      return;
    }
    if (!selectedCategory) {
      showError('Kategori harus dipilih');
      return;
    }
    if (!date) {
      showError('Tanggal harus diisi');
      return;
    }

    const amount = parseInt(nominalInput.replace(/[^0-9]/g, '')) || 0;
    if (amount === 0) {
      showError('Nominal harus lebih dari 0');
      return;
    }

    const [year, month, day] = date.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const displayDate = `${day} ${monthNames[parseInt(month)]} ${year}`;

    const transaction = {
      id: editingData?.id || Date.now(),
      date: displayDate,
      title: title.trim(),
      description: title.trim(),
      merchant: merchant.trim(),
      category: selectedCategory,
      category_name: selectedCategory,
      amount: manualType === 'income' ? amount : -amount,
      type: manualType,
      transaction_type: manualType,
      transaction_date: date,
      note: note.trim(),
      notes: note.trim(),
      hasReceipt: editingData?.hasReceipt || false,
    };

    if (onSaveTransaction) {
      try {
        await onSaveTransaction(transaction);
      } catch (_error) {
        return;
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 md:items-center md:p-4">
      <div className="bg-white dark:bg-[#1f2028] w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="shrink-0 flex justify-between items-center gap-4 p-4 md:p-6 border-b border-gray-100 dark:border-[#2e303a]">
          <h3 className="min-w-0 text-[16px] md:text-[18px] font-bold text-[#1A1A1A] dark:text-white break-words">
            {editingData ? 'Edit Transaksi' : 'Catat Transaksi'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 dark:hover:text-red-400 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="flex p-1 bg-gray-100 dark:bg-white/[0.08] rounded-xl relative">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 min-w-0 py-2 px-2 text-[13px] sm:text-[14px] font-bold rounded-lg transition-all z-10 truncate ${manualType === 'expense' ? 'bg-white dark:bg-[#2a2d36] text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 min-w-0 py-2 px-2 text-[13px] sm:text-[14px] font-bold rounded-lg transition-all z-10 truncate ${manualType === 'income' ? 'bg-white dark:bg-[#2a2d36] text-[#05A845] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-[#05A845]'}`}
            >
              Pemasukan
            </button>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Nominal</label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-[18px] font-bold ${manualType === 'income' ? 'text-[#05A845]' : 'text-red-500'}`}>Rp</span>
              <input
                type="text"
                placeholder="0"
                value={nominalInput}
                onChange={handleNominalChange}
                className={`w-full min-w-0 pl-12 pr-4 py-4 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 transition-all text-[22px] sm:text-[24px] font-bold bg-white dark:bg-[#2a2d36] dark:text-white ${manualType === 'income' ? 'focus:ring-[#EAF6ED] dark:focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#05A845]' : 'focus:ring-red-100 dark:focus:ring-red-500/20 focus:border-red-500 text-red-500'}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Deskripsi Transaksi</label>
            <input
              type="text"
              placeholder={manualType === 'income' ? 'Contoh: Gaji Bulanan, Bonus Project...' : 'Contoh: Belanja Bulanan, Makan Siang...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
              {manualType === 'income' ? 'Sumber Dana' : 'Nama Toko / Merchant'}
            </label>
            <input
              type="text"
              placeholder={manualType === 'income' ? 'Contoh: PT ABCD, Client Freelance...' : 'Contoh: Alfamart, Kopi Kenangan...'}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Kategori</label>
              <CustomSelect
                value={selectedCategory}
                onChange={(value) => handleCategoryChange({ target: { value } })}
                placeholder="-- Pilih Kategori --"
                options={[
                  ...categories[manualType].map((category) => ({ value: category, label: category })),
                  { value: 'add-new', label: '+ Tambah Kategori Baru' },
                ]}
                buttonClassName="bg-white dark:bg-[#2a2d36]"
                searchable
                searchPlaceholder="Cari kategori..."
              />

              {showAddCategory && (
                <div className="mt-3 p-4 rounded-xl border border-dashed border-[#05A845]/40 dark:border-[#05A845]/30 bg-[#EAF6ED]/40 dark:bg-[#05A845]/10">
                  <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Nama Kategori Baru
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder={manualType === 'expense' ? 'Contoh: Skincare, Laundry...' : 'Contoh: Freelance, Hadiah...'}
                      className="flex-1 min-w-0 px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl bg-white dark:bg-[#2a2d36] text-[#1A1A1A] dark:text-white text-[14px] focus:outline-none focus:border-[#05A845] break-words"
                    />

                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={isSavingCategory}
                      className="px-4 py-3 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      <Check size={16} /> {isSavingCategory ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory('');
                    }}
                    className="mt-3 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Batal tambah kategori
                  </button>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-w-0 px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Catatan (Opsional)</label>
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-200 dark:border-[#2e303a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05A845]/20 focus:border-[#05A845] text-[#1A1A1A] dark:text-white bg-white dark:bg-[#2a2d36] text-[14px] resize-none"
            />
          </div>
        </div>

        <div className="shrink-0 p-4 md:p-6 border-t border-gray-100 dark:border-[#2e303a] flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button onClick={onClose} className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e303a] text-gray-600 dark:text-gray-400 font-semibold text-[14px] hover:bg-white dark:hover:bg-white/[0.04] transition-colors">Batal</button>
          <button onClick={handleSave} className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] shadow-sm transition-colors">
            {editingData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}
