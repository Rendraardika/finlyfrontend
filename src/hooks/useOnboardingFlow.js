import { useState } from 'react';
import { getNumber, initialOnboardingForm } from '../utils/onboardingViewModel';
import api from '../services/api';

const cityByProvince = {
  'DKI Jakarta': 'Jakarta',
  'Jawa Barat': 'Bandung',
  'Jawa Tengah': 'Semarang',
  'DI Yogyakarta': 'Yogyakarta',
  'Jawa Timur': 'Surabaya',
};

const buildProfilePayload = (formData, selectedSubs) => {
  const province = formData.provinsi === 'Lainnya' ? 'DKI Jakarta' : formData.provinsi;
  const city = cityByProvince[province] || province || 'Jakarta';
  const statusUser = formData.status_user || 'pekerja';
  const mandatoryBills = selectedSubs.reduce((total, item) => total + Number(item.defaultPrice || 0), 0);
  const mandatoryIds = new Set(['kos', 'wifi', 'pln', 'bpjs']);
  const routineExpenses = selectedSubs.map((item) => {
    const amount = Number(item.defaultPrice || 0);
    const isMandatory = mandatoryIds.has(item.id);

    return {
      id: item.id,
      name: item.name,
      amount,
      kind: isMandatory ? 'mandatory' : 'subscription',
      bill_type: isMandatory ? 'bill' : 'subscription',
      budget_group: isMandatory ? 'needs' : 'wants',
    };
  }).filter((item) => item.amount > 0);

  return {
    occupation: statusUser === 'pelajar' ? 'Pelajar/Mahasiswa' : 'Pekerja',
    status_user: statusUser,
    location: {
      city,
      province,
      country: 'Indonesia',
    },
    monthly_income: getNumber(formData.pemasukan_bulanan),
    dependents_count: parseInt(formData.jumlah_tanggungan, 10) || 0,
    mandatory_bills: mandatoryBills,
    routine_expenses: routineExpenses,
    emergency_fund_current: getNumber(formData.dana_darurat_saat_ini),
    financial_goal: formData.tujuan_keuangan || 'atur_pengeluaran',
    goal_horizon: formData.horizon_tujuan || 'kurang_6_bulan',
    income_stability: formData.stabilitas_pemasukan || 'cukup_stabil',
    meal_coverage: formData.status_makan || null,
    housing_coverage: formData.status_tempat_tinggal || null,
    preferred_budget_method: 'custom',
  };
};

export default function useOnboardingFlow({ navigate, customSubscriptionIcon, updateOnboarding }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendedBudget, setRecommendedBudget] = useState(null);
  const [formData, setFormData] = useState(initialOnboardingForm);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [customOptions, setCustomOptions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const removeCustomOption = (id, e) => {
    e.stopPropagation();
    setCustomOptions((items) => items.filter((item) => item.id !== id));
    setSelectedSubs((items) => items.filter((item) => item.id !== id));
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleNext = (e, nextStep) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(nextStep);
    }, 800);
  };

  const toggleSubscription = (sub) => {
    setSelectedSubs((items) => (
      items.find((item) => item.id === sub.id)
        ? items.filter((item) => item.id !== sub.id)
        : [...items, sub]
    ));
  };

  const updateSubPrice = (id, newPriceStr) => {
    const num = getNumber(newPriceStr);
    setSelectedSubs((items) => items.map((item) => (
      item.id === id ? { ...item, defaultPrice: num } : item
    )));
  };

  const addCustomSubscription = () => {
    if (!customName || !customPrice) return;

    const newSub = {
      id: `custom-${Date.now()}`,
      name: customName,
      defaultPrice: getNumber(customPrice),
      icon: customSubscriptionIcon,
      isCustom: true,
    };

    setCustomOptions((items) => [...items, newSub]);
    setSelectedSubs((items) => [...items, newSub]);
    setShowCustomInput(false);
    setCustomName('');
    setCustomPrice('');
  };

  const handleSimulateAI = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/onboarding/profile', buildProfilePayload(formData, selectedSubs));
      const data = response.data?.data || {};
      setRecommendedBudget(data.recommended_budget || null);
      updateOnboarding?.(data.onboarding || null);
      setLoading(false);
      setStep(5);
    } catch (requestError) {
      setLoading(false);
      setError(requestError.response?.data?.message || 'Gagal menyimpan profil onboarding.');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      const fallbackAllocations = [
        { key: 'needs', name: 'Kebutuhan Sehari-hari', budget_group: 'needs', percent: 50, amount: alokasiBase * 0.5 },
        {
          key: 'wants',
          name: 'Hiburan & Lainnya',
          budget_group: 'wants',
          percent: formData.tujuan_keuangan === 'tabungan_tujuan' ? 30 : 40,
          amount: alokasiBase * (formData.tujuan_keuangan === 'tabungan_tujuan' ? 0.3 : 0.4)
        },
        { key: 'emergency_fund', name: 'Dana Darurat', budget_group: 'savings', percent: 10, amount: alokasiBase * 0.1 },
        ...(formData.tujuan_keuangan === 'tabungan_tujuan'
          ? [{ key: 'goal_saving', name: 'Tabungan Tujuan', budget_group: 'savings', percent: 10, amount: alokasiBase * 0.1 }]
          : []),
      ];
      const allocations = recommendedBudget?.allocations || fallbackAllocations;
      const response = await api.post('/onboarding/budget-allocation', {
        name: 'Budget Onboarding',
        allocations,
      });
      updateOnboarding?.(response.data?.data?.onboarding || { next_step: 'dashboard' });
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Gagal menyimpan alokasi anggaran.');
    } finally {
      setLoading(false);
    }
  };

  const incomeNum = getNumber(formData.pemasukan_bulanan);
  const totalFixedCost = selectedSubs.reduce((total, item) => total + item.defaultPrice, 0);
  const sisaUang = incomeNum - totalFixedCost;
  const alokasiBase = Math.max(sisaUang, 0);
  const isKosHidden = formData.status_user === 'pelajar' && formData.status_tempat_tinggal === 'ditanggung';

  return {
    step,
    setStep,
    loading,
    error,
    formData,
    recommendedBudget,
    selectedSubs,
    customOptions,
    showCustomInput,
    customName,
    customPrice,
    incomeNum,
    totalFixedCost,
    sisaUang,
    alokasiBase,
    isKosHidden,
    setShowCustomInput,
    setCustomName,
    setCustomPrice,
    removeCustomOption,
    handleChange,
    handleNext,
    toggleSubscription,
    updateSubPrice,
    addCustomSubscription,
    handleSimulateAI,
    handleFinish,
  };
}
