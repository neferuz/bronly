'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HistoryPage() {
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [businessId, setBusinessId] = useState<string>('');

  // Apply dynamic colors and fetch bookings by phone
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Get business ID from params or localStorage
      const params = new URLSearchParams(window.location.search);
      let bId = params.get('business_id') || params.get('b');

      if (!bId && window.location.pathname && window.location.pathname !== '/') {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const systemRoutes = ['profile', 'history', 'review'];
        if (pathParts.length > 0 && !systemRoutes.includes(pathParts[0])) {
          bId = pathParts[0];
        }
      }

      if (!bId) {
        bId = localStorage.getItem('last_business_id') || '';
      } else {
        bId = bId.replace(/[^a-zA-Z0-9_-]/g, '');
        localStorage.setItem('last_business_id', bId);
      }
      setBusinessId(bId);

      // 2. Get branding color from localStorage cache
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

      // 2. Fetch history
      const phone = localStorage.getItem('client_phone') || '';
      setClientPhone(phone);
      if (phone) {
        const fetchHistory = async () => {
          try {
            setIsLoading(true);
            const res = await fetch(`${API_HOST}/api/v1/public/bookings/by-phone/${encodeURIComponent(phone)}`);
            if (res.ok) {
              const data = await res.json();
              setBookings(data);
            }
          } catch (err) {
            console.error('Failed to fetch booking history:', err);
          } finally {
            setIsLoading(false);
          }
        };
        fetchHistory();
      } else {
        setIsLoading(false);
      }
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
            instagram: dataBus.instagram || ''
          }));
        }
      } catch (err) {
        console.error('Failed to fetch business details for history:', err);
      }
    };
    fetchBusinessDetails();
  }, [businessId]);

  const translateStatus = (status: string) => {
    const map: Record<string, string> = {
      new: 'Новая',
      confirmed: 'Подтверждена',
      completed: 'Выполнено',
      cancelled: 'Отменено',
      noshow: 'Неявка'
    };
    return map[status] || status;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-600';
      case 'cancelled':
      case 'noshow':
        return 'bg-rose-50 text-rose-500';
      case 'confirmed':
        return 'bg-orange-50 text-[var(--primary)]';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  const formatBookingDate = (dateStr: string, timeStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return `${dateStr}, ${timeStr}`;
    const monthNames = [
      'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    const month = monthNames[parseInt(parts[1]) - 1];
    const day = parseInt(parts[2]);
    return `${day} ${month}, ${timeStr}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased pb-24 w-full relative overflow-hidden">
      
      <div className="flex-1 px-4 py-4.5 flex flex-col select-none relative bg-slate-50 pb-6">
        <h2 className="text-2xl font-black text-slate-800 font-evolventa mb-4 px-1 tracking-tight">История визитов</h2>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-slate-400 font-bold text-xs">
            Загрузка истории...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-slate-400 select-none bg-white rounded-[24px] border border-slate-200/60 p-6 max-w-sm mx-auto w-full">
            <p className="text-sm font-evolventa font-bold text-slate-700">Визиты не найдены</p>
            <p className="text-[10px] text-slate-400 mt-1.5 font-evolventa leading-relaxed">
              {clientPhone 
                ? `По номеру ${clientPhone} активных или завершенных записей не найдено.` 
                : 'Сделайте свою первую запись, и история ваших посещений появится здесь.'}
            </p>
            <Link 
              href={`/?b=${businessId}`} 
              className="mt-6 px-6 py-3 rounded-[18px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-[12px] font-evolventa smooth-transition inline-block shadow-none"
            >
              Записаться в салон
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className="p-4 rounded-[24px] bg-white border border-slate-200/60 flex flex-col gap-3 cursor-pointer hover:border-slate-300 transition-colors active:bg-slate-50"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-extrabold text-slate-400">{formatBookingDate(booking.date, booking.time)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(booking.status)}`}>
                    {translateStatus(booking.status)}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[15px] font-black text-slate-800 font-evolventa mb-0.5">{booking.service_name}</p>
                    <p className="text-[12px] font-bold text-slate-400">Мастер: {booking.master_name || 'Любой свободный'}</p>
                  </div>
                  <span className="text-[14px] font-black text-slate-800">{booking.price.toLocaleString('ru-RU')} сум</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Details Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-40 flex flex-col justify-end select-none transition-all duration-300 ${
          selectedBooking ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedBooking(null)}
      >
        {/* Drawer Body with glassmorphism blur */}
        <div 
          className={`relative z-50 bg-white/95 backdrop-blur-xl w-full max-w-md mx-auto rounded-t-[36px] p-6 pb-8 shadow-none space-y-6 flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-t border-white ${
            selectedBooking ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Grabber pill */}
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto -mt-2 mb-2" />

          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-100/80 pb-4">
            <span className="font-extrabold text-slate-800 text-[16px] font-evolventa">Детали визита</span>
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
            <>
              {/* Detailed Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400">Статус</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(selectedBooking.status)}`}>
                    {translateStatus(selectedBooking.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400">Дата и время</span>
                  <span className="text-[13px] font-extrabold text-slate-800">{formatBookingDate(selectedBooking.date, selectedBooking.time)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400">Услуга</span>
                  <span className="text-[13px] font-extrabold text-slate-800">{selectedBooking.service_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-slate-400">Специалист</span>
                  <span className="text-[13px] font-extrabold text-slate-800">{selectedBooking.master_name || 'Любой свободный'}</span>
                </div>

                {selectedBooking.comment && (
                  <div className="flex flex-col gap-1 border-t border-slate-100/80 pt-3">
                    <span className="text-[12px] font-bold text-slate-400">Комментарий</span>
                    <span className="text-[12.5px] font-semibold text-slate-650 leading-relaxed italic">{selectedBooking.comment}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100/80 pt-4 mt-2">
                  <span className="text-[13px] font-extrabold text-slate-800">
                    {selectedBooking.status === 'cancelled' ? 'Сумма заказа' : 'Итого к оплате'}
                  </span>
                  <span className="text-[16px] font-black text-[var(--primary)] font-evolventa">{selectedBooking.price.toLocaleString('ru-RU')} сум</span>
                </div>
              </div>

              {/* Action */}
              <Link 
                href={`/?b=${businessId}`} 
                onClick={() => setSelectedBooking(null)}
                className="w-full py-4 mt-2 rounded-[20px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-[15px] font-evolventa flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-none"
              >
                <span>Повторить запись</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Link>
            </>
          )}
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[280px] z-30 bg-white/75 backdrop-blur-2xl border border-white/80 shadow-none rounded-[24px] transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-2">
          <Link href={`/?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Запись</span>
          </Link>
          
          <Link href={`/history?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-[var(--primary)]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">История</span>
          </Link>

          <Link href={`/profile?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
            <div className="w-8 h-8 rounded-full flex items-center justify-center ">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Профиль</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
