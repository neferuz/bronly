'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { useBusiness } from '../../hooks/useBusiness';

export interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const pathname = usePathname();
  const { settings } = useBusiness();

  // Resolve titles based on active route
  const getPageTitle = (path: string | null) => {
    if (!path) return 'Панель управления';
    if (path.startsWith('/dashboard')) return 'Обзор бизнеса';
    if (path.startsWith('/calendar')) return 'Календарь записей';
    if (path.startsWith('/bookings')) return 'Журнал записей';
    if (path.startsWith('/clients')) return 'Клиентская база';
    if (path.startsWith('/masters')) return 'Сотрудники / Мастера';
    if (path.startsWith('/services')) return 'Услуги и цены';
    if (path.startsWith('/schedule')) return 'График работы';
    if (path.startsWith('/miniapp-settings')) return 'Настройка Mini App';
    if (path.startsWith('/settings')) return 'Настройки филиала';
    return 'Панель управления';
  };

  // Resolve dynamic subtitle descriptions
  const getPageDesc = (path: string | null) => {
    if (!path) return 'Синхронизация данных активна.';
    if (path.startsWith('/dashboard')) return 'Синхронизация расписания и моментальных записей с Telegram Mini App активна.';
    if (path.startsWith('/calendar')) return 'Управление бронированиями, добавление новых визитов и контроль смен.';
    if (path.startsWith('/bookings')) return 'История и детальная аналитика всех записей клиентов.';
    if (path.startsWith('/clients')) return 'База клиентов филиала с контактными данными и статистикой посещений.';
    if (path.startsWith('/masters')) return 'Список мастеров филиала, рабочие графики и загрузка.';
    if (path.startsWith('/services')) return 'Список предоставляемых услуг, категории, цены и длительность.';
    if (path.startsWith('/schedule')) return 'Настройка регулярных рабочих смен и расписания.';
    if (path.startsWith('/miniapp-settings')) return 'Кастомизация дизайна и настроек Telegram Mini App.';
    if (path.startsWith('/settings')) return 'Общие параметры и настройки автоматизации бизнеса.';
    return 'Синхронизация данных активна.';
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-4 xl:px-6 pt-4 xl:pt-6 pb-2 select-none">
      <div className="bg-white rounded-3xl p-4 xl:py-3 xl:px-5 flex items-center justify-between gap-3 xl:gap-4 h-16 border border-slate-200/50">
        
        {/* Left Section (Mobile/Tablet): Burger Button */}
        <button
          onClick={onOpenSidebar}
          className="xl:hidden w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700 smooth-transition cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Left Section: Brand Logo & Breadcrumbs (Desktop) */}
        <div className="hidden xl:flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#d5f27f]/30 border border-[#d5f27f]/60 flex items-center justify-center text-slate-800 font-extrabold text-sm shrink-0 font-evolventa">
            {settings.name ? settings.name[0].toUpperCase() : 'E'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight font-evolventa truncate max-w-[140px]" title={settings.name}>
                {settings.name}
              </h2>
              <span className="text-slate-300 text-xs font-bold font-evolventa">/</span>
              <span className="text-xs font-bold text-[#ff5a1f] font-evolventa truncate max-w-[120px]" title={getPageTitle(pathname)}>
                {getPageTitle(pathname)}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium font-evolventa truncate max-w-[320px] hidden xl:block">
              {getPageDesc(pathname)}
            </p>
          </div>
        </div>

        {/* Middle Section: Logo (Mobile/Tablet) */}
        <div className="xl:hidden flex items-center gap-1.5 select-none shrink-0">
          <img src="/b-orange.svg" alt="B" className="w-5 h-5 object-contain" />
          <span className="font-extrabold text-lg text-slate-800 tracking-tight font-evolventa lowercase">
            bronly<span className="text-[#ff5a1f]">.</span>
          </span>
        </div>

        {/* Right Section: Launcher & Profile Card */}
        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
          {/* User Profile avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 font-evolventa leading-none">
                {settings.ownerName || 'Администратор'}
              </span>
              <span className="text-[9px] text-slate-400 font-medium font-evolventa mt-1">Владелец филиала</span>
            </div>
            {/* Flat premium avatar wrapper (no shadows, no glows) */}
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-655 font-evolventa select-none">
              {settings.ownerName ? settings.ownerName.trim().charAt(0).toUpperCase() : 'А'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
