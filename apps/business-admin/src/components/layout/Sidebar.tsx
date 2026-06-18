'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBusiness } from '../../hooks/useBusiness';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useBusiness();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Календарь',
      href: '/calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="4" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    },
    {
      name: 'Записи',
      href: '/bookings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
        </svg>
      )
    },
    {
      name: 'Клиенты',
      href: '/clients',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
        </svg>
      )
    },
    {
      name: 'Рассылка',
      href: '/newsletter',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      name: 'Мастера',
      href: '/masters',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path strokeLinecap="round" d="M9 12h6M12 12v-4m0 4v4" />
        </svg>
      )
    },
    {
      name: 'Услуги',
      href: '/services',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
        </svg>
      )
    },
    {
      name: 'График',
      href: '/schedule',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      )
    },
    {
      name: 'Отзывы',
      href: '/reviews',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },

    {
      name: 'Mini App',
      href: '/miniapp-settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 2-1 4-4 4 3 0 4 2 4 4 0-2 1-4 4-4-3 0-4-2-4-4zm6 11c0 1.5-.75 3-3 3 2.25 0 3 1.5 3 3 0-1.5.75-3 3-3-2.25 0-3-1.5-3-3z" />
        </svg>
      )
    },
    {
      name: 'Настройки',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <ellipse cx="12" cy="6" rx="6" ry="3" />
          <path d="M6 6v6c0 1.66 2.69 3 6 3s6-1.34 6-3V6" />
          <circle cx="12" cy="18" r="2" />
          <path strokeLinecap="round" d="M12 15v1" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1.5px] z-30 xl:hidden animate-in fade-in duration-300"
        />
      )}
      <aside className={`fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200/80 flex flex-col justify-between z-40 xl:z-30 select-none shadow-none transition-transform duration-300 ease-out xl:translate-x-0 xl:w-[240px] w-[260px] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-[72px] px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/b-orange.svg" alt="B" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-2xl text-slate-800 tracking-tight font-evolventa lowercase">
              bronly<span className="text-[#ff5a1f]">.</span>
            </span>
          </div>
          {/* Close button for mobile menu */}
          <button 
            onClick={onClose}
            className="xl:hidden w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-655 flex items-center justify-center transition-colors cursor-pointer border border-slate-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>




        {/* Nav Links Stack (Extremely compact and beautiful) */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 select-none border ${
                  isActive
                    ? 'bg-orange-50 text-[#ff5a1f] border-orange-100/60 font-extrabold'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'text-[#ff5a1f]' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="font-evolventa text-xs font-semibold">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Block (Matches layout bottom from image) */}
      <div className="p-4 bg-slate-50/30">
        <div 
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-between p-1.5 cursor-pointer hover:bg-slate-100/60 rounded-xl transition-all duration-200 active:scale-97 select-none"
          title="Выйти из системы"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with live green status dot */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-sm text-[#ff5a1f] font-evolventa select-none">
                {settings.ownerName ? settings.ownerName.trim().charAt(0).toUpperCase() : 'А'}
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            {/* User detail info */}
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] font-bold text-slate-800 truncate font-evolventa">
                {settings.ownerName || 'Администратор'}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                {settings.ownerEmail || 'elite@bronly.uz'}
              </span>
            </div>
          </div>
          {/* Sign-out Icon */}
          <svg className="w-4 h-4 text-slate-400 shrink-0 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
      </div>
    </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-[100] flex items-center justify-center select-none"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-[340px] mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h3 className="text-center font-extrabold text-slate-800 text-[16px] font-evolventa mb-1">Выйти из системы?</h3>
            <p className="text-center text-[12px] text-slate-400 font-medium mb-6 leading-relaxed">
              Вы уверены, что хотите выйти из<br/>панели управления?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[13px] font-evolventa transition-all active:scale-95"
              >
                Отмена
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('business_admin_logged_in');
                  router.push('/login');
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[13px] font-evolventa transition-all active:scale-95"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Sidebar;
