import api, { USE_MOCKS } from './api';
import { mockNotifications } from './mockData';

// Get all notifications
export const getNotifications = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        notifications: mockNotifications,
      },
    };
  }

  const response = await api.get('/notifications');
  return response.data;
};

// Get unread notifications
export const getUnreadNotifications = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      data: {
        notifications: mockNotifications.filter((item) => item.unread),
      },
    };
  }

  const response = await api.get('/notifications', {
    params: { unread_only: true },
  });
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id) => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Notification marked as read'
    };
  }

  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  if (USE_MOCKS) {
    return {
      success: true,
      message: 'Notifications marked as read',
    };
  }

  const response = await api.patch('/notifications/read-all');
  return response.data;
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    return {
      success: true,
      message: 'Notification deleted'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};
