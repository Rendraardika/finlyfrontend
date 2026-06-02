import { useNavigate } from 'react-router-dom';
import { Home, Wifi, Tv, Music, HeartPulse, Zap, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logoFinly from '../assets/logo-finly.svg';

import Step1_Status from '../components/onboarding/Step1Status';
import Step2_Kondisi from '../components/onboarding/Step2Condition';
import Step3_Pengeluaran from '../components/onboarding/Step3Expense';
import Step4_Tujuan from '../components/onboarding/Step4Goal';
import Step5_HasilAI from '../components/onboarding/Step5AIResult';
import { mockOnboardingSubscriptionOptions } from '../services/mockData';
import useOnboardingFlow from '../hooks/useOnboardingFlow';
import { formatRupiah } from '../utils/onboardingViewModel';

const subscriptionIconByKey = {
  home: <Home size={28} className="text-blue-500" />,
  wifi: <Wifi size={28} className="text-purple-500" />,
  zap: <Zap size={28} className="text-amber-500" />,
  tv: <Tv size={28} className="text-red-500" />,
  music: <Music size={28} className="text-green-500" />,
  heart: <HeartPulse size={28} className="text-teal-500" />,
};

const subscriptionOptions = mockOnboardingSubscriptionOptions.map((option) => ({
  ...option,
  icon: subscriptionIconByKey[option.iconKey] || <Receipt size={28} className="text-gray-500" />,
}));

export default function Onboarding() {
  const { user, updateOnboarding } = useAuth();
  const navigate = useNavigate();
  const customSubscriptionIcon = <Receipt size={28} className="text-gray-500" />;
  const {
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
  } = useOnboardingFlow({ navigate, customSubscriptionIcon, updateOnboarding });

  const handleCustomPriceChange = (e) => {
    setCustomPrice(formatRupiah(e.target.value));
  };


  const displayOptions = subscriptionOptions.filter(sub => isKosHidden ? sub.id !== 'kos' : true);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111111] flex flex-col font-sans py-10 px-4">
      <div className="flex-1 flex items-center justify-center">
        
        <div className="bg-white dark:bg-[#1f2028] rounded-[24px] shadow-sm border border-gray-100 dark:border-[#2e303a] w-full max-w-[800px] p-8 sm:px-12 sm:py-10 transition-all duration-500">
          <div className="flex flex-col items-center mb-6">
            <img src={logoFinly} alt="Finly" className="h-12 mb-3 object-contain text-[#05A845] font-bold text-2xl" />
            
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[#EAF6ED] text-[#05A845] px-3.5 py-1 rounded-full text-[12px] font-bold tracking-wide">
                Langkah {step} dari 5
              </div>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#05A845] transition-all duration-500" style={{width: `${(step/5)*100}%`}}></div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1_Status 
              user={user} 
              formData={formData} 
              handleChange={handleChange} 
              handleNext={handleNext} 
              loading={loading} 
              formatRupiah={formatRupiah} 
            />
          )}

          {step === 2 && (
            <Step2_Kondisi 
              formData={formData} 
              handleChange={handleChange} 
              handleNext={handleNext} 
              setStep={setStep}
              loading={loading} 
              formatRupiah={formatRupiah} 
            />
          )}

          {step === 3 && (
            <Step3_Pengeluaran 
              displayOptions={displayOptions} selectedSubs={selectedSubs} 
              customOptions={customOptions} toggleSubscription={toggleSubscription} 
              updateSubPrice={updateSubPrice} removeCustomOption={removeCustomOption} 
              showCustomInput={showCustomInput} setShowCustomInput={setShowCustomInput} 
              customName={customName} setCustomName={setCustomName} 
              customPrice={customPrice} handleCustomPriceChange={handleCustomPriceChange} 
              addCustomSubscription={addCustomSubscription} totalFixedCost={totalFixedCost} 
              incomeNum={incomeNum} formatRupiah={formatRupiah} 
              handleNext={handleNext} setStep={setStep}
            />
          )}

          {step === 4 && (
            <Step4_Tujuan 
              formData={formData} 
              handleChange={handleChange} 
              handleSimulateAI={handleSimulateAI} 
              loading={loading} 
              setStep={setStep} 
            />
          )}

          {step === 5 && (
            <Step5_HasilAI 
              formData={formData} 
              totalFixedCost={totalFixedCost} 
              sisaUang={sisaUang} 
              alokasiBase={alokasiBase} 
              incomeNum={incomeNum} 
              recommendedBudget={recommendedBudget}
              loading={loading}
              handleFinish={handleFinish} 
            />
          )}

        </div>
      </div>
    </div>
  );
}
