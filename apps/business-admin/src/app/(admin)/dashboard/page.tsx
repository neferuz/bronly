'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusiness } from '../../../hooks/useBusiness';

export default function Dashboard() {
  const { bookings, masters, services, updateBookingStatus } = useBusiness();
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'confirmed' | 'completed'>('all');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(6);

  // Use real Tashkent date
  const getTashkentToday = () => {
    const now = new Date();
    const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const d = new Date(tashkentStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTashkentToday();

  // Today's bookings
  const todayBookings = useMemo(() =>
    bookings
      .filter((b) => b.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [bookings, todayStr]
  );

  const completedToday = todayBookings.filter((b) => b.status === 'completed');
  const revenueToday = completedToday.reduce((sum, b) => sum + b.price, 0);
  const activeMastersCount = masters.filter((m) => m.isActive).length;

  // Unique clients count (from all bookings)
  const uniqueClientsCount = useMemo(() => {
    const phones = new Set(bookings.map(b => b.clientPhone));
    return phones.size;
  }, [bookings]);

  // --- Weekly chart data from real bookings ---
  const chartData = useMemo(() => {
    const dayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const days: { dateStr: string; label: string; revenue: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const now = new Date();
      const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
      const d = new Date(tashkentStr);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label = dayLabels[d.getDay()];

      const dayRevenue = bookings
        .filter(b => b.date === dateStr && (b.status === 'completed' || b.status === 'confirmed' || b.status === 'new'))
        .reduce((sum, b) => sum + b.price, 0);

      days.push({ dateStr, label, revenue: dayRevenue });
    }

    // Compute Y positions (inverted: higher value = lower y)
    const maxRevenue = Math.max(...days.map(d => d.revenue), 1);
    const xPositions = [25, 67, 109, 151, 193, 235, 275];

    return days.map((d, i) => {
      const normalizedY = maxRevenue > 0 ? (d.revenue / maxRevenue) : 0;
      const y = 105 - (normalizedY * 90); // y range: 15 (top) to 105 (bottom)
      const valStr = d.revenue >= 1000000
        ? `${(d.revenue / 1000000).toFixed(1)}M`
        : d.revenue >= 1000
        ? `${(d.revenue / 1000).toFixed(0)}k`
        : `${d.revenue}`;
      return {
        label: d.label,
        val: `${valStr} сум`,
        y,
        x: xPositions[i],
        revenue: d.revenue,
        dateStr: d.dateStr
      };
    });
  }, [bookings]);

  // Week-over-week change
  const weekRevenueChange = useMemo(() => {
    const thisWeekRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
    // Calculate previous week
    const prevWeekDays: string[] = [];
    for (let i = 13; i >= 7; i--) {
      const now = new Date();
      const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
      const d = new Date(tashkentStr);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      prevWeekDays.push(`${yyyy}-${mm}-${dd}`);
    }
    const prevWeekRevenue = bookings
      .filter(b => prevWeekDays.includes(b.date) && (b.status === 'completed' || b.status === 'confirmed' || b.status === 'new'))
      .reduce((s, b) => s + b.price, 0);

    if (prevWeekRevenue === 0) return thisWeekRevenue > 0 ? '+100%' : '0%';
    const change = ((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }, [bookings, chartData]);

  const linePathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x},${d.y}`).join(' ');
  const areaPathD = `${linePathD} L275,110 L25,110 Z`;
  const activePoint = hoveredPointIndex !== null ? chartData[hoveredPointIndex] : null;
  let tooltipXOffset = 0;
  if (activePoint) {
    if (activePoint.x < 35) tooltipXOffset = 35 - activePoint.x;
    if (activePoint.x > 265) tooltipXOffset = 265 - activePoint.x;
  }

  const getMasterName = (id: string) => masters.find((m) => m.id === id)?.name || 'Неизвестно';
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Неизвестно';

  const getInitials = (name: string) => {
    if (!name) return 'К';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const statusConfig: Record<string, { bg: string; label: string; dot: string }> = {
    new: { bg: 'bg-blue-50 text-blue-600 border-transparent', label: 'Новая', dot: 'bg-blue-500' },
    confirmed: { bg: 'bg-orange-50 text-[#ff5a1f] border-transparent', label: 'Подтверждена', dot: 'bg-[#ff5a1f]' },
    completed: { bg: 'bg-emerald-50 text-emerald-600 border-transparent', label: 'Выполнена', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-50 text-rose-600 border-transparent', label: 'Отменена', dot: 'bg-rose-500' },
    noshow: { bg: 'bg-slate-100 text-slate-500 border-transparent', label: 'Неявка', dot: 'bg-slate-400' }
  };

  // Format today for display
  const todayDisplay = (() => {
    const now = new Date();
    const tashkentStr = now.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: 'numeric', month: 'short' });
    return tashkentStr;
  })();

  // New bookings count (for attention badge)
  const newBookingsCount = bookings.filter(b => b.status === 'new').length;

  // Total bookings count
  const totalBookingsCount = bookings.length;

  return (
    <div className="space-y-6 w-full font-sans">
      {/* 4 FLAT METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Выручка сегодня</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] border border-emerald-100">
              UZS
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {revenueToday.toLocaleString('ru-RU')} сум
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">
              {completedToday.length > 0 ? `${completedToday.length} выполн. визитов` : 'Нет выполненных визитов'}
            </span>
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Записи сегодня</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="4" />
                <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {todayBookings.length} визитов
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">
              На {todayDisplay}
              {newBookingsCount > 0 && (
                <span className="ml-1 text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-black">{newBookingsCount} новых</span>
              )}
            </span>
          </div>
        </div>

        {/* Active Masters */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Мастера на смене</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path strokeLinecap="round" d="M9 12h6M12 12v-4m0 4v4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {activeMastersCount} / {masters.length}
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">Сотрудники в штате</span>
          </div>
        </div>

        {/* Unique clients */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Клиенты</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {uniqueClientsCount} клиентов
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">
              Всего {totalBookingsCount} записей
            </span>
          </div>
        </div>
      </div>

      {/* ANALYTICS & WORKLOAD GRID (Above the queue table) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Analytics Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none space-y-4">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between select-none">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Аналитика визитов</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Динамика за последние 7 дней</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border font-evolventa ${
              weekRevenueChange.startsWith('+') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
              : weekRevenueChange.startsWith('-') ? 'text-rose-600 bg-rose-50 border-rose-100'
              : 'text-slate-500 bg-slate-50 border-slate-100'
            }`}>
              {weekRevenueChange}
            </span>
          </div>

          {/* SVG Area Chart */}
          <div className="relative pt-2">
            <svg
              viewBox="0 -20 300 165"
              className="w-full h-auto overflow-visible"
              onMouseLeave={() => setHoveredPointIndex(6)}
            >
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5a1f" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ff5a1f" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="300" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="300" y2="110" stroke="#f1f5f9" strokeWidth="1" />

              {/* Path Area */}
              <path d={areaPathD} fill="url(#chartGlow)" />

              {/* Path Line */}
              <path
                d={linePathD}
                fill="none"
                stroke="#ff5a1f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Vertical dashed indicator line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1="-10"
                  x2={activePoint.x}
                  y2="110"
                  stroke="#ff5a1f"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.4"
                  className="transition-all duration-150"
                />
              )}

              {/* Dots (Static & Hovered/Pulsing) */}
              {chartData.map((d, idx) => {
                const isHovered = hoveredPointIndex === idx;
                return (
                  <g key={idx}>
                    {isHovered && (
                      <circle
                        cx={d.x}
                        cy={d.y}
                        r="8"
                        fill="#ff5a1f"
                        fillOpacity="0.25"
                        className="animate-ping"
                        style={{ transformOrigin: `${d.x}px ${d.y}px` }}
                      />
                    )}
                    <circle
                      cx={d.x}
                      cy={d.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={isHovered ? '#ff5a1f' : '#ffffff'}
                      stroke="#ff5a1f"
                      strokeWidth={isHovered ? 2 : 1.5}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}
              
              {/* Dynamic Tooltip */}
              {activePoint && (
                <g
                  transform={`translate(${activePoint.x + tooltipXOffset}, ${activePoint.y - 25})`}
                  className="transition-all duration-200 ease-out pointer-events-none"
                >
                  <rect x="-35" y="-10" width="70" height="18" rx="5" fill="#1e293b" />
                  <text x="0" y="2" fill="white" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="font-evolventa">
                    {activePoint.val}
                  </text>
                  <polygon points={`${-tooltipXOffset - 4},8 ${-tooltipXOffset + 4},8 ${-tooltipXOffset},11`} fill="#1e293b" />
                </g>
              )}

              {/* Aligned X-Axis Labels */}
              {chartData.map((d, idx) => {
                const isHovered = hoveredPointIndex === idx;
                return (
                  <text
                    key={idx}
                    x={d.x}
                    y="130"
                    textAnchor="middle"
                    className={`text-[9px] font-black tracking-wider transition-all duration-200 select-none font-evolventa ${
                      isHovered ? 'fill-slate-800 font-extrabold' : 'fill-slate-400 font-semibold'
                    }`}
                  >
                    {d.label}
                  </text>
                );
              })}

              {/* Hover Hit areas */}
              {chartData.map((d, idx) => {
                const boxWidth = 300 / 7;
                const boxX = idx * boxWidth;
                return (
                  <rect
                    key={idx}
                    x={boxX}
                    y="-20"
                    width={boxWidth}
                    height="165"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Master Workload Timeline Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 select-none">
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Занятость мастеров сегодня</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Почасовой график работы</p>
            </div>

            <div className="space-y-4">
              {masters.filter(m => m.isActive).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-evolventa font-bold">Нет активных мастеров</p>
                  <p className="text-[10px] mt-1 font-evolventa">Добавьте мастеров в разделе «Мастера»</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5 scrollbar-none">
                  <div className="min-w-[440px] xl:min-w-full space-y-3">
                    {/* Time labels header */}
                    <div className="flex items-center gap-3 border-b border-slate-100/60 pb-2 mb-1">
                      <div className="w-28 sm:w-36 shrink-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-evolventa">Мастер</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1 select-none">
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((slot) => (
                          <div key={slot} className="flex-1 text-center text-[9px] font-black text-slate-400 font-evolventa">
                            {slot.split(':')[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Master workload rows */}
                    {masters.filter(m => m.isActive).map((m) => {
                      const masterBookings = todayBookings.filter(b => b.masterId === m.id);
                      const slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
                      const totalSlots = slots.length;
                      const bookedSlots = masterBookings.length;
                      const percent = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

                      return (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="w-28 sm:w-36 shrink-0 flex items-center gap-2 min-w-0">
                            {m.avatar && (m.avatar.startsWith('http') || m.avatar.startsWith('data:') || m.avatar.startsWith('/')) ? (
                              <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-lg object-cover border border-slate-200/50 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-[9px] border border-slate-200/50 font-evolventa shrink-0">
                                {getInitials(m.name)}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-700 truncate text-[11px] leading-tight font-evolventa" title={m.name}>
                                {m.name}
                              </span>
                              <span className="text-[8px] font-extrabold text-[#ff5a1f] uppercase tracking-wide font-evolventa mt-0.5">
                                {percent}% загр.
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 flex items-center gap-1">
                            {slots.map((slot) => {
                              const isBooked = masterBookings.some(b => {
                                const bHour = parseInt(b.time.split(':')[0]);
                                const slotHour = parseInt(slot.split(':')[0]);
                                return bHour === slotHour;
                              });
                              const isCompleted = masterBookings.some(b => {
                                const bHour = parseInt(b.time.split(':')[0]);
                                const slotHour = parseInt(slot.split(':')[0]);
                                return bHour === slotHour && b.status === 'completed';
                              });
                              
                              let blockClass = "h-4 flex-1 rounded-md border border-slate-100 bg-slate-50 transition-all duration-200";
                              if (isBooked) {
                                blockClass = isCompleted 
                                  ? "h-4 flex-1 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-700"
                                  : "h-4 flex-1 rounded-md bg-orange-100 border border-orange-200 text-[#ff5a1f]";
                              }

                              return (
                                <div
                                  key={slot}
                                  title={`${slot}: ${isBooked ? (isCompleted ? 'Визит завершен' : 'Занято') : 'Свободно'}`}
                                  className={`${blockClass} relative group cursor-pointer`}
                                >
                                  <span className="absolute bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-800 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none z-20 shadow whitespace-nowrap">
                                    {slot}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend and Stats Footer to balance empty space */}
          <div className="border-t border-slate-100 pt-4 mt-2 space-y-3 select-none">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-wider font-evolventa">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200/50 block" />
                <span>Свободно</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange-100 border border-orange-200 block" />
                <span>Занято</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200 block" />
                <span>Выполнено</span>
              </div>
            </div>

            {/* Shift Stats */}
            <div className="bg-slate-50 rounded-2xl p-2.5 flex items-center justify-between border border-slate-100">
              <div className="text-center flex-1 border-r border-slate-200/60">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">На смене</span>
                <span className="text-xs font-extrabold text-slate-700 block mt-0.5 font-evolventa">{activeMastersCount} маст.</span>
              </div>
              <div className="text-center flex-1 border-r border-slate-200/60">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Загрузка смены</span>
                <span className="text-xs font-extrabold text-[#ff5a1f] block mt-0.5 font-evolventa">
                  {(() => {
                    const totalSlots = activeMastersCount * 12;
                    const bookedSlots = todayBookings.filter(b => b.status !== 'cancelled').length;
                    return totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
                  })()}%
                </span>
              </div>
              <div className="text-center flex-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Выполнено</span>
                <span className="text-xs font-extrabold text-emerald-600 block mt-0.5 font-evolventa">
                  {(() => {
                    const finished = todayBookings.filter(b => b.status === 'completed').length;
                    const total = todayBookings.length;
                    return total > 0 ? Math.round((finished / total) * 100) : 0;
                  })()}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Bookings Queue (Full width) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none flex flex-col justify-between overflow-hidden">
        <div>
          {/* Header + Tabs */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Очередь записей на сегодня</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Интерактивный список визитов • {todayDisplay}</p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa overflow-x-auto scrollbar-none flex-nowrap max-w-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-white text-slate-800 shadow-none border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Все ({todayBookings.length})
              </button>
              <button
                onClick={() => setStatusFilter('new')}
                className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                  statusFilter === 'new' ? 'bg-white text-[#ff5a1f] shadow-none border border-slate-200/40' : 'text-slate-500 hover:text-[#ff5a1f]'
                }`}
              >
                Новые ({todayBookings.filter(b => b.status === 'new').length})
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                  statusFilter === 'confirmed' ? 'bg-white text-orange-600 shadow-none border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Подтвержденные ({todayBookings.filter(b => b.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap ${
                  statusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-none border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Завершенные ({todayBookings.filter(b => b.status === 'completed').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5 font-evolventa min-w-[80px]">Время</th>
                  <th className="py-3.5 px-5 font-evolventa min-w-[150px]">Клиент</th>
                  <th className="py-3.5 px-5 font-evolventa min-w-[160px]">Услуга / Мастер</th>
                  <th className="py-3.5 px-5 font-evolventa min-w-[100px]">Сумма</th>
                  <th className="py-3.5 px-5 font-evolventa min-w-[120px]">Статус</th>
                  <th className="py-3.5 px-5 font-evolventa text-right min-w-[100px]">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {todayBookings.filter(b => statusFilter === 'all' || b.status === statusFilter).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <p className="text-sm font-evolventa">Записей с таким статусом нет</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Все новые бронирования отобразятся здесь.</p>
                    </td>
                  </tr>
                ) : (
                  todayBookings
                    .filter(b => statusFilter === 'all' || b.status === statusFilter)
                    .map((b) => {
                      const config = statusConfig[b.status] || statusConfig.new;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/30 smooth-transition">
                          {/* Time */}
                          <td className="py-3 px-5">
                            <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-xs px-2 py-0.5 rounded-lg font-evolventa select-none">
                              {b.time}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-3 px-5">
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

                          {/* Service & Master */}
                          <td className="py-3 px-5">
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

                          {/* Price */}
                          <td className="py-3 px-5">
                            <span className="font-extrabold text-slate-800 text-[12px] font-evolventa whitespace-nowrap">
                              {b.price.toLocaleString('ru-RU')} сум
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border-none leading-none select-none ${config.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                              {config.label}
                            </span>
                          </td>

                          {/* Quick Dynamic Actions */}
                          <td className="py-3 px-5 text-right" onClick={(e) => e.stopPropagation()}>
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

      {/* Floating Action Button (FAB) in the bottom-right corner */}
      <div className="fixed bottom-8 right-8 z-50 select-none">
        <div className="relative">
          {/* Dropdown Menu (sliding up from bottom right) */}
          {actionsOpen && (
            <>
              {/* Invisible Click Overlay to close when clicked outside */}
              <div className="fixed inset-0 z-40" onClick={() => setActionsOpen(false)} />
              
              <div className="absolute bottom-16 right-0 w-64 bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-50 flex flex-col space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-evolventa">Быстрые действия</span>
                </div>
                <Link
                  href="/calendar"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs smooth-transition font-evolventa"
                  onClick={() => setActionsOpen(false)}
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#ff5a1f] flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span>Оформить новую запись</span>
                </Link>
                <Link
                  href="/masters"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs smooth-transition font-evolventa"
                  onClick={() => setActionsOpen(false)}
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span>Нанять мастера / смены</span>
                </Link>
                <Link
                  href="/services"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold text-xs smooth-transition font-evolventa"
                  onClick={() => setActionsOpen(false)}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <span>Настроить каталог услуг</span>
                </Link>
              </div>
            </>
          )}

          {/* Core FAB round trigger button */}
          <button
            onClick={() => setActionsOpen(!actionsOpen)}
            className="w-14 h-14 rounded-full bg-[#ff5a1f] hover:bg-[#e04f1a] text-white flex items-center justify-center shadow-xl shadow-orange-600/20 smooth-transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${actionsOpen ? 'rotate-45' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
