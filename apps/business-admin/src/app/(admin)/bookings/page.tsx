'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useBusiness, Booking } from '../../../hooks/useBusiness';

export default function Bookings() {
  const { bookings, masters, services, updateBookingStatus } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [masterFilter, setMasterFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeStatusPopover, setActiveStatusPopover] = useState<string | null>(null);

  const selectedServiceObj = useMemo(() => {
    if (!selectedBooking) return null;
    return services.find(s => s.id === selectedBooking.serviceId) || null;
  }, [selectedBooking, services]);

  const selectedMasterObj = useMemo(() => {
    if (!selectedBooking) return null;
    return masters.find(m => m.id === selectedBooking.masterId) || null;
  }, [selectedBooking, masters]);

  // Lock background scroll when drawer is open
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

  const todayStr = useMemo(() => {
    const baseDate = new Date();
    const tashkentStr = baseDate.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const today = new Date(tashkentStr);
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const baseDate = new Date();
    const tashkentStr = baseDate.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const tomorrow = new Date(tashkentStr);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = tomorrow.getMonth() + 1;
    const d = tomorrow.getDate();
    return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
  }, []);

  const getMasterName = (id: string) => masters.find((m) => m.id === id)?.name || 'Неизвестно';
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Неизвестно';

  const masterColorConfig: Record<string, { bg: string; text: string }> = {
    m1: { bg: 'bg-orange-100 text-[#ff5a1f]', text: '#ff5a1f' },
    m2: { bg: 'bg-blue-100 text-blue-600', text: '#2563eb' },
    m3: { bg: 'bg-emerald-100 text-emerald-600', text: '#059669' },
    m4: { bg: 'bg-slate-100 text-slate-500', text: '#64748b' }
  };

  const statusConfig: Record<string, { bg: string; label: string; dot: string }> = {
    new: { bg: 'bg-blue-50 text-blue-600 border-transparent', label: 'Новая', dot: 'bg-blue-500' },
    confirmed: { bg: 'bg-orange-50 text-[#ff5a1f] border-transparent', label: 'Подтверждена', dot: 'bg-[#ff5a1f]' },
    completed: { bg: 'bg-emerald-50 text-emerald-600 border-transparent', label: 'Выполнена', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-50 text-rose-600 border-transparent', label: 'Отменена', dot: 'bg-rose-500' },
    noshow: { bg: 'bg-slate-100 text-slate-500 border-transparent', label: 'Неявка', dot: 'bg-slate-400' }
  };

  const getInitials = (name: string) => {
    if (!name) return 'М';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const formatDateString = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const monthNames = [
      'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    return `${day} ${monthNames[month]} ${year}`;
  };

  // Filtering Logic
  const filteredBookings = bookings.filter((b) => {
    const serviceName = getServiceName(b.serviceId);
    const matchesSearch =
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientPhone.includes(searchTerm) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesMaster = masterFilter === 'all' || b.masterId === masterFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = b.date === todayStr;
    } else if (dateFilter === 'tomorrow') {
      matchesDate = b.date === tomorrowStr;
    } else if (dateFilter === 'custom' && customDate) {
      matchesDate = b.date === customDate;
    }

    return matchesSearch && matchesStatus && matchesMaster && matchesDate;
  });

  return (
    <div className="space-y-6 w-full font-sans">

      {/* Filters Toolbar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none p-4 sm:p-5 flex flex-col gap-4 select-none">
        {/* Row 1: Search and Status Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search input */}
          <div className="relative w-full md:w-80 lg:w-96">
            <input
              type="text"
              placeholder="Поиск по имени, услуге или телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:bg-white smooth-transition font-evolventa focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 placeholder:font-normal placeholder:text-slate-400"
            />
            <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="w-4 h-4 absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center rounded-full bg-slate-200/50 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filters Stack */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Все статусы
            </button>
            {Object.entries(statusConfig).map(([statusKey, cfg]) => {
              const isSelected = statusFilter === statusKey;
              return (
                <button
                  key={statusKey}
                  onClick={() => setStatusFilter(statusKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-slate-800 border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Master Filters */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            <button
              onClick={() => setMasterFilter('all')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                masterFilter === 'all'
                  ? 'bg-white text-slate-800 border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Все мастера
            </button>
            {masters.map((m) => {
              const isSelected = masterFilter === m.id;
              const initials = getInitials(m.name);
              const config = masterColorConfig[m.id] || { bg: 'bg-slate-200 text-slate-650', text: '#005' };
              return (
                <button
                  key={m.id}
                  onClick={() => setMasterFilter(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-[#ff5a1f] border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-md overflow-hidden text-[7px] font-black flex items-center justify-center shrink-0 tracking-tighter ${
                    isSelected ? 'bg-[#ff5a1f]/10 text-[#ff5a1f]' : config.bg
                  }`}>
                    {m.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  <span>{m.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Row 3: Date Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 select-none">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-800 border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Все даты
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                dateFilter === 'today'
                  ? 'bg-white text-slate-800 border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Сегодня
            </button>
            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                dateFilter === 'tomorrow'
                  ? 'bg-white text-slate-800 border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Завтра
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                dateFilter === 'custom'
                  ? 'bg-white text-[#ff5a1f] border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Выбрать дату
            </button>
          </div>

          {/* Custom Date Input (shows only when dateFilter is 'custom') */}
          {dateFilter === 'custom' && (
            <div className="relative self-start sm:self-auto">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 smooth-transition font-evolventa"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bookings Directory Table Card - Desktop */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-none overflow-hidden">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[150px]">Клиент</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[150px]">Дата и время</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[140px]">Мастер</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[160px]">Услуга</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa text-right min-w-[90px]">Стоимость</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa text-center min-w-[125px]">Статус</th>
                <th className="py-3.5 px-4 sm:px-5 font-evolventa text-right min-w-[120px]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 select-none">
                    <p className="text-sm font-evolventa font-bold">Записи не найдены</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска или фильтров.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const config = statusConfig[b.status] || statusConfig.new;
                  const masterColor = masterColorConfig[b.masterId] || { bg: 'bg-slate-100 text-slate-500', text: '#64748b' };
                  return (
                    <tr 
                      key={b.id} 
                      onClick={() => handleRowClick(b)}
                      className="hover:bg-slate-50/30 smooth-transition cursor-pointer"
                    >
                      {/* Client */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-[9px] font-black select-none font-evolventa shrink-0">
                            {getInitials(b.clientName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-800 truncate text-[11px] leading-tight font-evolventa flex items-center gap-1">
                              {b.clientName}
                              {b.clientTelegramId && (
                                <span className="text-[7px] font-normal text-sky-500 bg-sky-50 border border-sky-100 px-0.5 rounded">tg</span>
                              )}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold leading-normal mt-0.5 font-evolventa">{b.clientPhone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-xs px-2 py-0.5 rounded-lg font-evolventa select-none">
                            {b.time}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-evolventa whitespace-nowrap">
                            {formatDateString(b.date)}
                          </span>
                        </div>
                      </td>

                      {/* Master */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[8px] font-black font-evolventa shrink-0 ${masterColor.bg}`}>
                            {(() => {
                              const m = masters.find(mst => mst.id === b.masterId);
                              return m?.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                                <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(getMasterName(b.masterId))
                              );
                            })()}
                          </div>
                          <span className="text-[10px] text-slate-600 font-bold font-evolventa truncate max-w-[120px]">{getMasterName(b.masterId)}</span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-1 text-slate-700 font-evolventa text-[11px] font-bold">
                          <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[160px]">{getServiceName(b.serviceId)}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 sm:px-5 text-right font-black text-slate-700 text-xs">
                        {b.price.toLocaleString('ru-RU')} сум
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 sm:px-5 text-center relative">
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
                                      : 'border-slate-100 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-emerald-200'
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
                                      : 'border-slate-100 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-rose-200'
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
                                        : 'bg-slate-100 text-slate-500 group-hover/btn:bg-slate-500 group-hover/btn:text-white smooth-transition'
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

                      {/* Quick Actions */}
                      <td className="py-3 px-4 sm:px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'new' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                title="Принять запись"
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center smooth-transition shadow-none cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                title="Отклонить запись"
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 flex items-center justify-center smooth-transition shadow-none cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(b.id, 'completed')}
                              title="Рассчитать визит"
                              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center smooth-transition shadow-none cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          )}
                          {(b.status === 'completed' || b.status === 'cancelled' || b.status === 'noshow') && (
                            <span className="inline-flex items-center justify-center w-7 h-7 text-slate-300 select-none" title="Завершено">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Directory Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-400 select-none">
            <p className="text-sm font-evolventa font-bold">Записи не найдены</p>
            <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска или фильтров.</p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const config = statusConfig[b.status] || statusConfig.new;
            const masterColor = masterColorConfig[b.masterId] || { bg: 'bg-slate-100 text-slate-500', text: '#64748b' };
            const m = masters.find(mst => mst.id === b.masterId);
            return (
              <div
                key={b.id}
                onClick={() => handleRowClick(b)}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 flex flex-col gap-3.5 hover:bg-slate-50/10 smooth-transition active:scale-[0.99] cursor-pointer"
              >
                {/* Header: Client Initials, Name, Phone & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-[10px] font-black font-evolventa shrink-0 select-none">
                      {getInitials(b.clientName)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-slate-800 text-xs leading-tight font-evolventa flex items-center gap-1">
                        <span className="truncate max-w-[140px]">{b.clientName}</span>
                        {b.clientTelegramId && (
                          <span className="text-[7.5px] font-normal text-sky-500 bg-sky-50 border border-sky-100 px-0.5 rounded-sm shrink-0">tg</span>
                        )}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold leading-normal mt-0.5 font-evolventa">{b.clientPhone}</span>
                    </div>
                  </div>

                  {/* Status Badges with Popover */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveStatusPopover(activeStatusPopover === b.id ? null : b.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold border border-transparent leading-none select-none cursor-pointer hover:scale-105 active:scale-95 smooth-transition ${config.bg}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
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
                                  : 'border-slate-100 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-emerald-200'
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
                                  : 'border-slate-100 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-rose-200'
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

                {/* Body: Date & Time, Master, Service Details */}
                <div className="flex flex-col gap-2">
                  {/* Service info */}
                  <div className="flex items-center gap-1.5 text-slate-700 font-evolventa text-[11px] font-bold">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{getServiceName(b.serviceId)}</span>
                  </div>

                  {/* Row: Date/Time and Master */}
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 font-semibold font-evolventa">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-[10.5px] px-2 py-0.5 rounded-md font-evolventa select-none">
                        {b.time}
                      </span>
                      <span>{formatDateString(b.date)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-4.5 h-4.5 rounded-full overflow-hidden flex items-center justify-center text-[7.5px] font-black font-evolventa shrink-0 ${masterColor.bg}`}>
                        {m?.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(getMasterName(b.masterId))
                        )}
                      </div>
                      <span className="truncate max-w-[90px]">{getMasterName(b.masterId).split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-100" />

                {/* Footer: Price & Actions */}
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-750 text-xs">
                    {b.price.toLocaleString('ru-RU')} сум
                  </div>

                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {b.status === 'new' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center smooth-transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'cancelled')}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 flex items-center justify-center smooth-transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => updateBookingStatus(b.id, 'completed')}
                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center smooth-transition cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    )}
                    {(b.status === 'completed' || b.status === 'cancelled' || b.status === 'noshow') && (
                      <span className="inline-flex items-center justify-center w-7 h-7 text-slate-300" title="Завершено">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
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
            className="relative w-full max-w-[440px] h-full bg-white border-l border-slate-200/80 flex flex-col shadow-none"
            style={{
              transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
              transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
              animation: !isClosing ? 'slideInRight 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            }}
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 font-sans">
              {/* Client Profile preview card with Arrow Link & Status */}
              <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3 smooth-transition">
                <Link
                  href={`/clients/${encodeURIComponent(selectedBooking.clientPhone)}`}
                  onClick={closeDrawer}
                  className="flex items-center gap-3 min-w-0 group/client cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-[10px] font-black font-evolventa shrink-0 select-none group-hover/client:bg-orange-100 smooth-transition">
                    {getInitials(selectedBooking.clientName)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold text-slate-800 text-xs md:text-sm font-evolventa truncate leading-tight group-hover/client:text-[#ff5a1f] smooth-transition flex items-center gap-1">
                      {selectedBooking.clientName}
                      {selectedBooking.clientTelegramId && (
                        <span className="text-[8px] font-normal text-sky-500 bg-sky-50 border border-sky-100 px-0.5 rounded shrink-0">tg</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5 font-evolventa leading-none">
                      {selectedBooking.clientPhone}
                    </span>
                  </div>
                </Link>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-black border-none uppercase tracking-wide leading-none select-none shrink-0 ${statusConfig[selectedBooking.status]?.bg}`}>
                  <span className={`w-1 h-1 rounded-full ${statusConfig[selectedBooking.status]?.dot}`} />
                  {statusConfig[selectedBooking.status]?.label}
                </span>
              </div>

              {/* Telegram Contact info if present */}
              {selectedBooking.clientTelegramId && (
                <div className="bg-sky-50/40 rounded-2xl p-3 border border-sky-100/50 flex items-center justify-between gap-3 font-sans mt-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.37.88-3.87 2.56-.37.25-.7.37-.99.36-.33-.01-.96-.19-1.43-.34-.57-.19-1.02-.29-1.02-.29 0 0-.29-.15.02-.27.21-.08.68-.22 1.34-.48 4.14-1.8 6.9-2.98 8.28-3.55.33-.14.65-.24.96-.24.12 0 .38.03.55.17.15.12.2.28.22.41z"/>
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Telegram</span>
                      <span className="font-extrabold text-slate-800 text-xs md:text-sm font-evolventa truncate">
                        {selectedBooking.clientTelegramId}
                      </span>
                    </div>
                  </div>
                  {selectedBooking.clientTelegramId.startsWith('@') && (
                    <a
                      href={`https://t.me/${selectedBooking.clientTelegramId.substring(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black font-evolventa smooth-transition cursor-pointer select-none"
                    >
                      Написать
                    </a>
                  )}
                </div>
              )}

              {/* Consolidated Visit Info Block */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
                {/* Service Details */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200/50 overflow-hidden flex items-center justify-center text-[#ff5a1f] shrink-0 select-none">
                      {selectedServiceObj?.image && (selectedServiceObj.image.startsWith('http') || selectedServiceObj.image.startsWith('data:') || selectedServiceObj.image.startsWith('/')) ? (
                        <img src={selectedServiceObj.image} alt={selectedServiceObj.name} className="w-full h-full object-cover" />
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
                    {selectedMasterObj?.avatar && (selectedMasterObj.avatar.startsWith('http') || selectedMasterObj.avatar.startsWith('data:') || selectedMasterObj.avatar.startsWith('/')) ? (
                      <img src={selectedMasterObj.avatar} alt={selectedMasterObj.name} className="w-full h-full object-cover" />
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
                      <span className="font-extrabold text-slate-800 text-xs font-evolventa truncate">{formatDateString(selectedBooking.date)}</span>
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
            <div className="border-t border-slate-100 p-4 sm:p-5 shrink-0 bg-slate-50/50">
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
