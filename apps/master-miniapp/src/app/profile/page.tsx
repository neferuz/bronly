'use client';

import React, { useState, useMemo, useEffect } from 'react';
import BottomNav from '../../components/layout/BottomNav';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Master {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  isActive: boolean;
  services: string[];
  telegramId?: string | null;
}

interface Business {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  schedule?: string | null;
  commissionRate?: number;
}

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MasterProfilePage() {
  const [businessId, setBusinessId] = useState<string>('');
  const [masterId, setMasterId] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');

  const [currentMaster, setCurrentMaster] = useState<Master | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load context from localStorage or query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qB = params.get('b') || params.get('business_id');
    const qM = params.get('m') || params.get('master_id');
    const qTg = params.get('tg_id') || params.get('telegram_id');

    const b = qB || localStorage.getItem('master_business_id') || '';
    const m = qM || localStorage.getItem('master_id') || '';
    const tg = qTg || localStorage.getItem('master_telegram_id') || '';

    setBusinessId(b);
    setMasterId(m);
    setTelegramId(tg);

    if (b) localStorage.setItem('master_business_id', b);
    if (m) localStorage.setItem('master_id', m);
    if (tg) localStorage.setItem('master_telegram_id', tg);
  }, []);

  // 2. Fetch master, business, and services info
  const loadData = async () => {
    if (!businessId || !masterId || !telegramId) return;
    setIsLoading(true);
    try {
      // Fetch master details
      const mRes = await fetch(`${API_HOST}/api/v1/public/masters/verify?business_id=${businessId}&master_id=${masterId}&telegram_id=${telegramId}`);
      if (mRes.ok) {
        const data = await mRes.json();
        if (data.master) {
          const m = data.master;
          setCurrentMaster({
            id: m.id,
            name: m.name,
            avatar: m.avatar || '',
            phone: m.phone || '',
            rating: m.rating || 5.0,
            isActive: m.is_active,
            services: m.services || [],
            telegramId: m.telegram_id
          });
        }
      }

      // Fetch business details
      const bRes = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}`);
      if (bRes.ok) {
        const data = await bRes.json();
        setBusiness({
          id: data.id,
          name: data.name,
          address: data.address,
          phone: data.phone,
          schedule: data.schedule,
          commissionRate: data.commission_rate
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId && masterId && telegramId) {
      loadData();
    }
  }, [businessId, masterId, telegramId]);

  // 3. Toggle master status
  const toggleMasterActive = async () => {
    if (!currentMaster || !masterId || !telegramId) return;
    const nextStatus = !currentMaster.isActive;
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/masters/${masterId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: nextStatus,
          telegram_id: telegramId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentMaster(prev => prev ? { ...prev, isActive: data.is_active } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Parse schedule JSON
  const parsedSchedule = useMemo(() => {
    if (!business?.schedule) return [];
    try {
      return JSON.parse(business.schedule);
    } catch (err) {
      console.error('Error parsing business schedule:', err);
      return [];
    }
  }, [business?.schedule]);

  // --- RENDER STATES ---

  if (!businessId || !masterId) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f] mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-black font-evolventa mb-2">Авторизация не найдена</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Пожалуйста, вернитесь на главную страницу и откройте кабинет через Telegram-бота.
        </p>
      </div>
    );
  }

  if (isLoading || !currentMaster) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6">
        <div className="w-10 h-10 border-4 border-t-[#ff5a1f] border-slate-700 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-evolventa">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans select-none antialiased w-full relative overflow-hidden">
      
      {/* Top Header Section */}
      <div className="bg-slate-900 text-white px-5 pt-4 pb-5 rounded-b-[32px] shadow-none flex flex-col gap-3 sticky top-0 z-30 shrink-0 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-md border border-orange-100 p-1.5 shrink-0">
              <img src="/b-orange.svg" alt="B" className="w-full h-full object-contain" />
            </div>
            <span className="text-[12px] font-black tracking-widest uppercase text-slate-400 font-evolventa">
              Bronly Master
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 rounded-full select-none">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-evolventa">
              Кабинет мастера
            </span>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-center justify-between gap-3 bg-slate-800/50 border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              {currentMaster.avatar && (currentMaster.avatar.startsWith('http') || currentMaster.avatar.startsWith('data:') || currentMaster.avatar.startsWith('/')) ? (
                <img
                  src={currentMaster.avatar}
                  alt={currentMaster.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-750 shadow-inner"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-700 text-[#ff5a1f] flex items-center justify-center font-bold text-base border border-slate-650 shadow-inner font-evolventa">
                  {currentMaster.avatar || currentMaster.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${currentMaster.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            </div>

            {/* Profile Info */}
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[15px] font-black text-white font-evolventa truncate">
                {currentMaster.name}
              </span>
              
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span>{currentMaster.rating}</span>
                </div>
                {currentMaster.phone && (
                  <>
                    <span className="text-[10px] text-slate-500 font-bold">•</span>
                    <span className="text-[10px] text-slate-500 font-bold truncate">{currentMaster.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* On Duty button */}
          <button
            onClick={toggleMasterActive}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase font-evolventa transition-all active:scale-95 border cursor-pointer ${
              currentMaster.isActive
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-700/30 border-slate-700 text-slate-400'
            }`}
          >
            {currentMaster.isActive ? 'В сети' : 'Не в сети'}
          </button>
        </div>
      </div>

      {/* Main Content Settings */}
      <div className="flex-1 overflow-y-auto px-4 py-4.5 flex flex-col gap-4 select-none bg-slate-50 pb-28">

        {/* Loyalty & Status Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white border border-slate-200/60 rounded-[24px] text-left">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-widest mb-1.5">Статус на работе</span>
            <button
              onClick={toggleMasterActive}
              className={`text-[13px] font-black font-evolventa block transition-all cursor-pointer ${
                currentMaster.isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {currentMaster.isActive ? 'Принимаю записи' : 'Отдыхаю'}
            </button>
          </div>
          <div className="p-4 bg-white border border-slate-200/60 rounded-[24px] text-left">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-widest mb-1.5">Ставка комиссии</span>
            <span className="text-[14px] font-black text-slate-800 font-evolventa block">
              {business?.commissionRate || 30} % от услуг
            </span>
          </div>
        </div>

        {/* Settings list */}
        <div className="bg-white border border-slate-200/60 rounded-[24px] overflow-hidden">
          
          {/* About Salon */}
          <div onClick={() => setIsAboutOpen(true)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100/80 active:bg-slate-100">
            <span className="font-extrabold text-[13px] text-slate-800 font-evolventa px-1">О салоне</span>
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </div>

          {/* Language Preference */}
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors active:bg-slate-100">
            <span className="font-extrabold text-[13px] text-slate-800 font-evolventa px-1">Язык приложения</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Русский</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* About Salon Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 flex flex-col justify-end select-none transition-all duration-300 ${
          isAboutOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsAboutOpen(false)}
      >
        <div 
          className={`bg-white/95 backdrop-blur-xl w-full max-w-md mx-auto rounded-t-[32px] p-6 pb-12 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border-t border-white/50 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isAboutOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto mb-6" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[18px] font-black text-slate-800 font-evolventa mb-1">{business?.name || 'Салон'}</h3>
              <p className="text-[12px] font-bold text-slate-400">Премиальный мужской салон</p>
            </div>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {business?.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff5a1f]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Адрес</p>
                  <p className="text-[13px] font-black text-slate-800">{business.address}</p>
                </div>
              </div>
            )}

            {business?.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff5a1f]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Телефон</p>
                  <a href={`tel:${business.phone}`} className="text-[13px] font-black text-slate-800">{business.phone}</a>
                </div>
              </div>
            )}
            
            {/* Parsed Schedule List */}
            {parsedSchedule.length > 0 ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-left">Режим работы</p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1.5 text-xs font-semibold text-slate-650 text-left">
                  {parsedSchedule.map((day: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{day.dayName}</span>
                      <span className="font-black text-slate-800">
                        {day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Выходной'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : business?.schedule ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#ff5a1f]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Режим работы</p>
                  <p className="text-[13px] font-black text-slate-800">{business.schedule}</p>
                </div>
              </div>
            ) : null}
          </div>
          
          <button 
            onClick={() => setIsAboutOpen(false)}
            className="w-full mt-6 py-3.5 rounded-[20px] bg-slate-900 text-white text-[13px] font-extrabold font-evolventa tracking-wider uppercase transition-all active:scale-95 shadow-md hover:bg-slate-800 cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
