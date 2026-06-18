'use client';

import React, { useState, useMemo, useEffect } from 'react';
import BottomNav from '../../components/layout/BottomNav';
import { useMaster } from '../../context/MasterContext';

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

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MasterHistoryPage() {
  const {
    businessId,
    masterId,
    telegramId,
    currentMaster,
    services,
    toggleMasterActive
  } = useMaster();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Fetch bookings on mount or when credentials change
  const loadBookings = async () => {
    if (!businessId || !masterId || !telegramId) return;
    setIsLoading(true);
    try {
      const bookRes = await fetch(`${API_HOST}/api/v1/public/masters/${masterId}/bookings?business_id=${businessId}&telegram_id=${telegramId}&date=all`);
      if (bookRes.ok) {
        const data = await bookRes.json();
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
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [businessId, masterId, telegramId]);

  // 2. Filter past/history bookings
  const historyBookings = useMemo(() => {
    return bookings
      .filter((booking) => ['completed', 'cancelled', 'noshow'].includes(booking.status))
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [bookings]);

  const getServiceName = (id: string) => {
    return services.find((s) => s.id === id)?.name || 'Услуга';
  };

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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4.5 flex flex-col gap-4 select-none bg-slate-50 pb-28">
        <h3 className="text-[13px] font-black text-slate-800 font-evolventa px-1">Завершенные сеансы ({isLoading ? '...' : historyBookings.length})</h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-t-[#ff5a1f] border-slate-200 rounded-full animate-spin mb-3" />
            <p className="text-xs font-evolventa">Загрузка сеансов...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyBookings.length > 0 ? (
              historyBookings.map((booking) => {
                const serviceName = booking.serviceName;
                
                let statusLabel = '';
                let statusClass = '';
                if (booking.status === 'completed') {
                  statusLabel = 'Выполнена';
                  statusClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
                } else if (booking.status === 'cancelled') {
                  statusLabel = 'Отменена';
                  statusClass = 'bg-red-50 text-red-500 border border-red-100/50';
                } else if (booking.status === 'noshow') {
                  statusLabel = 'Не пришел';
                  statusClass = 'bg-slate-100 text-slate-500 border border-slate-200/50';
                }

                return (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="p-4 rounded-[24px] bg-white border border-slate-200/60 flex flex-col gap-3 cursor-pointer hover:border-slate-300 transition-colors active:bg-slate-50"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-extrabold text-slate-400">
                        {booking.date} в {booking.time}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-left">
                        <p className="text-[14px] font-black text-slate-800 font-evolventa mb-0.5">{serviceName}</p>
                        <p className="text-[11px] font-bold text-slate-400">Клиент: {booking.clientName}</p>
                      </div>
                      <span className="text-[13px] font-black text-slate-800 font-evolventa">{booking.price.toLocaleString('ru-RU')} сум</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-[24px] border border-slate-200/50 text-slate-400 text-[12px] font-bold font-evolventa">
                История сеансов пуста.
              </div>
            )}
          </div>
        )}
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
            <span className="font-extrabold text-slate-800 text-[16px] font-evolventa">Детали прошедшего сеанса</span>
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
                  selectedBooking.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : selectedBooking.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedBooking.status === 'completed' ? 'Выполнен' : selectedBooking.status === 'cancelled' ? 'Отменен' : 'Не пришел'}
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
                <a href={`tel:${selectedBooking.clientPhone.replace(/\s+/g, '')}`} className="text-[13px] font-extrabold text-[#ff5a1f] font-evolventa">
                  {selectedBooking.clientPhone}
                </a>
              </div>

              {selectedBooking.comment && (
                <div className="flex flex-col gap-1.5 text-left border-t border-slate-50 pt-3">
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

              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3.5 mt-2 rounded-[20px] bg-slate-900 text-white font-extrabold text-[14px] font-evolventa tracking-wide uppercase active:scale-95 transition-transform cursor-pointer"
              >
                Закрыть детали
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
