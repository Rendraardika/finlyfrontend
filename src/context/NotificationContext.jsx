import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, CheckCircle2, Receipt, CreditCard } from 'lucide-react';
import { mockNotifications } from '../services/mockData';
import { NotificationContext } from './notificationContextValue';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';

const notificationStyleByType = {
  alert: {
    icon: <AlertCircle size={18} className="text-orange-500" />,
    bgIcon: 'bg-orange-50 dark:bg-orange-500/10',
  },
  insight: {
    icon: <TrendingUp size={18} className="text-[#05A845]" />,
    bgIcon: 'bg-[#EAF6ED] dark:bg-[#05A845]/10',
  },
  success: {
    icon: <CheckCircle2 size={18} className="text-blue-500" />,
    bgIcon: 'bg-blue-50 dark:bg-blue-500/10',
  },
  budget_alert: {
    icon: <AlertCircle size={18} className="text-orange-500" />,
    bgIcon: 'bg-orange-50 dark:bg-orange-500/10',
  },
  bill: {
    icon: <Receipt size={18} className="text-[#05A845]" />,
    bgIcon: 'bg-[#EAF6ED] dark:bg-[#05A845]/10',
  },
  debt: {
    icon: <CreditCard size={18} className="text-red-500" />,
    bgIcon: 'bg-red-50 dark:bg-red-500/10',
  },
  transaction: {
    icon: <CheckCircle2 size={18} className="text-blue-500" />,
    bgIcon: 'bg-blue-50 dark:bg-blue-500/10',
  },
};

const formatNotificationTime = (value) => {
  if (!value) return 'Baru saja';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Baru saja';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const normalizeNotification = (notification) => {
  const type = notification.type || notification.notification_type || 'insight';
  return {
    id: notification.id || Date.now(),
    type,
    title: notification.title || 'Notifikasi',
    message: notification.message || '',
    time: notification.time || formatNotificationTime(notification.created_at),
    unread: notification.unread ?? !notification.is_read,
    ...(notificationStyleByType[type] || notificationStyleByType.insight),
    ...notification,
  };
};

const initialNotifications = [];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await getNotifications();
      const items = response?.data?.notifications || response?.data?.items || response?.data || [];
      if (Array.isArray(items)) {
        setNotifications(items.map(normalizeNotification));
      }
    } catch (_error) {
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = useCallback((notification) => {
    const styledNotification = {
      id: notification.id || Date.now(),
      time: notification.time || 'Baru saja',
      unread: notification.unread ?? true,
      ...normalizeNotification(notification),
    };

    setNotifications((prev) => [styledNotification, ...prev]);
  }, []);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, unread: false })));
    try {
      await markAllNotificationsAsRead();
    } catch (_error) {
    }
  };

  const markOneAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, unread: false } : notif))
    );
    try {
      await markNotificationAsRead(id);
    } catch (_error) {
    }
  };

  const unreadCount = notifications.filter((notif) => notif.unread).length;
  const hasUnread = unreadCount > 0;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, markOneAsRead, refreshNotifications, unreadCount, hasUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}
