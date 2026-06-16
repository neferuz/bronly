'use client';

import React, { useState, useMemo, useEffect } from 'react';
import BottomNav from '../components/layout/BottomNav';

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
  telegramId?: string | null;
}

interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientTelegramId?: string;
  masterId: string;
  serviceName: string;
  duration: number;
  date: string;
  time: string;
  status: 'new' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';
  price: number;
  comment?: string;
}

const getTashkentDateStr = () => {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
};

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MasterDashboard() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'link_required' | 'unauthorized' | 'no_params' | 'success'>('loading');
  const [businessId, setBusinessId] = useState<string>('');
  const [masterId, setMasterId] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [currentMaster, setCurrentMaster] = useState<Master | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Initialize Tashkent Date
  useEffect(() => {
    setSelectedDate(getTashkentDateStr());
  }, []);

  // 1. Detect Telegram / Query Params & Verify Access
  useEffect(() => {
    const initAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const qB = params.get('b') || params.get('business_id');
        const qM = params.get('m') || params.get('master_id');
        const qTg = params.get('tg_id') || params.get('telegram_id');

        const tg = (window as any).Telegram?.WebApp;
        let tgStartParam = '';
        let tgUserId = '';
        
        if (tg) {
          tg.ready();
          tg.expand();
          tgStartParam = tg.initDataUnsafe?.start_param || '';
          if (tg.initDataUnsafe?.user) {
            tgUserId = String(tg.initDataUnsafe.user.id);
          }
        }

        let finalB = qB || '';
        let finalM = qM || '';
        let finalTg = qTg || tgUserId || '';

        if (tgStartParam) {
          const parts = tgStartParam.split('_');
          if (parts.length >= 2) {
            finalM = parts[parts.length - 1];
            finalB = parts.slice(0, -1).join('_');
          }
        }

        if (!finalB) finalB = localStorage.getItem('master_business_id') || '';
        if (!finalM) finalM = localStorage.getItem('master_id') || '';
        if (!finalTg) finalTg = localStorage.getItem('master_telegram_id') || '';

        if (!finalB || !finalM) {
          setAuthStatus('no_params');
          return;
        }

        setBusinessId(finalB);
        setMasterId(finalM);
        setTelegramId(finalTg);

        localStorage.setItem('master_business_id', finalB);
        localStorage.setItem('master_id', finalM);
        if (finalTg) localStorage.setItem('master_telegram_id', finalTg);

        // Fetch verify status
        const url = `${API_HOST}/api/v1/public/masters/verify?business_id=${finalB}&master_id=${finalM}&telegram_id=${finalTg}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          if (res.status === 404) {
            setErrorMessage('Профиль мастера не найден в системе.');
            setAuthStatus('unauthorized');
          } else {
            setErrorMessage('Ошибка сервера при проверке доступа.');
            setAuthStatus('unauthorized');
          }
          return;
        }

        const data = await res.json();
        
        if (data.master) {
          const m = data.master;
          setCurrentMaster({
            id: m.id,
            name: m.name,
            avatar: m.avatar || '',
            phone: m.phone || '',
            rating: m.rating || 5.0,
            isActive: m.is_active,
            telegramId: m.telegram_id
          });
        }

        if (data.status === 'link_required') {
          if (!finalTg) {
            setErrorMessage('Для привязки кабинета откройте его внутри Telegram.');
            setAuthStatus('unauthorized');
          } else {
            setAuthStatus('link_required');
          }
        } else if (data.status === 'success') {
          setAuthStatus('success');
        } else {
          setErrorMessage(data.message || 'Доступ к кабинету ограничен.');
          setAuthStatus('unauthorized');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Не удалось связаться с сервером.');
        setAuthStatus('unauthorized');
      }
    };

    initAuth();
  }, []);

  // 2. Fetch Master Services & Bookings on verification success
  const fetchServices = async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}/services`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        }));
        setServices(mapped);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchBookings = async (dateStr: string) => {
    if (!masterId || !businessId || !telegramId) return;
    setIsLoadingData(true);
    try {
      const url = `${API_HOST}/api/v1/public/masters/${masterId}/bookings?business_id=${businessId}&telegram_id=${telegramId}&date=${dateStr}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((b: any) => ({
          id: b.id,
          clientName: b.client_name,
          clientPhone: b.client_phone,
          clientTelegramId: b.client_telegram_id,
          masterId: b.master_id,
          serviceName: b.service_name,
          duration: b.duration || 30,
          date: b.date,
          time: b.time,
          status: b.status,
          price: b.price,
          comment: b.comment
        }));
        setBookings(mapped);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'success') {
      fetchServices();
    }
  }, [authStatus, businessId]);

  useEffect(() => {
    if (authStatus === 'success' && selectedDate) {
      fetchBookings(selectedDate);
    }
  }, [authStatus, selectedDate, masterId, businessId, telegramId]);

  // 3. Link Telegram account handler
  const handleLinkAccount = async () => {
    if (!businessId || !masterId || !telegramId) return;
    setAuthStatus('loading');
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/masters/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          master_id: masterId,
          telegram_id: telegramId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          if (data.master) {
            const m = data.master;
            setCurrentMaster({
              id: m.id,
              name: m.name,
              avatar: m.avatar || '',
              phone: m.phone || '',
              rating: m.rating || 5.0,
              isActive: m.is_active,
              telegramId: m.telegram_id
            });
          }
          setAuthStatus('success');
        } else {
          setErrorMessage(data.message || 'Ошибка при привязке аккаунта.');
          setAuthStatus('unauthorized');
        }
      } else {
        setErrorMessage('Не удалось привязать аккаунт.');
        setAuthStatus('unauthorized');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Ошибка сети при привязке.');
      setAuthStatus('unauthorized');
    }
  };

  // 4. Toggle On Duty status handler
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
      console.error('Error toggling active status:', err);
    }
  };

  // 5. Update Booking Status handler
  const handleUpdateBookingStatus = async (bookingId: string, nextStatus: 'confirmed' | 'completed' | 'cancelled' | 'noshow') => {
    if (!telegramId) return;
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          telegram_id: telegramId
        })
      });
      if (res.ok) {
        setSelectedBooking(null);
        if (selectedDate) fetchBookings(selectedDate);
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
    }
  };

  // 6. Calendar Dates Navigation Generator
  const bookingDates = useMemo(() => {
    const days = [];
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = [
      'янв', 'фев', 'мар', 'апр', 'май', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    
    const todayStr = getTashkentDateStr();
    const parts = todayStr.split('-');
    
    for (let i = -1; i < 7; i++) {
      const baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      baseDate.setDate(baseDate.getDate() + i);
      
      const currentFormatted = baseDate.toISOString().split('T')[0];
      
      days.push({
        dateStr: currentFormatted,
        dayName: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : dayNames[baseDate.getDay()],
        dayNum: baseDate.getDate(),
        monthName: monthNames[baseDate.getMonth()],
        fullText: `${baseDate.getDate()} ${monthNames[baseDate.getMonth()]}`
      });
    }
    return days;
  }, []);

  // 7. Statistics calculation
  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed');
    const earnings = completed.reduce((sum, b) => sum + b.price, 0);

    return {
      total: bookings.length,
      completed: completed.length,
      earnings
    };
  }, [bookings]);

  // Resolvers
  const getServiceName = (id: string) => {
    return services.find((s) => s.id === id)?.name || 'Услуга';
  };

  const getServiceDuration = (id: string) => {
    return services.find((s) => s.id === id)?.duration || 30;
  };

  // --- RENDER STATES ---

  if (authStatus === 'loading') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6">
        <div className="w-12 h-12 border-4 border-t-[#ff5a1f] border-slate-700 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-400 font-evolventa">Проверка прав доступа...</p>
      </div>
    );
  }

  if (authStatus === 'no_params') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f] mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-2">Кабинет Мастера Bronly</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Пожалуйста, откройте это приложение через официального Telegram-бота по вашей персональной ссылке.
        </p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-2">Доступ ограничен</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
          {errorMessage || 'Данный Telegram-аккаунт не имеет доступа к этому кабинету мастера.'}
        </p>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-evolventa">
          Bronly Security System
        </span>
      </div>
    );
  }

  if (authStatus === 'link_required') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-[#ff5a1f]/30 flex items-center justify-center text-3xl font-black text-[#ff5a1f] mb-6 font-evolventa">
          {currentMaster ? (currentMaster.avatar && currentMaster.avatar.length <= 3 ? currentMaster.avatar : currentMaster.name.split(' ').map(n=>n[0]).join('').slice(0,2)) : 'М'}
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-1">Привязка кабинета</h3>
        <p className="text-sm font-bold text-[#ff5a1f] mb-4 font-evolventa">{currentMaster?.name}</p>
        
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-8">
          Вы хотите привязать этот Telegram-аккаунт к вашему рабочему кабинету в системе Bronly? После этого вход будет доступен только с вашего аккаунта.
        </p>

        <button
          onClick={handleLinkAccount}
          className="w-full max-w-xs py-3.5 bg-[#ff5a1f] hover:bg-[#e04f1a] text-white rounded-2xl text-xs font-black uppercase tracking-wider font-evolventa active:scale-95 smooth-transition cursor-pointer shadow-lg shadow-[#ff5a1f]/20"
        >
          Привязать этот Telegram
        </button>
      </div>
    );
  }

  // Verification Success state
  if (!currentMaster) return null;

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

        {/* Master Selector / Profile Header */}
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

          {/* On Duty toggle button */}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4.5 flex flex-col gap-4 select-none bg-slate-50 pb-28">
        
        {/* Master Stats Panel */}
        <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200/60 rounded-[24px] p-3.5">
          <div className="flex flex-col text-left">
            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">
              Записи (день)
            </span>
            <span className="text-[15px] font-black text-slate-800 font-evolventa block">{stats.total}</span>
          </div>
          <div className="flex flex-col text-left border-l border-slate-100 pl-3">
            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Выполнено</span>
            <span className="text-[15px] font-black text-slate-800 font-evolventa block">{stats.completed}</span>
          </div>
          <div className="flex flex-col text-left border-l border-slate-100 pl-3">
            <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">Доход (день)</span>
            <span className="text-[13px] font-black text-[#ff5a1f] font-evolventa block truncate" title={`${stats.earnings} сум`}>
              {stats.earnings.toLocaleString('ru-RU')} сум
            </span>
          </div>
        </div>

        {/* Date Selector Navigation Carousel */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[13px] font-black text-slate-800 font-evolventa">Календарь записей</span>
            <button
              onClick={() => setSelectedDate('all')}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                selectedDate === 'all'
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 font-evolventa'
              }`}
            >
              Все дни
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none -mx-4 px-4">
            {bookingDates.map((date) => {
              const isSelected = selectedDate === date.dateStr;
              return (
                <button
                  key={date.dateStr}
                  onClick={() => setSelectedDate(date.dateStr)}
                  className={`w-14 py-3 rounded-[20px] border flex flex-col items-center gap-1 shrink-0 smooth-transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff5a1f] border-[#ff5a1f] text-white shadow-[0_4px_12px_rgba(255,90,31,0.2)]'
                      : 'bg-white border-slate-200/60 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className={`text-[8.5px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {date.dayName}
                  </span>
                  <span className="text-[14.5px] font-black font-evolventa leading-none">
                    {date.dayNum}
                  </span>
                  <span className={`text-[8.5px] font-extrabold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    {date.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bookings Feed */}
        <div className="space-y-3">
          {isLoadingData ? (
            <div className="text-center py-12 bg-white rounded-[24px] border border-slate-200/50 text-slate-400 text-[12px] font-bold font-evolventa">
              Загрузка данных...
            </div>
          ) : bookings.length > 0 ? (
            bookings.map((booking) => {
              const serviceName = booking.serviceName;
              const duration = booking.duration;

              // Status styles resolver
              let badgeColor = '';
              let statusLabel = '';
              if (booking.status === 'new') {
                badgeColor = 'bg-amber-50 text-amber-600 border border-amber-100/50';
                statusLabel = 'Новая';
              } else if (booking.status === 'confirmed') {
                badgeColor = 'bg-blue-50 text-blue-600 border border-blue-100/50';
                statusLabel = 'Подтверждена';
              } else if (booking.status === 'completed') {
                badgeColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
                statusLabel = 'Выполнена';
              } else if (booking.status === 'cancelled') {
                badgeColor = 'bg-red-50 text-red-500 border border-red-100/50';
                statusLabel = 'Отменена';
              } else if (booking.status === 'noshow') {
                badgeColor = 'bg-slate-105 text-slate-500 border border-slate-200/50';
                statusLabel = 'Не пришел';
              }

              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`p-4 rounded-[24px] bg-white border border-slate-200/60 flex flex-col gap-3.5 transition-all hover:border-slate-300 relative cursor-pointer active:bg-slate-50/70 ${
                    booking.status === 'cancelled' ? 'opacity-70' : ''
                  }`}
                >
                  {/* Row 1: Time, Date & Status */}
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-slate-100/80 rounded-xl text-[13px] font-black text-slate-800 font-evolventa">
                        {booking.time}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {booking.date === getTashkentDateStr() ? 'Сегодня' : booking.date}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Row 2: Client & Service Details */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col text-left">
                      <h4 className="text-[14px] font-black text-slate-800 font-evolventa leading-snug">
                        {serviceName}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>Клиент: <strong className="text-slate-600 font-bold">{booking.clientName}</strong></span>
                        <span>•</span>
                        <span>{duration} мин</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[13px] font-black text-slate-800 font-evolventa">
                        {booking.price.toLocaleString('ru-RU')} сум
                      </span>
                    </div>
                  </div>

                  {/* Speech Bubble Client Comment */}
                  {booking.comment && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left text-[11px] font-semibold text-slate-500 leading-normal relative">
                      <p>« {booking.comment} »</p>
                    </div>
                  )}

                  {/* Row 3: Contacts & Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${booking.clientPhone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-9 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center hover:bg-orange-100 transition-colors active:scale-95 shrink-0"
                        title="Позвонить клиенту"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                      <span className="text-[11.5px] font-bold text-slate-500 font-evolventa">
                        {booking.clientPhone}
                      </span>
                    </div>

                    {booking.clientTelegramId && (
                      <span className="text-[11px] font-bold text-[#ff5a1f] font-evolventa px-2.5 py-1 bg-orange-50/65 border border-orange-100/40 rounded-xl">
                        Telegram: {booking.clientTelegramId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-[24px] border border-slate-200/50 text-slate-400 text-[12px] font-bold font-evolventa">
              Записей не обнаружено.
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 flex flex-col justify-end select-none transition-all duration-300 ${
          selectedBooking ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedBooking(null)} />
        
        <div 
          className={`relative z-50 bg-white/95 backdrop-blur-xl w-full max-w-md mx-auto rounded-t-[36px] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] space-y-6 flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-t border-white/50 ${
            selectedBooking ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto -mt-2 mb-2" />

          <div className="flex justify-between items-center border-b border-slate-100/80 pb-4">
            <span className="font-extrabold text-slate-800 text-[16px] font-evolventa">Детали сеанса</span>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="w-8 h-8 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 active:scale-90 springy-transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-400">Статус сеанса</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  selectedBooking.status === 'new'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100/50'
                    : selectedBooking.status === 'confirmed'
                    ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                    : selectedBooking.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                    : selectedBooking.status === 'cancelled'
                    ? 'bg-red-50 text-red-500 border border-red-100/50'
                    : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                }`}>
                  {selectedBooking.status === 'new'
                    ? 'Новая'
                    : selectedBooking.status === 'confirmed'
                    ? 'Подтверждена'
                    : selectedBooking.status === 'completed'
                    ? 'Выполнена'
                    : selectedBooking.status === 'cancelled'
                    ? 'Отменена'
                    : 'Не пришел'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-400">Дата и время</span>
                <span className="text-[13px] font-extrabold text-slate-800 font-evolventa">{selectedBooking.date} в {selectedBooking.time}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-400">Услуга</span>
                <span className="text-[13px] font-extrabold text-slate-800 font-evolventa">{selectedBooking.serviceName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-400">Имя клиента</span>
                <span className="text-[13px] font-extrabold text-slate-800 font-evolventa">{selectedBooking.clientName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-400">Телефон клиента</span>
                <a 
                  href={`tel:${selectedBooking.clientPhone.replace(/\s+/g, '')}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="text-[13px] font-extrabold text-[#ff5a1f] font-evolventa"
                >
                  {selectedBooking.clientPhone}
                </a>
              </div>

              {selectedBooking.comment && (
                <div className="flex flex-col gap-1.5 text-left border-t border-slate-100 pt-3">
                  <span className="text-[12px] font-bold text-slate-400">Комментарий клиента</span>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-semibold text-slate-500 leading-normal">
                    « {selectedBooking.comment} »
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-100/80 pt-4 mt-2">
                <span className="text-[13px] font-extrabold text-slate-800 font-evolventa">Итоговая стоимость</span>
                <span className="text-[16px] font-black text-slate-800 font-evolventa">{selectedBooking.price.toLocaleString('ru-RU')} сум</span>
              </div>

              {/* Status Action Buttons for Master Cabinet */}
              <div className="flex gap-2.5 mt-2">
                {selectedBooking.status === 'new' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBookingStatus(selectedBooking.id, 'confirmed');
                      }}
                      className="flex-1 py-3 bg-[#ff5a1f] text-white rounded-[20px] font-extrabold text-[12px] uppercase tracking-wide active:scale-95 transition-transform cursor-pointer"
                    >
                      Подтвердить
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBookingStatus(selectedBooking.id, 'cancelled');
                      }}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-[20px] font-extrabold text-[12px] uppercase tracking-wide active:scale-95 transition-transform border border-slate-200 cursor-pointer"
                    >
                      Отменить
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBookingStatus(selectedBooking.id, 'completed');
                      }}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-[20px] font-extrabold text-[12px] uppercase tracking-wide active:scale-95 transition-transform cursor-pointer"
                    >
                      Выполнено
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBookingStatus(selectedBooking.id, 'noshow');
                      }}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-[20px] font-extrabold text-[12px] uppercase tracking-wide active:scale-95 transition-transform border border-slate-200 cursor-pointer"
                    >
                      Не пришел
                    </button>
                  </>
                )}
                {(selectedBooking.status === 'completed' || selectedBooking.status === 'cancelled' || selectedBooking.status === 'noshow') && (
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full py-3.5 rounded-[20px] bg-slate-900 text-white font-extrabold text-[13px] font-evolventa tracking-wide uppercase active:scale-95 transition-transform cursor-pointer"
                  >
                    Закрыть детали
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Nav */}
      <BottomNav />
    </div>
  );
}
