import { useEffect, useState } from 'react';
import { mockProfile } from '../services/mockData';

const getDefaultProfileData = (user) => ({
  fullName: user?.full_name || 'Demo Finly',
  email: user?.email || 'demo@finly.app',
  phone: user?.phone || mockProfile.phone,
  city: mockProfile.city,
  joined: mockProfile.joined,
});

const getSavedProfile = (user) => {
  const saved = localStorage.getItem('profileData');
  return saved ? { ...getDefaultProfileData(user), ...JSON.parse(saved) } : getDefaultProfileData(user);
};

export default function useProfileSettings({ user, showSuccess, showError }) {
  const [activeTab, setActiveTab] = useState('keamanan');
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [profileData, setProfileData] = useState(() => getSavedProfile(user));
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('notificationPreferences');
    return saved ? JSON.parse(saved) : {
      reminder: true,
      overspending: true,
      insight: false,
    };
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.oldPassword) {
      errors.oldPassword = 'Kata sandi lama harus diisi';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Kata sandi baru harus diisi';
    }
    if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Kata sandi minimal 8 karakter';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    }
    if (passwordForm.oldPassword === passwordForm.newPassword) {
      errors.newPassword = 'Kata sandi baru tidak boleh sama dengan yang lama';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleToggleChange = (key) => {
    const newToggles = { ...toggles, [key]: !toggles[key] };
    setToggles(newToggles);
    localStorage.setItem('notificationPreferences', JSON.stringify(newToggles));
    showSuccess('Preferensi notifikasi tersimpan');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (validatePassword()) {
      showSuccess('Kata sandi berhasil diubah');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      showError('Periksa kembali form kamu');
    }
  };

  const handleProfileChange = (key, value) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancelProfileEdit = () => {
    setProfileData(getSavedProfile(user));
    setIsEditing(false);
  };

  const handleProfileSave = () => {
    localStorage.setItem('profileData', JSON.stringify(profileData));
    setIsEditing(false);
    showSuccess('Profil berhasil disimpan');
  };

  return {
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
  };
}
