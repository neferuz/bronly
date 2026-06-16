'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useBusiness, Booking } from '../../../../hooks/useBusiness';

export default function ClientDetails() {
  const { phone: encodedPhone } = useParams();
  const phone = decodeURIComponent(encodedPhone as string);
  
  const { bookings, masters, services, updateBookingStatus } = useBusiness();

  // Drawer states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeStatusPopover, setActiveStatusPopover] = useState<string | null>(null);

  // Lock background scroll when modal/drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleRowClick = (b: any) => {
    setSelectedBooking(b);
    setIsClosing(false);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
      setSelectedBooking(null);
    }, 350);
  };

  const getMasterName = (id: string) => masters.find((m) => m.id === id)?.name || 'Неизвестно';
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Неизвестно';
  
  const getInitials = (name: string) => {
    if (!name) return 'К';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const MONTH_NAMES_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = Number(parts[2]);
    const m = Number(parts[1]);
    return `${d} ${MONTH_NAMES_GENITIVE[m - 1]}`;
  };

  const statusConfig: Record<string, { bg: string; label: string; dot: string }> = {
    new: { bg: 'bg-blue-50 text-blue-600 border-transparent', label: 'Новая', dot: 'bg-blue-500' },
    confirmed: { bg: 'bg-orange-50 text-[#ff5a1f] border-transparent', label: 'Подтверждена', dot: 'bg-[#ff5a1f]' },
    completed: { bg: 'bg-emerald-50 text-emerald-600 border-transparent', label: 'Выполнена', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-50 text-rose-600 border-transparent', label: 'Отменена', dot: 'bg-rose-500' },
    noshow: { bg: 'bg-slate-100 text-slate-500 border-transparent', label: 'Неявка', dot: 'bg-slate-400' }
  };

  // Filter bookings for this specific client
  const clientBookings = useMemo(() => {
    return bookings
      .filter((b) => b.clientPhone === phone)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
  }, [bookings, phone]);

  // Client info (taken from the first matching booking)
  const clientInfo = useMemo(() => {
    if (clientBookings.length === 0) return null;
    const latest = clientBookings[0];
    return {
      name: latest.clientName,
      phone: latest.clientPhone,
      telegramId: latest.clientTelegramId
    };
  }, [clientBookings]);

  // Last visit description
  const lastVisitDate = useMemo(() => {
    if (clientBookings.length === 0) return 'Нет визитов';
    const latest = clientBookings[0];
    return `${formatDate(latest.date)} в ${latest.time}`;
  }, [clientBookings]);

  // Resolved entities for selected booking
  const resolvedService = useMemo(() => {
    if (!selectedBooking) return null;
    return services.find((s) => s.id === selectedBooking.serviceId);
  }, [selectedBooking, services]);

  const resolvedMaster = useMemo(() => {
    if (!selectedBooking) return null;
    return masters.find((m) => m.id === selectedBooking.masterId);
  }, [selectedBooking, masters]);

  // Analytics & Stats
  const stats = useMemo(() => {
    let totalSpend = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    clientBookings.forEach((b) => {
      if (b.status === 'completed') {
        completedCount++;
        totalSpend += b.price;
      } else if (b.status === 'cancelled' || b.status === 'noshow') {
        cancelledCount++;
      }
    });

    return {
      totalVisits: clientBookings.length,
      completedCount,
      cancelledCount,
      totalSpend
    };
  }, [clientBookings]);

  if (!clientInfo) {
    return (
      <div className="w-full py-16 text-center space-y-4 font-sans">
        <h2 className="text-xl font-extrabold text-slate-800 font-evolventa">Клиент не найден</h2>
        <p className="text-slate-500 text-xs font-evolventa">Данный номер телефона отсутствует в базе активных бронирований.</p>
        <div className="pt-4">
          <Link
            href="/clients"
            className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-bold text-xs smooth-transition inline-block shadow-none font-evolventa"
          >
            ← В базу клиентов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans relative">
      {/* Back link */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold smooth-transition font-evolventa"
        >
          ← База клиентов
        </Link>
      </div>

      {/* CLIENT HEADER PROFILE CARD */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar Container */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center font-extrabold border border-orange-100 select-none text-base sm:text-xl font-evolventa shrink-0">
            {getInitials(clientInfo.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight font-evolventa leading-tight truncate">
              {clientInfo.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold font-evolventa">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {clientInfo.phone}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Последний визит: {lastVisitDate}
              </span>
            </div>
          </div>
        </div>

        {clientInfo.telegramId ? (
          <div className="flex items-center gap-2 self-start md:self-center">
            <svg className="w-4 h-4 text-sky-500 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.37.88-3.87 2.56-.37.25-.7.37-.99.36-.33-.01-.96-.19-1.43-.34-.57-.19-1.02-.29-1.02-.29 0 0-.29-.15.02-.27.21-.08.68-.22 1.34-.48 4.14-1.8 6.9-2.98 8.28-3.55.33-.14.65-.24.96-.24.12 0 .38.03.55.17.15.12.2.28.22.41z"/>
            </svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-evolventa">Telegram:</span>
            {clientInfo.telegramId.startsWith('@') ? (
              <a
                href={`https://t.me/${clientInfo.telegramId.substring(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border border-sky-100 font-evolventa smooth-transition cursor-pointer"
              >
                {clientInfo.telegramId}
              </a>
            ) : (
              <span className="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border border-sky-100 font-evolventa select-all">
                {clientInfo.telegramId}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-350 italic font-evolventa self-start md:self-center">
            <svg className="w-4 h-4 text-slate-300 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.37.88-3.87 2.56-.37.25-.7.37-.99.36-.33-.01-.96-.19-1.43-.34-.57-.19-1.02-.29-1.02-.29 0 0-.29-.15.02-.27.21-.08.68-.22 1.34-.48 4.14-1.8 6.9-2.98 8.28-3.55.33-.14.65-.24.96-.24.12 0 .38.03.55.17.15.12.2.28.22.41z"/>
            </svg>
            Telegram не привязан
          </div>
        )}
      </div>

      {/* STATISTICAL CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-evolventa">Всего визитов</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mt-1 block font-evolventa">{stats.totalVisits}</span>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-none">
          <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider block font-evolventa">Выполнено</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-[#10b981] mt-1 block font-evolventa">{stats.completedCount}</span>
        </div>

        {/* Cancelled / NoShow */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-none">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block font-evolventa">Отмены / Неявки</span>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-rose-500 mt-1 block font-evolventa">{stats.cancelledCount}</span>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-evolventa">Сумма покупок</span>
          <span className="text-sm sm:text-base md:text-xl font-black text-slate-800 mt-1 block font-evolventa truncate">
            {stats.totalSpend.toLocaleString('ru-RU')} сум
          </span>
        </div>
      </div>

      {/* CLIENT VISITS HISTORY */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base font-evolventa">История визитов</h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-evolventa">
            {clientBookings.length} записей
          </span>
        </div>

        {/* Client Visits History - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 select-none text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-4 px-6 font-evolventa min-w-[130px]">Дата и время</th>
                <th className="py-4 px-6 font-evolventa min-w-[150px]">Услуга</th>
                <th className="py-4 px-6 font-evolventa min-w-[140px]">Мастер</th>
                <th className="py-4 px-6 font-evolventa min-w-[125px]">Статус</th>
                <th className="py-4 px-6 font-evolventa text-right min-w-[120px]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {clientBookings.map((b) => {
                const config = statusConfig[b.status] || statusConfig.new;
                return (
                  <tr
                    key={b.id}
                    onClick={() => handleRowClick(b)}
                    className="hover:bg-slate-50/30 smooth-transition cursor-pointer"
                  >
                    {/* Date & Time */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm font-evolventa">{formatDate(b.date)}</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 font-evolventa">{b.time}</span>
                      </div>
                    </td>

                    {/* Service Info */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm font-evolventa">{getServiceName(b.serviceId)}</span>
                        <span className="text-[10px] text-[#ff5a1f] font-bold mt-0.5 font-evolventa">
                          {b.price.toLocaleString('ru-RU')} сум
                        </span>
                      </div>
                    </td>

                    {/* Master Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[9px] font-evolventa border border-slate-200/40 select-none">
                          {getInitials(getMasterName(b.masterId))}
                        </div>
                        <span className="font-semibold text-slate-700 font-evolventa text-xs">{getMasterName(b.masterId)}</span>
                      </div>
                    </td>

                     {/* Status Badge */}
                     <td className="py-4 px-6 relative">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setActiveStatusPopover(activeStatusPopover === b.id ? null : b.id);
                         }}
                         className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-transparent leading-none select-none cursor-pointer hover:scale-105 active:scale-95 smooth-transition ${config.bg}`}
                       >
                         <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                         {config.label}
                       </button>

                       {activeStatusPopover === b.id && (
                         <>
                           {/* Backdrop click detector */}
                           <div 
                             className="fixed inset-0 z-40 cursor-default" 
                             onClick={(e) => {
                               e.stopPropagation();
                               setActiveStatusPopover(null);
                             }}
                           />
                           
                           {/* Popover container */}
                           <div 
                             className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150"
                             onClick={(e) => e.stopPropagation()}
                           >
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block select-none mb-2">
                               Изменить статус визита
                             </span>
                             <div className="grid grid-cols-2 gap-2">
                               {/* CONFIRMED BUTTON */}
                               <button
                                 onClick={() => {
                                   updateBookingStatus(b.id, 'confirmed');
                                   setActiveStatusPopover(null);
                                 }}
                                 className={`p-2 rounded-xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1 cursor-pointer relative overflow-hidden group/btn ${
                                   b.status === 'confirmed'
                                     ? 'bg-orange-50/60 border-[#ff5a1f]/35 text-[#ff5a1f]'
                                     : 'border-slate-100 bg-white hover:bg-orange-50/20 text-slate-700 hover:border-orange-200'
                                 }`}
                               >
                                 <div className="flex items-center justify-between w-full">
                                   <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-bold ${
                                     b.status === 'confirmed'
                                       ? 'bg-[#ff5a1f] text-white'
                                       : 'bg-orange-50 text-[#ff5a1f] group-hover/btn:bg-[#ff5a1f] group-hover/btn:text-white smooth-transition'
                                   }`}>
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                     </svg>
                                   </span>
                                 </div>
                                 <div className="mt-0.5">
                                   <span className="font-extrabold text-[10px] block leading-tight">Подтвердить</span>
                                 </div>
                               </button>

                               {/* COMPLETED BUTTON */}
                               <button
                                 onClick={() => {
                                   updateBookingStatus(b.id, 'completed');
                                   setActiveStatusPopover(null);
                                 }}
                                 className={`p-2 rounded-xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1 cursor-pointer relative overflow-hidden group/btn ${
                                   b.status === 'completed'
                                     ? 'bg-emerald-50/60 border-emerald-500/35 text-emerald-700'
                                     : 'border-slate-100 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-orange-250'
                                 }`}
                               >
                                 <div className="flex items-center justify-between w-full">
                                   <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-bold ${
                                     b.status === 'completed'
                                       ? 'bg-emerald-500 text-white'
                                       : 'bg-emerald-50 text-emerald-600 group-hover/btn:bg-emerald-500 group-hover/btn:text-white smooth-transition'
                                   }`}>
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                   </span>
                                 </div>
                                 <div className="mt-0.5">
                                   <span className="font-extrabold text-[10px] block leading-tight">Выполнить</span>
                                 </div>
                               </button>

                               {/* CANCELLED BUTTON */}
                               <button
                                 onClick={() => {
                                   updateBookingStatus(b.id, 'cancelled');
                                   setActiveStatusPopover(null);
                                 }}
                                 className={`p-2 rounded-xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1 cursor-pointer relative overflow-hidden group/btn ${
                                   b.status === 'cancelled'
                                     ? 'bg-rose-50/60 border-rose-500/35 text-rose-700'
                                     : 'border-slate-100 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-orange-250'
                                 }`}
                               >
                                 <div className="flex items-center justify-between w-full">
                                   <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-bold ${
                                     b.status === 'cancelled'
                                       ? 'bg-rose-500 text-white'
                                       : 'bg-rose-50 text-rose-500 group-hover/btn:bg-rose-500 group-hover/btn:text-white smooth-transition'
                                   }`}>
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                     </svg>
                                   </span>
                                 </div>
                                 <div className="mt-0.5">
                                   <span className="font-extrabold text-[10px] block leading-tight">Отменить</span>
                                 </div>
                               </button>

                               {/* NOSHOW BUTTON */}
                               <button
                                 onClick={() => {
                                   updateBookingStatus(b.id, 'noshow');
                                   setActiveStatusPopover(null);
                                 }}
                                 className={`p-2 rounded-xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1 cursor-pointer relative overflow-hidden group/btn ${
                                   b.status === 'noshow'
                                     ? 'bg-slate-100 border-slate-300 text-slate-750'
                                     : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-350'
                                 }`}
                               >
                                 <div className="flex items-center justify-between w-full">
                                   <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-bold ${
                                     b.status === 'noshow'
                                       ? 'bg-slate-550 text-white'
                                       : 'bg-slate-100 text-slate-500 group-hover/btn:bg-slate-550 group-hover/btn:text-white smooth-transition'
                                   }`}>
                                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                     </svg>
                                   </span>
                                 </div>
                                 <div className="mt-0.5">
                                   <span className="font-extrabold text-[10px] block leading-tight">Неявка</span>
                                 </div>
                               </button>
                             </div>
                           </div>
                         </>
                       )}
                     </td>

                    {/* Inline Quick Action Buttons */}
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'new' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'confirmed')}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-[#ff5a1f] border border-orange-100 text-[10px] font-bold hover:bg-orange-100 smooth-transition font-evolventa shadow-none cursor-pointer"
                          >
                            Принять
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'completed')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-205 text-[10px] font-bold hover:bg-emerald-100 smooth-transition font-evolventa shadow-none cursor-pointer"
                          >
                            Завершить
                          </button>
                        )}
                        {(b.status === 'new' || b.status === 'confirmed') && (
                          <button
                            onClick={() => updateBookingStatus(b.id, 'cancelled')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-bold hover:bg-rose-100 smooth-transition font-evolventa shadow-none cursor-pointer"
                          >
                            Отменить
                          </button>
                        )}
                        {(b.status === 'completed' || b.status === 'cancelled' || b.status === 'noshow') && (
                          <span className="text-[10px] text-slate-350 italic font-evolventa">Действий нет</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Client Visits Cards - Mobile */}
        <div className="md:hidden space-y-3 p-4 bg-slate-50/10">
          {clientBookings.map((b) => {
            const config = statusConfig[b.status] || statusConfig.new;
            return (
              <div
                key={b.id}
                onClick={() => handleRowClick(b)}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 flex flex-col gap-3.5 hover:bg-slate-50/10 smooth-transition active:scale-[0.99] cursor-pointer"
              >
                {/* Header: Date & Time + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm font-evolventa">{formatDate(b.date)}</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5 font-evolventa">{b.time}</span>
                  </div>

                  {/* Status Badges with Popover */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveStatusPopover(activeStatusPopover === b.id ? null : b.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold border border-transparent leading-none select-none cursor-pointer hover:scale-105 active:scale-95 smooth-transition ${config.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </button>

                    {activeStatusPopover === b.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setActiveStatusPopover(null)}
                        />
                        <div 
                          className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block select-none mb-1.5 px-1">
                            Статус визита
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                updateBookingStatus(b.id, 'confirmed');
                                setActiveStatusPopover(null);
                              }}
                              className={`p-1.5 rounded-lg border text-left smooth-transition font-evolventa flex flex-col justify-between cursor-pointer ${
                                b.status === 'confirmed'
                                  ? 'bg-orange-50/60 border-[#ff5a1f]/35 text-[#ff5a1f]'
                                  : 'border-slate-100 bg-white hover:bg-orange-50/20 text-slate-700 hover:border-orange-200'
                              }`}
                            >
                              <span className="font-extrabold text-[9.5px]">Подтвердить</span>
                            </button>

                            <button
                              onClick={() => {
                                updateBookingStatus(b.id, 'completed');
                                setActiveStatusPopover(null);
                              }}
                              className={`p-1.5 rounded-lg border text-left smooth-transition font-evolventa flex flex-col justify-between cursor-pointer ${
                                b.status === 'completed'
                                  ? 'bg-emerald-50/60 border-emerald-500/35 text-emerald-700'
                                  : 'border-slate-100 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-orange-250'
                              }`}
                            >
                              <span className="font-extrabold text-[9.5px]">Выполнить</span>
                            </button>

                            <button
                              onClick={() => {
                                updateBookingStatus(b.id, 'cancelled');
                                setActiveStatusPopover(null);
                              }}
                              className={`p-1.5 rounded-lg border text-left smooth-transition font-evolventa flex flex-col justify-between cursor-pointer ${
                                b.status === 'cancelled'
                                  ? 'bg-rose-50/60 border-rose-500/35 text-rose-700'
                                  : 'border-slate-100 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-orange-250'
                              }`}
                            >
                              <span className="font-extrabold text-[9.5px]">Отменить</span>
                            </button>

                            <button
                              onClick={() => {
                                updateBookingStatus(b.id, 'noshow');
                                setActiveStatusPopover(null);
                              }}
                              className={`p-1.5 rounded-lg border text-left smooth-transition font-evolventa flex flex-col justify-between cursor-pointer ${
                                b.status === 'noshow'
                                  ? 'bg-slate-100 border-slate-300 text-slate-750'
                                  : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-350'
                              }`}
                            >
                              <span className="font-extrabold text-[9.5px]">Неявка</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Details: Service and Master */}
                <div className="flex flex-col gap-2 font-evolventa">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Услуга</span>
                    <span className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{getServiceName(b.serviceId)}</span>
                    <span className="text-[10.5px] text-[#ff5a1f] font-black mt-1">
                      {b.price.toLocaleString('ru-RU')} сум
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 select-none">
                    <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-[8px] border border-slate-200/40 shrink-0">
                      {getInitials(getMasterName(b.masterId))}
                    </div>
                    <span className="font-semibold text-slate-650 text-xs">{getMasterName(b.masterId)}</span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {b.status === 'new' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-[#ff5a1f] border border-orange-100 text-[10px] font-bold hover:bg-orange-100 smooth-transition cursor-pointer"
                    >
                      Принять
                    </button>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'completed')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-205 text-[10px] font-bold hover:bg-emerald-100 smooth-transition cursor-pointer"
                    >
                      Завершить
                    </button>
                  )}
                  {(b.status === 'new' || b.status === 'confirmed') && (
                    <button
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-bold hover:bg-rose-100 smooth-transition cursor-pointer"
                    >
                      Отменить
                    </button>
                  )}
                  {(b.status === 'completed' || b.status === 'cancelled' || b.status === 'noshow') && (
                    <span className="text-[10px] text-slate-350 italic select-none py-1.5">Действий нет</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE DRAWER — BOOKING DETAILS */}
      {isDrawerOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={closeDrawer}
            className="absolute inset-0 cursor-pointer"
            style={{
              backgroundColor: isClosing ? 'transparent' : 'rgba(15, 23, 42, 0.35)',
              backdropFilter: isClosing ? 'blur(0px)' : 'blur(3px)',
              WebkitBackdropFilter: isClosing ? 'blur(0px)' : 'blur(3px)',
              transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Drawer Panel */}
          <div
            className="relative w-full max-w-[440px] h-full bg-white border-l border-slate-200/80 flex flex-col"
            style={{
              transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: !isClosing ? 'slideInRight 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            }}
          >
            {/* Drawer Header */}
            <div className="p-6 pb-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff5a1f] to-[#ff8c42] flex items-center justify-center shrink-0 text-white">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base font-evolventa leading-tight">
                      Детали записи
                    </h3>
                    <span className="text-[9px] text-slate-400 font-bold leading-none uppercase tracking-wider">
                      ID: #{selectedBooking.id}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center smooth-transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
              {/* Status Section */}
              <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold text-slate-400 font-evolventa uppercase tracking-wider">Текущий статус</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black border-none uppercase tracking-wide leading-none select-none ${statusConfig[selectedBooking.status]?.bg}`}>
                  <span className={`w-1 h-1 rounded-full ${statusConfig[selectedBooking.status]?.dot}`} />
                  {statusConfig[selectedBooking.status]?.label}
                </span>
              </div>

              {/* Consolidated Visit Info Block */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                {/* Service Details */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/50 overflow-hidden flex items-center justify-center text-[#ff5a1f] shrink-0 select-none">
                      {resolvedService?.image && (resolvedService.image.startsWith('http') || resolvedService.image.startsWith('data:') || resolvedService.image.startsWith('/')) ? (
                        <img src={resolvedService.image} alt={resolvedService.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Услуга</span>
                      <span className="font-extrabold text-slate-800 text-xs md:text-sm leading-tight font-evolventa truncate max-w-[200px]" title={getServiceName(selectedBooking.serviceId)}>
                        {getServiceName(selectedBooking.serviceId)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-[#ff5a1f] font-evolventa bg-[#ff5a1f]/5 border border-[#ff5a1f]/10 px-2 py-0.5 rounded-lg select-none">
                      {selectedBooking.price.toLocaleString('ru-RU')} сум
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Master Details */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 text-slate-500 border border-slate-200/40 flex items-center justify-center text-[10px] font-black font-evolventa select-none shrink-0">
                    {resolvedMaster?.avatar && (resolvedMaster.avatar.startsWith('http') || resolvedMaster.avatar.startsWith('data:') || resolvedMaster.avatar.startsWith('/')) ? (
                      <img src={resolvedMaster.avatar} alt={resolvedMaster.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400">{getInitials(getMasterName(selectedBooking.masterId))}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Мастер</span>
                    <span className="font-extrabold text-slate-800 text-xs md:text-sm font-evolventa truncate">
                      {getMasterName(selectedBooking.masterId)}
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider leading-none mb-0.5">Дата</span>
                      <span className="font-extrabold text-slate-800 text-xs font-evolventa truncate">{formatDate(selectedBooking.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider leading-none mb-0.5">Время</span>
                      <span className="font-extrabold text-slate-800 text-xs font-evolventa truncate">{selectedBooking.time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client comment */}
              {selectedBooking.comment && (
                <div className="bg-orange-50/30 rounded-2xl border border-orange-100/30 p-3 flex gap-3">
                  <svg className="w-4 h-4 text-[#ff5a1f]/60 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.983 3v8h6c0 2.22-1.78 4-4 4-.26 0-.52-.02-.78-.07L10 18.12a8 8 0 008-8.12V3h-8.017zM2 11h6c0 2.22-1.78 4-4 4-.26 0-.52-.02-.78-.07L2 18.12a8 8 0 008-8.12V3H2v8z" />
                  </svg>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-bold text-[#ff5a1f]/80 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Комментарий клиента</span>
                    <p className="text-slate-600 text-xs font-semibold leading-normal font-evolventa italic">
                      {selectedBooking.comment}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions — Sticky Status Change Grid */}
            <div className="border-t border-slate-100 p-4 shrink-0 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block select-none mb-2">Изменить статус визита</span>
              <div className="grid grid-cols-2 gap-2">
                {/* CONFIRMED BUTTON */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'confirmed');
                    setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed' } : null);
                  }}
                  className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                    selectedBooking.status === 'confirmed'
                      ? 'bg-orange-50/60 border-[#ff5a1f]/35 text-[#ff5a1f]'
                      : 'border-slate-200 bg-white hover:bg-orange-50/20 text-slate-700 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-[#ff5a1f] text-white'
                        : 'bg-orange-50 text-[#ff5a1f] group-hover/btn:bg-[#ff5a1f] group-hover/btn:text-white smooth-transition'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {selectedBooking.status === 'confirmed' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f] animate-ping" />
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="font-extrabold text-xs block leading-tight">Подтвердить</span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">Визит согласован</span>
                  </div>
                </button>

                {/* COMPLETED BUTTON */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'completed');
                    setSelectedBooking(prev => prev ? { ...prev, status: 'completed' } : null);
                  }}
                  className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                    selectedBooking.status === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-500/35 text-emerald-700'
                      : 'border-slate-200 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                      selectedBooking.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-50 text-emerald-600 group-hover/btn:bg-emerald-500 group-hover/btn:text-white smooth-transition'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    {selectedBooking.status === 'completed' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="font-extrabold text-xs block leading-tight">Выполнить</span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">Услуга оказана</span>
                  </div>
                </button>

                {/* CANCELLED BUTTON */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'cancelled');
                    setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
                  }}
                  className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                    selectedBooking.status === 'cancelled'
                      ? 'bg-rose-50/60 border-rose-500/35 text-rose-700'
                      : 'border-slate-200 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                      selectedBooking.status === 'cancelled'
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-50 text-rose-500 group-hover/btn:bg-rose-500 group-hover/btn:text-white smooth-transition'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    {selectedBooking.status === 'cancelled' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="font-extrabold text-xs block leading-tight">Отменить</span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">Клиент отменил</span>
                  </div>
                </button>

                {/* NOSHOW BUTTON */}
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'noshow');
                    setSelectedBooking(prev => prev ? { ...prev, status: 'noshow' } : null);
                  }}
                  className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                    selectedBooking.status === 'noshow'
                      ? 'bg-slate-100 border-slate-300 text-[#64748b]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                      selectedBooking.status === 'noshow'
                        ? 'bg-slate-550 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover/btn:bg-slate-550 group-hover/btn:text-white smooth-transition'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </span>
                    {selectedBooking.status === 'noshow' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="font-extrabold text-xs block leading-tight">Неявка</span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">Клиент не пришел</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer animation keyframes */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}