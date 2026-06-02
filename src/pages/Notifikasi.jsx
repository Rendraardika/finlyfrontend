import React, { useState } from 'react';
import { Check, Bell } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useNotification } from '../context/useNotification';

export default function Notifikasi() {
  const { notifications, markAllAsRead, markOneAsRead, unreadCount } = useNotification();
  const [activeFilter, setActiveFilter] = useState('semua');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'belum-dibaca') return notif.unread;
    return true;
  });

  return (
    <AppLayout activeMenu="notifikasi">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-bold page-title mb-1 break-words">
              Notifikasi
            </h1>
            <p className="page-subtitle text-[14px] sm:text-[15px] break-words">
              Lihat semua pengingat, insight, dan aktivitas terbaru akunmu.
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#05A845] text-white font-semibold text-[14px] hover:bg-[#048A38] transition-colors shadow-sm w-full md:w-auto"
          >
            <Check size={16} />
            Tandai Semua Dibaca
          </button>
        </div>

        <div className="app-card rounded-[24px] overflow-hidden bg-white dark:bg-[#1f2028] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-bold text-[#1A1A1A] dark:text-white break-words">
                  Pusat Notifikasi
                </h2>
                <p className="text-[13px] text-gray-500 break-words">
                  {unreadCount} notifikasi belum dibaca
                </p>
              </div>
            </div>

            <div className="flex p-1 bg-gray-50 dark:bg-[#161616] rounded-xl w-full sm:w-auto overflow-x-auto hide-scrollbar border border-gray-100 dark:border-[#2e303a]">
              <button
                onClick={() => setActiveFilter('semua')}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'semua'
                    ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845] dark:text-[#2ee879] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveFilter('belum-dibaca')}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                  activeFilter === 'belum-dibaca'
                    ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 text-[#05A845] dark:text-[#2ee879] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[#05A845]'
                }`}
              >
                Belum Dibaca
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-[#2e303a]">
            {filteredNotifications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-[14px] text-gray-500">
                  Tidak ada notifikasi untuk filter ini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markOneAsRead(notif.id)}
                  className={`w-full text-left p-4 sm:p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative ${
                    notif.unread
                      ? 'bg-[#EAF6ED]/55 dark:bg-[#05A845]/10'
                      : 'bg-transparent'
                  }`}
                >
                  {notif.unread && (
                    <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#05A845] rounded-full" />
                  )}

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${notif.bgIcon}`}>
                    {notif.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <h3 className={`text-[14px] sm:text-[15px] break-words ${
                        notif.unread
                          ? 'font-bold text-[#1A1A1A] dark:text-white'
                          : 'font-semibold text-gray-700 dark:text-gray-300'
                      }`}>
                        {notif.title}
                      </h3>
                      <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium shrink-0">
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-[#666666] dark:text-gray-400 text-[13px] leading-relaxed break-words">
                      {notif.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
