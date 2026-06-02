import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Pencil, Check, X, Sun, Moon, Eye, EyeOff
} from 'lucide-react';

import AppLayout from '../components/AppLayout';
import useProfileSettings from '../hooks/useProfileSettings';

export default function Profile() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const {
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    theme,
    setTheme,
    profileData,
    toggles,
    passwordForm,
    passwordErrors,
    handleToggleChange,
    handlePasswordChange,
    handlePasswordSave,
    handleProfileChange,
    handleCancelProfileEdit,
    handleProfileSave,
  } = useProfileSettings({ user, showSuccess, showError });

  const firstName = profileData.fullName.split(' ')[0];

  return (
    <AppLayout activeMenu="profil">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-[#1A1A1A] dark:text-white mb-1 flex items-center gap-2">
              {isEditing ? <span className="text-red-500">Mode Edit</span> : 'Pengaturan Profil'}
            </h1>
            <p className="text-[#666666] dark:text-gray-400 text-[15px]">Kelola informasi pribadi dan preferensi keuanganmu.</p>
          </div>

          {/* Profle Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[24px] p-8 border border-gray-100 dark:border-gray-700 shadow-sm mb-8 transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
              
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-50 dark:border-gray-700">
                  <img src={`https://ui-avatars.com/api/?name=${firstName}&background=05A845&color=fff&size=150`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                {isEditing ? (
                  <div className="min-w-0">
                    <label className="block text-[12px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(event) => handleProfileChange('fullName', event.target.value)}
                      className="w-full max-w-[320px] px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-[18px] font-bold text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-gray-600 focus:border-[#05A845] transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-[22px] font-bold text-[#1A1A1A] dark:text-white mb-2">{profileData.fullName}</h2>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-3">
                  <button onClick={handleCancelProfileEdit} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-[14px] flex items-center gap-2 transition-colors">
                    <X size={16} /> Batal
                  </button>
                  <button onClick={handleProfileSave} className="px-5 py-2 rounded-xl bg-[#05A845] hover:bg-[#048A38] text-white font-medium text-[14px] flex items-center gap-2 transition-colors shadow-sm">
                    <Check size={16} /> Simpan
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-[#05A845] hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-[14px] flex items-center gap-2 transition-colors">
                  <Pencil size={16} /> Edit Profil
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Note: Pada edit mode, biasanya email gak bisa diubah sembarangan, tapi aku biarin sesuai desainmu */}
              <ProfileField label="EMAIL" value={profileData.email} isEditing={isEditing} type="email" onChange={(value) => handleProfileChange('email', value)} />
              <ProfileField label="NO HANDPHONE" value={profileData.phone} isEditing={isEditing} onChange={(value) => handleProfileChange('phone', value)} />
              <ProfileField label="KOTA TEMPAT TINGGAL" value={profileData.city} isEditing={isEditing} onChange={(value) => handleProfileChange('city', value)} />
              <ProfileField label="BERGABUNG SEJAK" value={profileData.joined} isEditing={false} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto hide-scrollbar">
            <TabButton active={activeTab === 'keamanan'} onClick={() => setActiveTab('keamanan')} label="Keamanan & Akses" />
            <TabButton active={activeTab === 'preferensi'} onClick={() => setActiveTab('preferensi')} label="Preferensi Aplikasi" />
          </div>

          {/* Tab Keamanan & Akses */}
          {activeTab === 'keamanan' && (
            <div className="bg-white dark:bg-gray-800 rounded-[24px] p-8 border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in duration-300">
              <h3 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white mb-6">Ubah Kata Sandi</h3>
              <form className="space-y-5 max-w-lg" onSubmit={handlePasswordSave} autoComplete="off">
                <PasswordField 
                  label="Kata Sandi Lama" 
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.oldPassword}
                  placeholder="••••••••" 
                />
                <PasswordField 
                  label="Kata Sandi Baru" 
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                  placeholder="••••••••" 
                  hint="Minimal 8 karakter"
                />
                <PasswordField 
                  label="Konfirmasi Kata Sandi" 
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmPassword}
                  placeholder="••••••••" 
                />
                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#05A845] hover:bg-[#048A38] text-white font-medium text-[14px] transition-colors shadow-sm">
                    Simpan Password
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* Tab Preferensi Aplikasi */}
          {activeTab === 'preferensi' && (
            <div className="bg-white dark:bg-gray-800 rounded-[24px] p-8 border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in duration-300 space-y-10">
              <div>
                <h3 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white mb-5">Tampilan Aplikasi</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all ${
                      theme === 'light'
                        ? 'border-gray-300 dark:border-[#3a3d46] bg-white dark:bg-[#2a2d36] text-[#1A1A1A] dark:text-white shadow-sm font-semibold'
                        : 'border-gray-100 dark:border-[#2e303a] bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Sun size={20} className={theme === 'light' ? 'text-amber-500' : ''} /> Mode Terang
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all ${
                      theme === 'dark'
                        ? 'border-gray-700 bg-[#1A1A1A] text-white shadow-sm font-semibold dark:border-gray-600 dark:bg-gray-700'
                        : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <Moon size={20} className={theme === 'dark' ? 'text-blue-400' : ''} /> Mode Gelap
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 dark:bg-gray-700"></div>
              <div>
                <h3 className="text-[18px] font-bold text-[#1A1A1A] dark:text-white mb-6">Notifikasi Pintar</h3>
                <div className="space-y-6 max-w-2xl">
                  <ToggleItem 
                    title="Reminder Input" 
                    desc="Pengingat untuk mencatat pengeluaran harian." 
                    isOn={toggles.reminder} 
                    onToggle={() => handleToggleChange('reminder')}
                  />
                  <ToggleItem 
                    title="Alert Overspending" 
                    desc="Peringatan saat anggaran hampir habis." 
                    isOn={toggles.overspending} 
                    onToggle={() => handleToggleChange('overspending')}
                  />
                  <ToggleItem 
                    title="Insight Investasi" 
                    desc="Notifikasi peluang dan update investasi." 
                    isOn={toggles.insight} 
                    onToggle={() => handleToggleChange('insight')}
                  />
                </div>
              </div>

            </div>
          )}

        </div>
    </AppLayout>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 font-medium text-[15px] border-b-2 transition-colors whitespace-nowrap ${
        active 
        ? 'text-[#05A845] border-[#05A845]' 
        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function ProfileField({ label, value, isEditing, type = 'text', onChange }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">{label}</p>
      {isEditing ? (
        <input 
          type={type} 
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          autoComplete="off"
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EAF6ED] dark:focus:ring-gray-600 focus:border-[#05A845] transition-all"
        />
      ) : (
        <p className="text-[16px] font-medium text-[#1A1A1A] dark:text-white">{value}</p>
      )}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, error, placeholder, hint }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <input 
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 ${
            error 
              ? 'border-red-500 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/20 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-600 focus:ring-[#EAF6ED] dark:focus:ring-gray-600 focus:border-[#05A845]'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#05A845] transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-[12px] mt-1">{error}</p>}
      {hint && !error && <p className="text-gray-400 text-[12px] mt-1">{hint}</p>}
    </div>
  );
}

function ToggleItem({ title, desc, isOn, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl px-3 py-2 -mx-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
      <div className="min-w-0">
        <h4 className="text-[15px] font-medium text-[#1A1A1A] dark:text-white">{title}</h4>
        <p className="text-[13px] text-[#666666] dark:text-gray-400">{desc}</p>
      </div>
      <button 
        type="button"
        aria-pressed={isOn}
        onClick={onToggle}
        className={`w-12 h-6 rounded-full flex items-center p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#05A845]/25 shrink-0 ${
          isOn
            ? 'bg-[#05A845] shadow-sm ring-1 ring-[#05A845]/30'
            : 'bg-gray-200 dark:bg-white/[0.12] ring-1 ring-gray-300 dark:ring-white/[0.08]'
        }`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
