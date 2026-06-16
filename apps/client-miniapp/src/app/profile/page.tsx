'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [clientName, setClientName] = useState('Гость');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('Elite Barber');
  const [address, setAddress] = useState('Не указан');
  const [phone, setPhone] = useState('Не указан');
  const [businessId, setBusinessId] = useState<string>('');
  const [clientPhotoUrl, setClientPhotoUrl] = useState<string>('');
  const [schedule, setSchedule] = useState<string>('');
  const [isScheduleExpanded, setIsScheduleExpanded] = useState<boolean>(false);
  const [isPageScheduleExpanded, setIsPageScheduleExpanded] = useState<boolean>(false);

  // Load client details and dynamic colors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Get business ID from params or localStorage
      const params = new URLSearchParams(window.location.search);
      let bId = params.get('business_id') || params.get('b');
      if (!bId) {
        bId = localStorage.getItem('last_business_id') || '';
      } else {
        bId = bId.replace(/[^a-zA-Z0-9_-]/g, '');
        localStorage.setItem('last_business_id', bId);
      }
      setBusinessId(bId);

      // 2. Get branding color and details from localStorage
      const savedMiniAppSettings = localStorage.getItem('mini_app_settings');
      const parsed = savedMiniAppSettings ? JSON.parse(savedMiniAppSettings) : null;
      const primaryColor = parsed?.primaryColor || '#ff5a1f';
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--primary-hover', primaryColor + 'cc');
      
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };
      if (primaryColor.startsWith('#') && primaryColor.length === 7) {
        document.documentElement.style.setProperty('--primary-glow', hexToRgba(primaryColor, 0.08));
        document.documentElement.style.setProperty('--primary-glow-ring', hexToRgba(primaryColor, 0.2));
      }

      if (parsed) {
        setBusinessName(parsed.name || 'Elite Barber');
        setAddress(parsed.address || 'Не указан');
        setPhone(parsed.phone || 'Не указан');
        setSchedule(parsed.schedule || '');
      }

      // 3. Load client details
      const name = localStorage.getItem('client_name') || 'Гость';
      const userPhone = localStorage.getItem('client_phone') || '';
      const photoUrl = localStorage.getItem('client_photo_url') || '';
      setClientName(name);
      setClientPhone(userPhone);
      setClientPhotoUrl(photoUrl);
    }
  }, []);

  // Fetch business details dynamically when businessId changes
  useEffect(() => {
    if (!businessId) return;
    const fetchBusinessDetails = async () => {
      try {
        const resBus = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}`);
        if (resBus.ok) {
          const dataBus = await resBus.json();
          setBusinessName(dataBus.name || 'Elite Barber');
          setAddress(dataBus.address || 'г. Ташкент, ул. Амира Темура, 45');
          setPhone(dataBus.phone || '+998 (90) 123-45-67');
          setSchedule(dataBus.schedule || '');

          // Dynamically apply primary color branding
          const primaryColor = dataBus.primary_color || '#ff5a1f';
          document.documentElement.style.setProperty('--primary', primaryColor);
          document.documentElement.style.setProperty('--primary-hover', primaryColor + 'cc');
          
          const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };
          if (primaryColor.startsWith('#') && primaryColor.length === 7) {
            document.documentElement.style.setProperty('--primary-glow', hexToRgba(primaryColor, 0.08));
            document.documentElement.style.setProperty('--primary-glow-ring', hexToRgba(primaryColor, 0.2));
          }

          // Cache in localStorage
          localStorage.setItem('mini_app_settings', JSON.stringify({
            primaryColor: dataBus.primary_color || '#ff5a1f',
            name: dataBus.name || 'Elite Barber',
            logo: dataBus.logo || 'EB',
            coverImage: dataBus.cover_image || '',
            phone: dataBus.phone || '',
            address: dataBus.address || '',
            telegram: dataBus.telegram || '',
            instagram: dataBus.instagram || '',
            schedule: dataBus.schedule || ''
          }));
        }
      } catch (err) {
        console.error('Failed to fetch business details for profile:', err);
      }
    };
    fetchBusinessDetails();
  }, [businessId]);

  const getWeekScheduleList = () => {
    if (schedule) {
      try {
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed) && parsed.length === 7) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { dayName: 'Понедельник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Вторник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Среда', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Четверг', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Пятница', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Суббота', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Воскресенье', isOpen: false, openTime: '10:00', closeTime: '18:00' }
    ];
  };

  const getTodayScheduleText = () => {
    const list = getWeekScheduleList();
    const now = new Date();
    const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const dayIndex = new Date(tashkentStr).getDay();
    const mapDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const today = list[mapDayIndex];
    if (today) {
      return today.isOpen ? `Сегодня работает до ${today.closeTime}` : 'Сегодня выходной';
    }
    return 'Режим работы не указан';
  };

  const getInitials = (name: string) => {
    if (!name) return 'К';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased pb-24 w-full relative overflow-hidden">
      
      <div className="flex-1 px-4 py-4.5 flex flex-col select-none relative bg-slate-50 pb-6">
        <h2 className="text-2xl font-black text-slate-800 font-evolventa mb-4 px-1 tracking-tight">Личный кабинет</h2>
        
        <div className="space-y-5">
          {/* Profile Info Card */}
          <div className="flex items-center gap-4 p-4 rounded-[24px] bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-left">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-lg font-black font-evolventa shadow-inner border border-white/50 shrink-0">
              {clientPhotoUrl ? (
                <img src={clientPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(clientName)
              )}
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-[16px] font-evolventa mb-0.5">
                {clientName}
              </h4>
              <p className="text-[12px] text-slate-500 font-bold leading-normal">
                {clientPhone || 'Номер телефона не привязан'}
              </p>
            </div>
          </div>

          {/* Working Hours Card */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] overflow-hidden shadow-none">
            <div 
              onClick={() => setIsPageScheduleExpanded(!isPageScheduleExpanded)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors active:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Режим работы</p>
                  <p className="text-[13px] font-black text-slate-800">
                    {getTodayScheduleText()}
                  </p>
                </div>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isPageScheduleExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded 7-day schedule */}
            {isPageScheduleExpanded && (
              <div className="px-4 pb-4 pt-1 space-y-2 select-none border-t border-slate-100/65 bg-slate-50/50">
                {getWeekScheduleList().map((d: any, index: number) => {
                  const now = new Date();
                  const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
                  const dayIndex = new Date(tashkentStr).getDay();
                  const mapDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                  const isToday = index === mapDayIndex;
                  return (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center text-xs p-1.5 rounded-lg transition-colors ${
                        isToday 
                          ? 'bg-[var(--primary)]/5 text-[var(--primary)] font-bold' 
                          : 'text-slate-650'
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        {d.dayName}
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                        )}
                      </span>
                      <span className={`font-black ${d.isOpen ? 'text-slate-800' : 'text-rose-500'}`}>
                        {d.isOpen ? `${d.openTime} - ${d.closeTime}` : 'Выходной'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings Links */}
          <div className="bg-white border border-slate-200/60 rounded-[24px] overflow-hidden">
            <div onClick={() => setIsAboutOpen(true)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100/80 active:bg-slate-100">
              <span className="font-extrabold text-[13px] text-slate-800 font-evolventa px-1">О салоне</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors active:bg-slate-100">
              <span className="font-extrabold text-[13px] text-slate-800 font-evolventa px-1">Язык приложения</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Русский</span>
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by Bronly Footer */}
      <div className="flex items-center justify-center gap-1.5 mt-auto pt-6 pb-6 opacity-40 select-none">
        <span className="text-[10px] font-bold text-slate-400 font-evolventa uppercase tracking-wider">Работает на</span>
        <img src="/b-orange.svg" alt="B" className="w-3.5 h-3.5 object-contain" />
        <span className="font-extrabold text-[13px] text-slate-750 tracking-tight font-evolventa lowercase">
          bronly<span className="text-[var(--primary)] font-black">.</span>
        </span>
      </div>

      {/* Floating Dynamic Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[280px] z-30 bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[24px] transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-2">
          <Link href={`/?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Запись</span>
          </Link>
          
          <Link href={`/history?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
            <div className="w-8 h-8 rounded-full flex items-center justify-center ">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">История</span>
          </Link>

          <Link href={`/profile?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-[var(--primary)]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Профиль</span>
          </Link>
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
              <h3 className="text-[18px] font-black text-slate-800 font-evolventa mb-1">{businessName}</h3>
              <p className="text-[12px] font-bold text-slate-400">Информация о салоне</p>
            </div>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Адрес</p>
                <p className="text-[13px] font-black text-slate-800">{address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Телефон</p>
                <a href={`tel:${phone}`} className="text-[13px] font-black text-slate-800">{phone}</a>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 border-t border-slate-100/60 pt-3">
              <div 
                onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Режим работы</p>
                    <p className="text-[13px] font-black text-slate-800">
                      {getTodayScheduleText()}
                    </p>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-slate-400 smooth-transition ${isScheduleExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded 7-day schedule */}
              {isScheduleExpanded && (
                <div className="pl-13 pr-2 py-2 space-y-2 select-none animate-fade-slide-up bg-slate-50/50 rounded-2xl border border-slate-100 p-3 mt-1">
                  {getWeekScheduleList().map((d: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">{d.dayName}</span>
                      <span className={`font-black ${d.isOpen ? 'text-slate-800' : 'text-rose-500'}`}>
                        {d.isOpen ? `${d.openTime} - ${d.closeTime}` : 'Выходной'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setIsAboutOpen(false)}
            className="w-full mt-6 py-3.5 rounded-[20px] bg-slate-900 text-white text-[14px] font-extrabold font-evolventa transition-all active:scale-95 shadow-md hover:bg-slate-800"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
