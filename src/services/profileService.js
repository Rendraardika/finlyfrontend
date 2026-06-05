import api, { USE_MOCKS } from './api';
import { mockProfile } from './mockData';

export const getProfile = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        user: {
          full_name: 'Demo Finly',
          email: mockProfile.email,
          phone: '',
          city: mockProfile.city,
          joined_label: mockProfile.joined,
        },
        preferences: {
          reminder_input_enabled: true,
          overspending_alert_enabled: true,
          investment_insight_enabled: false,
          theme: localStorage.getItem('theme') || 'light',
        },
      },
    };
  }

  const response = await api.get('/profile');
  return response.data;
};

export const updatePersonalProfile = async (profileData) => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        user: {
          full_name: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          city: profileData.city,
          joined_label: profileData.joined,
        },
      },
    };
  }

  const response = await api.patch('/profile/personal', {
    full_name: profileData.fullName,
    email: profileData.email,
    phone: profileData.phone,
    city: profileData.city,
  });
  return response.data;
};
