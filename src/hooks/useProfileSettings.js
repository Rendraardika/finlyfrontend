import { useEffect, useState } from 'react';
import { mockProfile } from '../services/mockData';
import { getProfile, updatePersonalProfile } from '../services/profileService';

const PROFILE_STORAGE_KEY = 'profileData';
const AVATAR_STORAGE_KEY = 'profileAvatar';

const getDefaultProfileData = (user) => ({
  fullName: user?.full_name || 'Demo Finly',
  email: user?.email || 'demo@finly.app',
  phone: user?.phone || '',
  city: mockProfile.city,
  joined: mockProfile.joined,
  avatarUrl: localStorage.getItem(AVATAR_STORAGE_KEY) || '',
});

const getSavedProfile = (user) => {
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
  return saved ? { ...getDefaultProfileData(user), ...JSON.parse(saved) } : getDefaultProfileData(user);
};

const mapApiProfile = (payload, user) => {
  const profileUser = payload?.user || {};
  return {
    ...getSavedProfile(user),
    fullName: profileUser.full_name || profileUser.fullName || user?.full_name || 'Demo Finly',
    email: profileUser.email || user?.email || 'demo@finly.app',
    phone: profileUser.phone || user?.phone || '',
    city: profileUser.province || profileUser.location?.province || profileUser.city || profileUser.location?.city || mockProfile.city,
    joined: profileUser.joined_label || mockProfile.joined,
    avatarUrl: localStorage.getItem(AVATAR_STORAGE_KEY) || '',
  };
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
    let ignore = false;

    const loadProfile = async () => {
      try {
        const response = await getProfile();
        const nextProfile = mapApiProfile(response.data, user);
        if (!ignore) {
          setProfileData(nextProfile);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

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

  const handleProfileSave = async () => {
    try {
      const response = await updatePersonalProfile(profileData);
      const nextProfile = {
        ...profileData,
        ...mapApiProfile(response.data, user),
        avatarUrl: profileData.avatarUrl,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      setProfileData(nextProfile);
      setIsEditing(false);
      showSuccess('Profil berhasil disimpan');
    } catch (error) {
      console.error('Error saving profile:', error);
      showError(error.response?.data?.message || 'Gagal menyimpan profil');
    }
  };

  const handleAvatarChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('File foto profil harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Ukuran foto maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = String(reader.result || '');
      localStorage.setItem(AVATAR_STORAGE_KEY, avatarUrl);
      window.dispatchEvent(new CustomEvent('finly:profile-avatar-updated', { detail: avatarUrl }));
      setProfileData((prev) => {
        const nextProfile = { ...prev, avatarUrl };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
        return nextProfile;
      });
      showSuccess('Foto profil berhasil diperbarui');
    };
    reader.readAsDataURL(file);
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
    handleAvatarChange,
    handleCancelProfileEdit,
    handleProfileSave,
  };
}
