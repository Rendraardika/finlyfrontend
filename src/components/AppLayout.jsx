import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/useNotification';
import useClickOutside from '../hooks/useClickOutside';
import { 
  LayoutDashboard, ArrowLeftRight, Wallet, TrendingUp, User, 
  Bell, LogOut, Check
} from 'lucide-react';

import logoFinly from '../assets/logo-finly.svg';

function SidebarItem({ icon, label, active, href = '#' }) {
  return (
    <Link to={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      active ? 'bg-[#EAF6ED] dark:bg-[#05A845]/10 text-[#05A845] font-semibold' : 'text-[#666666] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-[#1A1A1A] dark:hover:text-white font-medium'
    }`}>
      {icon}
      <span className="text-[14px]">{label}</span>
    </Link>
  );
}

function BottomNavItem({ icon, label, active, href = '#' }) {
  return (
    <Link to={href} className={`flex flex-col items-center justify-center w-full gap-1 transition-colors ${active ? 'text-[#05A845]' : 'text-gray-400 dark:text-gray-500 hover:text-[#1A1A1A] dark:hover:text-white'}`}>
      <div className={`${active ? 'bg-[#EAF6ED] dark:bg-[#05A845]/10 px-4 py-1 rounded-full' : 'py-1'} transition-all flex items-center justify-center`}>
        {icon}
      </div>
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </Link>
  );
}

export default function AppLayout({ children, activeMenu = 'dashboard' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markAllAsRead, markOneAsRead, hasUnread } = useNotification();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    if(logout) logout();
    navigate('/login');
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'User';
  const notificationButtonClass = isNotifOpen
    ? 'bg-[#EAF6ED] dark:bg-[#05A845]/15 border-[#05A845]/30 text-[#05A845] dark:text-[#2ee879] ring-2 ring-[#05A845]/15 dark:ring-[#05A845]/20 shadow-sm'
    : 'bg-white/80 dark:bg-white/[0.04] border-gray-100 dark:border-[#2e303a] text-gray-500 dark:text-gray-400 hover:border-[#05A845]/30 hover:text-[#05A845] dark:hover:text-[#2ee879]';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', savedTheme);
    }
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    document.documentElement.style.colorScheme = savedTheme;
  }, []);

  useClickOutside(notifRef, () => setIsNotifOpen(false), isNotifOpen);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#161616] flex font-sans flex-col transition-colors duration-300">
      <aside className="w-64 bg-white dark:bg-[#1f2028] border-r border-gray-100 dark:border-[#2e303a] hidden md:flex flex-col fixed h-full z-50 transition-colors duration-300">
        <div className="p-8 pb-6">
          <img src={logoFinly} alt="Finly Logo" className="h-14 w-auto object-contain" />
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/dashboard" active={activeMenu === 'dashboard'} />
          <SidebarItem icon={<ArrowLeftRight size={20} />} label="Transaksi" href="/transaksi" active={activeMenu === 'transaksi'} />
          <SidebarItem icon={<Wallet size={20} />} label="Anggaran" href="/anggaran" active={activeMenu === 'anggaran'} />
          <SidebarItem icon={<TrendingUp size={20} />} label="Investasi" href="/investasi" active={activeMenu === 'investasi'} />
          <SidebarItem icon={<User size={20} />} label="Profil" href="/profile" active={activeMenu === 'profil'} />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <header className="bg-[#F8F9FA]/95 dark:bg-[#161616]/95 backdrop-blur sticky top-0 z-50 px-4 sm:px-8 py-4 sm:py-5 flex justify-end items-center transition-colors duration-300">
          <div className="flex items-center gap-2 sm:gap-4">
            
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                aria-label="Buka notifikasi"
                aria-expanded={isNotifOpen}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-full border transition-all ${notificationButtonClass}`}
              >
                <Bell size={22} />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#F8F9FA] dark:border-[#161616] rounded-full"></span>
                )}
              </button>
              {isNotifOpen && (
                <div className="fixed left-1/2 top-[72px] w-[calc(100vw-2rem)] max-w-[360px] -translate-x-1/2 bg-white dark:bg-[#1f2028] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2e303a] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[360px] sm:translate-x-0 sm:origin-top-right">
                  <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#1f2028]">
                    <h3 className="font-bold text-[#1A1A1A] dark:text-white text-[16px]">Notifikasi</h3>
                    <button onClick={markAllAsRead} className="text-[#05A845] text-[12px] font-semibold flex items-center gap-1 hover:text-[#048A38] transition-colors shrink-0">
                      <Check size={14} /> Tandai dibaca
                    </button>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => markOneAsRead(notif.id)}
                        className={`w-full text-left px-4 py-3.5 flex gap-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative ${
                          notif.unread
                            ? 'bg-[#EAF6ED]/60 dark:bg-[#05A845]/10'
                            : 'bg-white dark:bg-[#1f2028]'
                        }`}
                      >
                        {notif.unread && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#05A845] rounded-full"></div>}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.bgIcon}`}>{notif.icon}</div>
                        <div className="min-w-0">
                          <h4 className={`text-[13px] mb-1 break-words ${notif.unread ? 'font-bold text-[#1A1A1A] dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>{notif.title}</h4>
                          <p className="text-[#666666] dark:text-gray-400 text-[13px] leading-relaxed mb-1.5 line-clamp-2 break-words">{notif.message}</p>
                          <span className="text-gray-400 text-[11px] font-medium">{notif.time}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate('/notifikasi');
                      }}
                      className="text-[#666666] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white text-[13px] font-semibold transition-colors"
                    >
                      Lihat Semua Notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300 dark:border-gray-700 hover:ring-2 hover:ring-[#05A845] hover:border-transparent transition-all cursor-pointer block">
              <img src={`https://ui-avatars.com/api/?name=${firstName}&background=05A845&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              className="flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 font-medium text-[14px] transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>

        <footer className="w-full px-4 sm:px-8 py-6 text-[13px] text-[#666666] dark:text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-medium text-center md:text-left">© 2026 Finly. All rights reserved.</p>
          <div className="flex gap-6 font-medium">
            <Link to="/privasi" className="hover:text-[#05A845] transition-colors">Privacy</Link>
            <Link to="/syarat" className="hover:text-[#05A845] transition-colors">Terms</Link>
            <Link to="/kontak" className="hover:text-[#05A845] transition-colors">Contact</Link>
          </div>
        </footer>
      </main>
      
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#1f2028] border-t border-gray-100 dark:border-gray-800 flex justify-between items-center px-1 py-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[calc(0.5rem+env(safe-area-inset-bottom))] transition-colors duration-300">
        <BottomNavItem icon={<LayoutDashboard size={22} />} label="Home" href="/dashboard" active={activeMenu === 'dashboard'} />
        <BottomNavItem icon={<ArrowLeftRight size={22} />} label="Transaksi" href="/transaksi" active={activeMenu === 'transaksi'} />
        <BottomNavItem icon={<Wallet size={22} />} label="Anggaran" href="/anggaran" active={activeMenu === 'anggaran'} />
        <BottomNavItem icon={<TrendingUp size={22} />} label="Investasi" href="/investasi" active={activeMenu === 'investasi'} />
        <BottomNavItem icon={<User size={22} />} label="Profil" href="/profile" active={activeMenu === 'profil'} />
      </nav>
    </div>
  );
}
