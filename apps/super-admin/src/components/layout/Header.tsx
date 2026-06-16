'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const adminKey = process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || 'bronly-hq-secret-2026';
        const res = await fetch(`${apiHost}/api/v1/super-admin/server/status`, {
          headers: { 'X-Admin-Key': adminKey }
        });

        if (res.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (path: string | null) => {
    if (!path) return 'Панель управления';
    if (path.startsWith('/dashboard')) return 'Обзор платформы';
    if (path.startsWith('/businesses')) return 'Салоны / Бизнесы';
    if (path.startsWith('/settings')) return 'Системные настройки';
    return 'Панель управления';
  };

  const getPageDesc = (path: string | null) => {
    if (!path) return 'Системные сервисы активны.';
    if (path.startsWith('/dashboard')) return 'Сводная аналитика активности, регистраций и сессий в системе Bronly.';
    if (path.startsWith('/businesses')) return 'Реестр зарегистрированных бизнесов, управление их статусом и Telegram-ботами.';
    if (path.startsWith('/settings')) return 'Контроль параметров обслуживания, резервных копий, логов и состояния API.';
    return 'Системные сервисы активны.';
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-6 pt-6 pb-2 select-none">
      <div className="bg-white rounded-3xl p-4 md:py-3 md:px-5 flex items-center justify-between gap-4 h-16 border border-slate-200/80">
        {/* Left Section: Breadcrumbs & Status */}
        <div className="flex items-center gap-3">
          <img src="/b-orange.svg" alt="Bronly Logo" className="w-10 h-10 object-contain shrink-0" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight font-evolventa">
                Bronly HQ
              </h2>
              <span className="text-slate-300 text-xs font-bold font-evolventa">/</span>
              <span className="text-xs font-bold text-[#ff5a1f] font-evolventa">
                {getPageTitle(pathname)}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium font-evolventa">
              {getPageDesc(pathname)}
            </p>
          </div>
        </div>

        {/* Right Section: System Actions & Info */}
        <div className="flex items-center gap-4">
          {isOnline === null ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-slate-50 border border-slate-200/60 text-slate-400 font-evolventa">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Проверка систем...
            </div>
          ) : isOnline ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-600 font-evolventa">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Все системы в норме
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-rose-50 border border-rose-100 text-rose-600 font-evolventa animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Ошибка подключения к API
            </div>
          )}

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 font-evolventa leading-none">Супер-Админ</span>
              <span className="text-[9px] text-slate-400 font-medium font-evolventa mt-1">Главный менеджер</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-slate-600 font-evolventa shadow-inner select-none">
              S
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
