'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusiness, Booking } from '../../../hooks/useBusiness';

export default function Calendar() {
  const { bookings, masters, services, addBooking, updateBookingStatus } = useBusiness();

  // Helper date state (default to dynamic today)
  const today = useMemo(() => {
    const d = new Date();
    const tashkentStr = d.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    return new Date(tashkentStr);
  }, []);
  const formatToday = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(formatToday);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());


  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create');
  const [selectedBookingForView, setSelectedBookingForView] = useState<Booking | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMasterFilter, setSelectedMasterFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<Booking['status'] | null>(null);
  const [activeStatusPopover, setActiveStatusPopover] = useState<string | null>(null);



  // Create Form States
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientPhone, setFormClientPhone] = useState<string>('');
  const [formServiceId, setFormServiceId] = useState<string>(services[0]?.id || '');
  const [formMasterId, setFormMasterId] = useState<string>(masters[0]?.id || '');
  const [formTime, setFormTime] = useState<string>('12:00');
  const [formComment, setFormComment] = useState<string>('');

  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const MONTH_NAMES_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  // Colors for master initials
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

  const getMasterName = (id: string) => masters.find((m) => m.id === id)?.name || 'Неизвестно';
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Неизвестно';

  const getInitials = (name: string) => {
    if (!name) return 'М';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const getBookingCountText = (count: number) => {
    if (count === 0) return 'нет записей';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${count} записей`;
    if (lastDigit === 1) return `${count} запись`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${count} записи`;
    return `${count} записей`;
  };

  // 30-minute intervals from 09:00 to 21:00
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 21; h++) {
      const hourStr = h < 10 ? `0${h}` : `${h}`;
      slots.push(`${hourStr}:00`);
      if (h !== 21) {
        slots.push(`${hourStr}:30`);
      }
    }
    return slots;
  }, []);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Shift firstDayIndex for Russian calendar (Monday is first, Sunday is index 0 in JS, shift accordingly)
  const russianFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Previous and next month days helper calculations to balance monthly grid
  const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
  const nextMonthDaysNeeded = 42 - (russianFirstDayIndex + daysInMonth);

  // Selected day bookings (filtered and unfiltered variants)
  const dayStats = useMemo(() => {
    const dayBookings = bookings.filter((b) => b.date === selectedDate);
    const total = dayBookings.length;
    const completed = dayBookings.filter((b) => b.status === 'completed').length;
    const confirmed = dayBookings.filter((b) => b.status === 'confirmed').length;
    const revenue = dayBookings
      .filter((b) => b.status === 'completed' || b.status === 'confirmed')
      .reduce((sum, b) => sum + b.price, 0);
    return { total, completed, confirmed, revenue };
  }, [bookings, selectedDate]);

  const selectedDayBookings = useMemo(() => {
    return bookings
      .filter((b) => b.date === selectedDate)
      .filter((b) => {
        const serviceName = getServiceName(b.serviceId);
        const matchesSearch =
          b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          serviceName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMaster = selectedMasterFilter ? b.masterId === selectedMasterFilter : true;
        const matchesStatus = selectedStatusFilter ? b.status === selectedStatusFilter : true;
        return matchesSearch && matchesMaster && matchesStatus;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, selectedDate, searchQuery, selectedMasterFilter, selectedStatusFilter]);

  // Available slots today (based on unfiltered calendar to prevent double-booking)
  const freeSlots = useMemo(() => {
    const bookedTimes = bookings.filter((b) => b.date === selectedDate).map((b) => b.time);
    const standardSlots = ['09:30', '11:00', '12:00', '13:30', '15:00', '16:00', '17:30', '18:45'];
    return standardSlots.filter((slot) => !bookedTimes.includes(slot));
  }, [bookings, selectedDate]);

  const handleOpenCreateDrawerWithTime = (time: string) => {
    setDrawerMode('create');
    setFormClientName('');
    setFormClientPhone('');
    setFormComment('');
    setFormTime(time);
    setFormServiceId(services[0]?.id || '');
    setFormMasterId(masters[0]?.id || '');
    setIsDrawerOpen(true);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectPrevMonthDay = (day: number) => {
    let targetMonth = currentMonth - 1;
    let targetYear = currentYear;
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    }
    const monthStr = targetMonth + 1 < 10 ? `0${targetMonth + 1}` : `${targetMonth + 1}`;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    setSelectedDate(`${targetYear}-${monthStr}-${dayStr}`);
    setCurrentMonth(targetMonth);
    setCurrentYear(targetYear);
  };

  const handleSelectNextMonthDay = (day: number) => {
    let targetMonth = currentMonth + 1;
    let targetYear = currentYear;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    const monthStr = targetMonth + 1 < 10 ? `0${targetMonth + 1}` : `${targetMonth + 1}`;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    setSelectedDate(`${targetYear}-${monthStr}-${dayStr}`);
    setCurrentMonth(targetMonth);
    setCurrentYear(targetYear);
  };

  const formatDateString = (day: number) => {
    const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `${currentYear}-${monthStr}-${dayStr}`;
  };

  const formatSelectedDateHeader = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = Number(parts[2]);
    const m = Number(parts[1]);
    return `${d} ${MONTH_NAMES_GENITIVE[m - 1]} ${parts[0]}`;
  };

  // Open Create Drawer
  const handleOpenCreateDrawer = () => {
    setDrawerMode('create');
    setFormClientName('');
    setFormClientPhone('');
    setFormComment('');
    setFormTime('12:00');
    setFormServiceId(services[0]?.id || '');
    setFormMasterId(masters[0]?.id || '');
    setIsDrawerOpen(true);
  };

  // Open View Drawer
  const handleOpenViewDrawer = (b: Booking) => {
    setSelectedBookingForView(b);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || !formClientPhone) return;

    const s = services.find((srv) => srv.id === formServiceId);
    const price = s ? s.price : 0;

    addBooking({
      clientName: formClientName,
      clientPhone: formClientPhone,
      masterId: formMasterId,
      serviceId: formServiceId,
      date: selectedDate,
      time: formTime,
      price,
      comment: formComment
    });

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6 w-full font-sans relative pb-4 xl:pb-8">
      
      {/* Top 50/50 Grid: Work Shift Controls and Month Grid Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Side: Shift Control Center */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-none flex flex-col justify-between transition-all duration-300">
          <div>
            {/* Header selection info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-800 text-base font-evolventa tracking-tight">Панель управления смены</span>
                <span className="text-[10px] text-slate-400 font-extrabold mt-0.5 leading-none">
                  {formatSelectedDateHeader(selectedDate)}
                </span>
              </div>
              
              {/* Quick Hire trigger button */}
              <button
                onClick={handleOpenCreateDrawer}
                className="px-4 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-[10px] smooth-transition font-evolventa shadow-none cursor-pointer"
              >
                + Быстрое оформление
              </button>
            </div>

            {/* Day Summary Statistics Panel */}
            <div className="grid grid-cols-3 gap-3 mb-3.5 select-none">
              <div className="bg-slate-50/80 rounded-2xl p-2 md:p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Записей</span>
                <span className="text-sm font-black text-slate-800 mt-1 block font-evolventa">
                  {dayStats.total}
                </span>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-2 md:p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Выручка</span>
                <span className="text-sm font-black text-[#ff5a1f] mt-1 block font-evolventa">
                  {dayStats.revenue.toLocaleString('ru-RU')} <span className="text-[8px] font-bold text-slate-400">сум</span>
                </span>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-2 md:p-2.5 flex flex-col justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Выполнено</span>
                <div className="flex items-end gap-1.5 mt-1">
                  <span className="text-sm font-black text-emerald-600 block font-evolventa leading-none">
                    {dayStats.completed}
                  </span>
                  <span className="text-[9px] text-slate-455 font-bold block leading-none pb-0.5">
                    / {dayStats.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Free Windows Grid */}
            <div className="mb-3.5 select-none">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-evolventa">Свободные окна</span>
              {freeSlots.length === 0 ? (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100/50 text-slate-500">
                  <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-750 font-evolventa leading-tight">Все слоты заняты</span>
                    <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none font-evolventa">На сегодня свободных окон больше нет</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {freeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleOpenCreateDrawerWithTime(time)}
                      className="py-2 rounded-xl bg-slate-50 hover:bg-orange-50/50 hover:text-[#ff5a1f] text-slate-700 hover:border-[#ff5a1f]/30 border border-slate-100/60 text-[10px] font-black smooth-transition font-evolventa flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-none"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Masters on Shift Section */}
            <div className="border-t border-slate-100 pt-3 mt-4 select-none">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2.5 font-evolventa">Мастера на смене сегодня</span>
              <div className="space-y-1.5">
                {masters.filter(m => m.isActive).map((m) => {
                  const masterBookings = bookings.filter(b => b.date === selectedDate && b.masterId === m.id);
                  const count = masterBookings.length;
                  const activeConfig = masterColorConfig[m.id] || { bg: 'bg-slate-100 text-slate-500', text: '#64748b' };
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/60 smooth-transition">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black font-evolventa shrink-0 ${activeConfig.bg}`}>
                          {m.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                            <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(m.name)
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-750 font-evolventa leading-none">{m.name}</span>
                          <span className="text-[8px] text-slate-400 font-bold mt-0.5 leading-none font-evolventa">Смена: 09:00 - 21:00</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black font-evolventa ${
                          count > 0 ? 'bg-orange-50 text-[#ff5a1f]' : 'bg-slate-100/80 text-slate-400'
                        }`}>
                          {getBookingCountText(count)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {masters.filter(m => m.isActive).length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-[10px] font-bold font-evolventa">
                    Нет active мастеров на смене сегодня
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Month Grid Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-none flex flex-col justify-between transition-all duration-300">
          <div>
            {/* Header controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 select-none">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-base font-evolventa tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center smooth-transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center smooth-transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Week days labels */}
            <div className="grid grid-cols-7 gap-1 text-center select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-3 font-evolventa">
              <div>Пн</div>
              <div>Вт</div>
              <div>Ср</div>
              <div>Чт</div>
              <div>Пт</div>
              <div className="text-rose-500">Сб</div>
              <div className="text-rose-500">Вс</div>
            </div>

            {/* Monthly Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Previous month day cells */}
              {Array.from({ length: russianFirstDayIndex }).map((_, i) => {
                const day = prevMonthDaysCount - russianFirstDayIndex + 1 + i;
                return (
                  <div
                    key={`prev-${day}`}
                    onClick={() => handleSelectPrevMonthDay(day)}
                    className="h-12 md:h-13 rounded-xl p-1 md:p-1.5 flex flex-col justify-between border border-slate-100 bg-slate-50/10 text-slate-350 hover:bg-slate-50/30 hover:text-slate-500 cursor-pointer smooth-transition hover:scale-105 active:scale-95 select-none"
                  >
                    <span className="text-[10px] font-bold block text-slate-400/80">
                      {day}
                    </span>
                  </div>
                );
              })}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateString = formatDateString(day);
                const isSelected = selectedDate === dateString;
                const isToday = formatToday === dateString; // Today marker

                // Find bookings for this day
                const dayBookings = bookings.filter((b) => b.date === dateString);
                
                // Get unique master IDs
                const uniqueMasters = Array.from(new Set(dayBookings.map((b) => b.masterId)));

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateString)}
                    className={`h-12 md:h-13 rounded-xl p-1 md:p-1.5 flex flex-col justify-between cursor-pointer smooth-transition hover:scale-105 active:scale-95 border ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#ff7a45] to-[#ff5a1f] text-white border-[#ff5a1f]'
                        : isToday
                        ? 'bg-orange-50/20 border-[#ff5a1f]/35 text-slate-800 hover:bg-orange-50/45'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className={`text-[10px] font-extrabold block ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {day}
                    </span>

                    {/* Overlapping Master Initials Stacks */}
                    <div className="flex items-center -space-x-1 overflow-hidden select-none">
                      {uniqueMasters.slice(0, 2).map((mId) => {
                        const m = masters.find((mst) => mst.id === mId);
                        const initials = getInitials(m?.name || 'M');
                        const config = masterColorConfig[mId] || { bg: 'bg-slate-100 text-slate-500', text: '#000' };
                        return (
                          <span
                            key={mId}
                            className={`w-3.5 h-3.5 rounded-md overflow-hidden text-[6.5px] font-black flex items-center justify-center shrink-0 tracking-tighter ring-1 ${
                              isSelected
                                ? 'bg-white/20 text-white ring-orange-500/20'
                                : `${config.bg} ring-white`
                            }`}
                            title={m?.name}
                          >
                            {m?.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                              <img src={m.avatar} alt={m?.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </span>
                        );
                      })}
                      {uniqueMasters.length > 2 && (
                        <span
                          className={`w-3.5 h-3.5 rounded-md text-[6.5px] font-black flex items-center justify-center shrink-0 tracking-tighter ring-1 ${
                            isSelected
                              ? 'bg-white/20 text-white ring-orange-500/20'
                              : 'bg-slate-100 text-slate-400 ring-white'
                          }`}
                        >
                          +{uniqueMasters.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next month day cells */}
              {Array.from({ length: nextMonthDaysNeeded }).map((_, i) => {
                const day = i + 1;
                return (
                  <div
                    key={`next-${day}`}
                    onClick={() => handleSelectNextMonthDay(day)}
                    className="h-12 md:h-13 rounded-xl p-1 md:p-1.5 flex flex-col justify-between border border-slate-100 bg-slate-50/10 text-slate-350 hover:bg-slate-50/30 hover:text-slate-500 cursor-pointer smooth-transition hover:scale-105 active:scale-95 select-none"
                  >
                    <span className="text-[10px] font-bold block text-slate-400/80">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Bookings Table Queue (Full Width spanning from left to right) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none flex flex-col justify-between overflow-hidden">
        <div>
          {/* Header + Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col justify-between gap-4 select-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Записи на выбранный день</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Все сеансы на {formatSelectedDateHeader(selectedDate)}</p>
              </div>
            </div>

            {/* Search and Filters Block inside Bottom Section */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Поиск по клиенту или услуге..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:bg-white smooth-transition font-evolventa focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 placeholder:font-normal placeholder:text-slate-400"
                />
                <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-4 h-4 absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center rounded-full bg-slate-200/50 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Master Filter list */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa select-none overflow-x-auto scrollbar-none flex-nowrap max-w-full">
                <button
                  onClick={() => setSelectedMasterFilter(null)}
                  className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                    selectedMasterFilter === null
                      ? 'bg-white text-slate-800 border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Все мастера
                </button>
                {masters.filter(m => m.isActive).map((m) => {
                  const isSelected = selectedMasterFilter === m.id;
                  const initials = getInitials(m.name);
                  const config = masterColorConfig[m.id] || { bg: 'bg-slate-200 text-slate-650', text: '#005' };
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMasterFilter(isSelected ? null : m.id)}
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

              {/* Status Filter list */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa select-none overflow-x-auto scrollbar-none flex-nowrap max-w-full">
                <button
                  onClick={() => setSelectedStatusFilter(null)}
                  className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                    selectedStatusFilter === null
                      ? 'bg-white text-slate-800 border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Все статусы
                </button>
                {Object.entries(statusConfig).map(([statusKey, cfg]) => {
                  const isSelected = selectedStatusFilter === statusKey;
                  return (
                    <button
                      key={statusKey}
                      onClick={() => setSelectedStatusFilter(isSelected ? null : statusKey as Booking['status'])}
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
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[80px]">Время</th>
                  <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[150px]">Клиент</th>
                  <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[160px]">Услуга / Мастер</th>
                  <th className="py-3.5 px-4 sm:px-5 font-evolventa min-w-[125px]">Статус</th>
                  <th className="py-3.5 px-4 sm:px-5 font-evolventa text-right min-w-[120px]">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {selectedDayBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 select-none">
                      <p className="text-sm font-evolventa font-bold">Расписание пусто</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Нет записей, удовлетворяющих фильтрам.</p>
                    </td>
                  </tr>
                ) : (
                  selectedDayBookings.map((b) => {
                    const config = statusConfig[b.status] || statusConfig.new;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleOpenViewDrawer(b)}
                        className="hover:bg-slate-50/30 smooth-transition cursor-pointer group"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 sm:px-5">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-xs px-2 py-0.5 rounded-lg font-evolventa select-none">
                            {b.time}
                          </span>
                        </td>

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

                        {/* Service / Master */}
                        <td className="py-3 px-4 sm:px-5">
                          <div className="flex flex-col space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1 text-slate-700 font-evolventa text-[11px] font-bold">
                              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{getServiceName(b.serviceId)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 font-evolventa text-[8px] font-bold">
                              <svg className="w-2.5 h-2.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="truncate">{getMasterName(b.masterId)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 sm:px-5 relative">
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

                        {/* Quick Dynamic Actions */}
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
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
      </div>

      {/* SLIDING RIGHT DRAWER (CREATOR & VIEWER MODES) */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop blur overlay */}
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all"
        />

        {/* Panel Container */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200/80 shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex flex-col select-none">
              <h3 className="font-extrabold text-slate-800 text-base font-evolventa">
                {drawerMode === 'create' ? 'Быстрое оформление записи' : 'Детали визита клиента'}
              </h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5 leading-none">
                {drawerMode === 'create'
                  ? `Оформление бронирования на ${formatSelectedDateHeader(selectedDate)}`
                  : 'Просмотр и изменение статуса бронирования'}
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-200/50 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm smooth-transition hover:bg-slate-200 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form / Details Body */}
          {drawerMode === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Имя клиента</label>
                <input
                  type="text"
                  required
                  placeholder="Сардор Абдуллаев"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-medium"
                />
              </div>

              {/* Client Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Номер телефона</label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123-45-67"
                  value={formClientPhone}
                  onChange={(e) => setFormClientPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-medium"
                />
              </div>

              {/* Service Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Выберите услугу</label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-medium cursor-pointer"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price.toLocaleString('ru-RU')} сум)
                    </option>
                  ))}
                </select>
              </div>

              {/* Master Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Назначить мастера</label>
                <select
                  value={formMasterId}
                  onChange={(e) => setFormMasterId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-medium cursor-pointer"
                >
                  {masters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 font-evolventa">Время визита</label>
                  <select
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-medium cursor-pointer"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Display (Static selected) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 font-evolventa">Дата визита</label>
                  <div className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold select-none font-evolventa">
                    {formatSelectedDateHeader(selectedDate)}
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Комментарий администратора</label>
                <textarea
                  placeholder="Особые пожелания или детали..."
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f] focus:bg-white focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition h-20 resize-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/20 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-3 rounded-2xl hover:bg-slate-100 text-slate-500 font-bold text-xs smooth-transition font-evolventa cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-bold text-xs smooth-transition shadow-none font-evolventa cursor-pointer"
                >
                  Записать клиента
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            selectedBookingForView && (() => {
              const selectedServiceObj = services.find(s => s.id === selectedBookingForView.serviceId) || null;
              const selectedMasterObj = masters.find(m => m.id === selectedBookingForView.masterId) || null;
              return (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                  {/* Client Profile preview card with Arrow Link & Status */}
                  <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100 flex items-center justify-between gap-3 smooth-transition">
                    <Link
                      href={`/clients/${encodeURIComponent(selectedBookingForView.clientPhone)}`}
                      className="flex items-center gap-3 min-w-0 group/client cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-[10px] font-black font-evolventa shrink-0 select-none group-hover/client:bg-orange-100 smooth-transition">
                        {getInitials(selectedBookingForView.clientName)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-800 text-xs md:text-sm font-evolventa truncate leading-tight group-hover/client:text-[#ff5a1f] smooth-transition flex items-center gap-1">
                          {selectedBookingForView.clientName}
                          {selectedBookingForView.clientTelegramId && (
                            <span className="text-[8px] font-normal text-sky-500 bg-sky-50 border border-sky-100 px-0.5 rounded shrink-0">tg</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 font-evolventa leading-none">
                          {selectedBookingForView.clientPhone}
                        </span>
                      </div>
                    </Link>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-black border-none uppercase tracking-wide leading-none select-none shrink-0 ${statusConfig[selectedBookingForView.status]?.bg}`}>
                      <span className={`w-1 h-1 rounded-full ${statusConfig[selectedBookingForView.status]?.dot}`} />
                      {statusConfig[selectedBookingForView.status]?.label}
                    </span>
                  </div>

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
                          <span className="font-extrabold text-slate-800 text-xs md:text-sm leading-tight font-evolventa truncate max-w-[200px]" title={getServiceName(selectedBookingForView.serviceId)}>
                            {getServiceName(selectedBookingForView.serviceId)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-[#ff5a1f] font-evolventa bg-[#ff5a1f]/5 border border-[#ff5a1f]/10 px-2 py-0.5 rounded-lg select-none">
                          {selectedBookingForView.price.toLocaleString('ru-RU')} сум
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
                          <span className="text-slate-400">{getInitials(getMasterName(selectedBookingForView.masterId))}</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-bold text-slate-400 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Мастер</span>
                        <span className="font-extrabold text-slate-800 text-xs md:text-sm font-evolventa truncate">
                          {getMasterName(selectedBookingForView.masterId)}
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
                          <span className="font-extrabold text-slate-800 text-xs font-evolventa truncate">{formatSelectedDateHeader(selectedBookingForView.date)}</span>
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
                          <span className="font-extrabold text-slate-800 text-xs font-evolventa truncate">{selectedBookingForView.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client comment */}
                  {selectedBookingForView.comment && (
                    <div className="bg-orange-50/30 rounded-2xl border border-orange-100/30 p-3 flex gap-3">
                      <svg className="w-4 h-4 text-[#ff5a1f]/60 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.983 3v8h6c0 2.22-1.78 4-4 4-.26 0-.52-.02-.78-.07L10 18.12a8 8 0 008-8.12V3h-8.017zM2 11h6c0 2.22-1.78 4-4 4-.26 0-.52-.02-.78-.07L2 18.12a8 8 0 008-8.12V3H2v8z" />
                      </svg>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] font-bold text-[#ff5a1f]/80 font-evolventa uppercase tracking-wider mb-0.5 leading-none">Комментарий клиента</span>
                        <p className="text-slate-600 text-xs font-semibold leading-normal font-evolventa italic">
                          {selectedBookingForView.comment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions footer inside view mode — Sticky Status Change Grid */}
                <div className="border-t border-slate-100 p-4 shrink-0 bg-slate-50/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block select-none mb-2">Изменить статус визита</span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* CONFIRMED BUTTON */}
                    <button
                      onClick={() => {
                        updateBookingStatus(selectedBookingForView.id, 'confirmed');
                        setSelectedBookingForView(prev => prev ? { ...prev, status: 'confirmed' } : null);
                      }}
                      className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                        selectedBookingForView.status === 'confirmed'
                          ? 'bg-orange-50/60 border-[#ff5a1f]/35 text-[#ff5a1f]'
                          : 'border-slate-200 bg-white hover:bg-orange-50/20 text-slate-700 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                          selectedBookingForView.status === 'confirmed'
                            ? 'bg-[#ff5a1f] text-white'
                            : 'bg-orange-50 text-[#ff5a1f] group-hover/btn:bg-[#ff5a1f] group-hover/btn:text-white smooth-transition'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        {selectedBookingForView.status === 'confirmed' && (
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
                        updateBookingStatus(selectedBookingForView.id, 'completed');
                        setSelectedBookingForView(prev => prev ? { ...prev, status: 'completed' } : null);
                      }}
                      className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                        selectedBookingForView.status === 'completed'
                          ? 'bg-emerald-50/60 border-emerald-500/35 text-emerald-700'
                          : 'border-slate-200 bg-white hover:bg-emerald-50/20 text-slate-700 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                          selectedBookingForView.status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 text-emerald-600 group-hover/btn:bg-emerald-500 group-hover/btn:text-white smooth-transition'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        {selectedBookingForView.status === 'completed' && (
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
                        updateBookingStatus(selectedBookingForView.id, 'cancelled');
                        setSelectedBookingForView(prev => prev ? { ...prev, status: 'cancelled' } : null);
                      }}
                      className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                        selectedBookingForView.status === 'cancelled'
                          ? 'bg-rose-50/60 border-rose-500/35 text-rose-700'
                          : 'border-slate-200 bg-white hover:bg-rose-50/20 text-slate-700 hover:border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                          selectedBookingForView.status === 'cancelled'
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-50 text-rose-500 group-hover/btn:bg-rose-500 group-hover/btn:text-white smooth-transition'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                        {selectedBookingForView.status === 'cancelled' && (
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
                        updateBookingStatus(selectedBookingForView.id, 'noshow');
                        setSelectedBookingForView(prev => prev ? { ...prev, status: 'noshow' } : null);
                      }}
                      className={`p-3 rounded-2xl border text-left smooth-transition font-evolventa flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden group/btn ${
                        selectedBookingForView.status === 'noshow'
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold ${
                          selectedBookingForView.status === 'noshow'
                            ? 'bg-slate-550 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover/btn:bg-slate-550 group-hover/btn:text-white smooth-transition'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        </span>
                        {selectedBookingForView.status === 'noshow' && (
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
              </>
            );
          })()
          )}
        </div>
      </div>
    </div>
  );
}
