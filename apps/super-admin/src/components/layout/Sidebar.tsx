'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('super_admin_logged_in');
    router.push('/login');
  };

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
      name: 'Салоны / Бизнесы',
      href: '/businesses',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      name: 'Системные настройки',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    }
  ];


  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-slate-200/80 flex flex-col justify-between z-30 select-none shadow-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-[72px] px-6 flex items-center gap-2">
          <img src="/b-orange.svg" alt="B" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight font-evolventa lowercase">
            bronly<span className="text-[#ff5a1f]">.</span>hq
          </span>
        </div>

        {/* Workspace Dropdown Panel */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 border border-slate-200/50 cursor-pointer hover:bg-slate-100 smooth-transition">
            <div className="flex items-center gap-3">
              <img src="/b-orange.svg" alt="B" className="w-8 h-8 object-contain shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px] font-evolventa">
                  Bronly HQ
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wide">
                  Super Admin Panel
                </span>
              </div>
            </div>
            {/* dropdown arrow icon */}
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Nav Links Stack */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 select-none border ${
                  isActive
                    ? 'bg-orange-50 text-[#ff5a1f] border-orange-100/60 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
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

      {/* Footer Profile Block */}
      <div className="p-4 bg-slate-50/30">
        <div className="flex items-center justify-between p-1.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with live green status dot */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-sm text-[#ff5a1f] font-evolventa select-none">
                S
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            {/* User detail info */}
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] font-bold text-slate-800 truncate font-evolventa">
                Супер-Админ
              </span>
              <span className="text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                notferuz@gmail.com
              </span>
            </div>
          </div>
          {/* logout button */}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Выйти из системы"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Modal Card */}
          <div className="bg-white rounded-3xl border border-slate-250/80 shadow-2xl p-6 w-full max-w-[340px] relative z-10 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center gap-4">
            {/* Warning Sign */}
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100/60 shadow-md shadow-orange-100/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-1">
              <h4 className="font-extrabold text-sm text-slate-800 font-evolventa">
                Выйти из аккаунта?
              </h4>
              <p className="text-[11px] font-bold text-slate-400 leading-normal font-evolventa">
                Вы уверены, что хотите выйти из панели суперадминистратора?
              </p>
            </div>

            <div className="flex gap-2.5 w-full mt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs font-evolventa transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-orange-600 text-white font-bold text-xs font-evolventa transition-all cursor-pointer shadow-lg shadow-[#ff5a1f]/15"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
