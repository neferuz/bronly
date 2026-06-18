'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '../../../hooks/useBusiness';

interface ClientSummary {
  name: string;
  phone: string;
  telegramId?: string;
  totalVisits: number;
  totalSpend: number;
  lastVisit: string;
  comment?: string;
}

export default function Clients() {
  const router = useRouter();
  const { bookings } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [visitsFilter, setVisitsFilter] = useState<'all' | 'frequent' | 'new' | 'inactive'>('all');
  const [minSpent, setMinSpent] = useState(0);
  const [maxSpent, setMaxSpent] = useState(1000000);

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

  // Extract unique clients from bookings
  const clientMap: { [phone: string]: ClientSummary } = {};

  bookings.forEach((b) => {
    const isCompleted = b.status === 'completed';
    const price = b.price;
    
    if (!clientMap[b.clientPhone]) {
      clientMap[b.clientPhone] = {
        name: b.clientName,
        phone: b.clientPhone,
        telegramId: b.clientTelegramId,
        totalVisits: isCompleted ? 1 : 0,
        totalSpend: isCompleted ? price : 0,
        lastVisit: b.date,
        comment: b.comment || 'Регулярный клиент'
      };
    } else {
      const current = clientMap[b.clientPhone];
      if (isCompleted) {
        current.totalVisits += 1;
        current.totalSpend += price;
      }
      // Pick the latest date
      if (new Date(b.date) > new Date(current.lastVisit)) {
        current.lastVisit = b.date;
      }
      if (b.comment) {
        current.comment = b.comment;
      }
    }
  });

  const uniqueClients = Object.values(clientMap);

  // Filtering Logic
  const filteredClients = uniqueClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);

    let matchesVisits = true;
    if (visitsFilter === 'frequent') matchesVisits = c.totalVisits >= 3;
    else if (visitsFilter === 'new') matchesVisits = c.totalVisits === 1;
    else if (visitsFilter === 'inactive') matchesVisits = c.totalVisits === 0;

    let matchesSpent = true;
    if (maxSpent < 1000000) {
      matchesSpent = c.totalSpend >= minSpent && c.totalSpend <= maxSpent;
    } else {
      matchesSpent = c.totalSpend >= minSpent;
    }

    return matchesSearch && matchesVisits && matchesSpent;
  });

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Unified Clients Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none overflow-hidden">
        {/* Header + Search + Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col gap-4 select-none">
          {/* Row 1: Title and Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Клиентская база</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Список всех клиентов, посетивших салон, и общая статистика</p>
            </div>
            
            {/* Search bar */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                placeholder="Поиск по имени или телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:bg-white smooth-transition font-evolventa focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 placeholder:font-normal placeholder:text-slate-400"
              />
              <span className="absolute left-3 top-3 text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="w-4 h-4 absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center rounded-full bg-slate-200/50 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Filters Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-4 sm:gap-6 text-[10px] font-bold font-evolventa">
            {/* Visits Segment Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider shrink-0">Визиты:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl overflow-x-auto scrollbar-none flex-nowrap max-w-full">
                {(['all', 'frequent', 'new', 'inactive'] as const).map((key) => {
                  const labels = {
                    all: 'Все',
                    frequent: 'Постоянные (3+)',
                    new: 'Новые (1)',
                    inactive: 'Спящие (0)'
                  };
                  const isSelected = visitsFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setVisitsFilter(key)}
                      className={`px-3 py-1.5 rounded-lg smooth-transition shrink-0 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-white text-slate-800 border border-slate-200/40'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {labels[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spent Range Slider */}
            <div className="flex flex-row items-center gap-3 select-none w-full sm:w-auto">
              <div className="flex flex-col gap-0.5 shrink-0">
                <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Сумма трат:</span>
                <span className="text-slate-700 font-bold text-[10px] min-w-[140px] font-evolventa">
                  от {minSpent.toLocaleString('ru-RU')} до {maxSpent >= 1000000 ? '1M+' : maxSpent.toLocaleString('ru-RU')} сум
                </span>
              </div>
              <div className="relative w-48 h-5 flex items-center group">
                {/* The track background */}
                <div className="absolute left-0 right-0 h-1 bg-slate-100 rounded-full" />
                
                {/* Active fill line */}
                <div
                  className="absolute h-1 bg-[#ff5a1f] rounded-full transition-all duration-150"
                  style={{
                    left: `${(minSpent / 1000000) * 100}%`,
                    right: `${100 - (maxSpent / 1000000) * 100}%`
                  }}
                />
                
                {/* Left slider thumb */}
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="50000"
                  value={minSpent}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), maxSpent - 50000);
                    setMinSpent(val);
                  }}
                  className="absolute pointer-events-none appearance-none z-10 w-full h-1 bg-transparent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#ff5a1f] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-120"
                />
                
                {/* Right slider thumb */}
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="50000"
                  value={maxSpent}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), minSpent + 50000);
                    setMaxSpent(val);
                  }}
                  className="absolute pointer-events-none appearance-none z-10 w-full h-1 bg-transparent cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#ff5a1f] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-120"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-5 font-evolventa min-w-[150px]">Имя клиента</th>
                <th className="py-3.5 px-5 font-evolventa min-w-[120px]">Телефон</th>
                <th className="py-3.5 px-5 font-evolventa min-w-[130px]">Telegram ID</th>
                <th className="py-3.5 px-5 font-evolventa text-center min-w-[80px]">Визитов</th>
                <th className="py-3.5 px-5 font-evolventa text-right min-w-[110px]">Потрачено</th>
                <th className="py-3.5 px-5 font-evolventa min-w-[130px]">Последний визит</th>
                <th className="py-3.5 px-5 font-evolventa min-w-[180px]">Заметки / Комментарии</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 select-none">
                    <p className="text-sm font-evolventa font-bold">Клиенты не найдены</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr
                    key={c.phone}
                    onClick={() => router.push(`/clients/${encodeURIComponent(c.phone)}`)}
                    className="hover:bg-slate-50/30 smooth-transition cursor-pointer"
                  >
                    {/* Client Name */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        {(() => {
                          let avatarClass = 'bg-slate-50 text-slate-500 border-slate-200/50';
                          if (c.totalSpend >= 500000) {
                            avatarClass = 'bg-orange-50 text-[#ff5a1f] border-orange-100';
                          } else if (c.totalSpend >= 100000) {
                            avatarClass = 'bg-blue-50 text-blue-600 border-blue-100';
                          }
                          return (
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[9px] font-black select-none font-evolventa shrink-0 ${avatarClass}`}>
                              {getInitials(c.name)}
                            </div>
                          );
                        })()}
                        <span className="font-extrabold text-slate-800 text-[11px] leading-tight font-evolventa">{c.name}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-5 font-bold text-slate-500 font-evolventa text-[11px]">
                      {c.phone}
                    </td>

                    {/* Telegram */}
                    <td className="py-3 px-5">
                      {c.telegramId ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black border border-sky-100 bg-sky-50 text-sky-600 font-evolventa leading-none">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Telegram_Messenger.png" alt="Telegram" className="w-3 h-3" />
                          {c.telegramId}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium italic">—</span>
                      )}
                    </td>

                    {/* Visits */}
                    <td className="py-3 px-5 text-center">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-[11px] px-2 py-0.5 rounded-lg font-evolventa select-none">
                        {c.totalVisits}
                      </span>
                    </td>

                    {/* Spend */}
                    <td className="py-3 px-5">
                      <div className="flex flex-col items-end gap-1.5 select-none">
                        <span className="font-black text-slate-800 text-xs">
                          {c.totalSpend.toLocaleString('ru-RU')} сум
                        </span>
                        {/* Spent progress bar line */}
                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              c.totalSpend >= 500000
                                ? 'bg-[#ff5a1f]'
                                : c.totalSpend >= 100000
                                ? 'bg-blue-500'
                                : c.totalSpend > 0
                                ? 'bg-slate-300'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${Math.min((c.totalSpend / 1000000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-5 text-slate-500 font-bold font-evolventa text-[11px]">
                      {formatDateString(c.lastVisit)}
                    </td>

                    {/* Commentary */}
                    <td className="py-3 px-5 max-w-[200px] truncate text-slate-400 font-medium italic text-[10px]">
                      {c.comment || 'Обычный визит'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (hidden on screen sizes md and larger) */}
        <div className="md:hidden space-y-3 p-4 bg-slate-50/10">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-400 select-none">
              <p className="text-sm font-evolventa font-bold">Клиенты не найдены</p>
              <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска.</p>
            </div>
          ) : (
            filteredClients.map((c) => {
              let avatarClass = 'bg-slate-50 text-slate-500 border-slate-200/50';
              if (c.totalSpend >= 500000) {
                avatarClass = 'bg-orange-50 text-[#ff5a1f] border-orange-100';
              } else if (c.totalSpend >= 100000) {
                avatarClass = 'bg-blue-50 text-blue-600 border-blue-100';
              }
              return (
                <div
                  key={c.phone}
                  onClick={() => router.push(`/clients/${encodeURIComponent(c.phone)}`)}
                  className="bg-white rounded-3xl border border-slate-200/80 p-4 flex flex-col gap-3.5 hover:bg-slate-50/10 smooth-transition active:scale-[0.99] cursor-pointer"
                >
                  {/* Header: Avatar, Name & Telegram */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[10px] font-black select-none font-evolventa shrink-0 ${avatarClass}`}>
                        {getInitials(c.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-800 text-xs leading-tight font-evolventa truncate">{c.name}</span>
                        <span className="text-[9.5px] text-slate-400 font-bold leading-normal mt-0.5 font-evolventa">{c.phone}</span>
                      </div>
                    </div>

                    {c.telegramId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black border border-sky-100 bg-sky-50 text-sky-600 font-evolventa leading-none shrink-0">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Telegram_Messenger.png" alt="Telegram" className="w-3 h-3" />
                        {c.telegramId}
                      </span>
                    )}
                  </div>

                  <div className="h-[1px] bg-slate-100" />

                  {/* Body: Visits & Spend, Last Visit */}
                  <div className="grid grid-cols-2 gap-3.5 text-[10px] font-evolventa">
                    {/* Total Visits badge */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Всего визитов</span>
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-extrabold text-[10.5px] px-2.5 py-0.5 rounded-md self-start mt-0.5">
                        {c.totalVisits}
                      </span>
                    </div>

                    {/* Last Visit */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Последний визит</span>
                      <span className="text-slate-600 font-extrabold text-[10.5px] mt-0.5">
                        {formatDateString(c.lastVisit)}
                      </span>
                    </div>

                    {/* Spend and spent progress bar */}
                    <div className="flex flex-col gap-1 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Сумма покупок</span>
                        <span className="font-black text-slate-800 text-xs">
                          {c.totalSpend.toLocaleString('ru-RU')} сум
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            c.totalSpend >= 500000
                              ? 'bg-[#ff5a1f]'
                              : c.totalSpend >= 100000
                              ? 'bg-blue-500'
                              : c.totalSpend > 0
                              ? 'bg-slate-300'
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${Math.min((c.totalSpend / 1000000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Commentary */}
                    {c.comment && (
                      <div className="flex flex-col gap-0.5 col-span-2">
                        <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Заметки / Комментарии</span>
                        <p className="text-slate-500 font-medium italic mt-0.5 text-[9.5px] leading-relaxed">
                          {c.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
