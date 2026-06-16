'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useToast } from '../../components/ui/Toast';

function generateSlug(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };
  
  return text
    .toLowerCase()
    .split('')
    .map(char => cyrillicToLatin[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function Dashboard() {
  const { showToast } = useToast();
  const { businesses, stats, addBusiness, loading, error, fetchData } = useSuperAdmin();
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(6);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAnimateOpen, setIsAnimateOpen] = useState(false);

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setTimeout(() => setIsAnimateOpen(true), 10);
  };

  const closeAddModal = () => {
    setIsAnimateOpen(false);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsSlugEdited(false);
    }, 300);
  };

  // Form state for registering new business
  const [newBranch, setNewBranch] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    city: 'Ташкент'
  });
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const handleNameChange = (name: string) => {
    setNewBranch(prev => {
      const updated = { ...prev, name };
      if (!isSlugEdited) {
        updated.slug = generateSlug(name);
      }
      return updated;
    });
  };

  const handleSlugChange = (slugInput: string) => {
    setIsSlugEdited(true);
    const cleaned = slugInput.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setNewBranch(prev => ({ ...prev, slug: cleaned }));
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.ownerName || !newBranch.ownerEmail || !newBranch.ownerPhone || !newBranch.password) {
      showToast('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }
    try {
      await addBusiness(newBranch);
      closeAddModal();
      setNewBranch({
        name: '',
        slug: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: '',
        city: 'Ташкент'
      });
      setIsSlugEdited(false);
    } catch (err) {
      // Error is handled inside addBusiness hook
    }
  };

  // Weekly bookings trend calculations for chart representation
  const chartData = [
    { label: 'Пн', val: '12 сессий', y: 85, x: 25 },
    { label: 'Вт', val: '24 сессии', y: 65, x: 67 },
    { label: 'Ср', val: '18 сессий', y: 85, x: 109 },
    { label: 'Чт', val: '32 сессии', y: 45, x: 151 },
    { label: 'Пт', val: '45 сессий', y: 25, x: 193 },
    { label: 'Сб', val: '28 сессий', y: 65, x: 235 },
    { label: 'Вс', val: `${stats.totalBookings} сессий`, y: 15, x: 275 }
  ];

  const linePathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x},${d.y}`).join(' ');
  const areaPathD = `${linePathD} L275,110 L25,110 Z`;
  const activePoint = hoveredPointIndex !== null ? chartData[hoveredPointIndex] : null;
  let tooltipXOffset = 0;
  if (activePoint) {
    if (activePoint.x < 35) tooltipXOffset = 35 - activePoint.x;
    if (activePoint.x > 265) tooltipXOffset = 265 - activePoint.x;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/35 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 font-evolventa">Загрузка данных платформы...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans">
      {/* 3 FLAT METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total businesses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Всего бизнесов</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {stats.totalBusinesses} филиалов
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">{stats.activeBusinesses} активных</span>
          </div>
        </div>

        {/* Total bookings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Активные записи</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="4" />
                <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {stats.totalBookings} сессий
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">Суммарно по всем филиалам</span>
          </div>
        </div>

        {/* Mini App clicks */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none smooth-transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Всего переходов</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 2-1 4-4 4 3 0 4 2 4 4 0-2 1-4 4-4-3 0-4-2-4-4zm6 11c0 1.5-.75 3-3 3 2.25 0 3 1.5 3 3 0-1.5.75-3 3-3-2.25 0-3-1.5-3-3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-base md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
              {stats.totalMiniAppClicks} кликов
            </h3>
            <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-evolventa">Трафик Telegram Mini App</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: CHART & ACTIVE BUSINESSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Bookings Analytics Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between select-none">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Динамика сессий записи</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Прирост активности клиентов за 7 дней</p>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 font-evolventa">
                Активно
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

                {/* Dots */}
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
                    <text x="0" y="2" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-evolventa">
                      {activePoint.val}
                    </text>
                    <polygon points={`${-tooltipXOffset - 4},8 ${-tooltipXOffset + 4},8 ${-tooltipXOffset},11`} fill="#1e293b" />
                  </g>
                )}

                {/* X-Axis Labels */}
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

          {/* Quick Info Bar */}
          <div className="border-t border-slate-100 pt-3 mt-3 select-none flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">
            <span>Обновлено: только что</span>
            <span>Период: 7 дней</span>
          </div>
        </div>

        {/* Active Businesses list */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 select-none flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Активные салоны</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Недавно зарегистрированные бизнесы</p>
              </div>
              <Link
                href="/businesses"
                className="text-[10px] font-bold text-[#ff5a1f] hover:underline font-evolventa"
              >
                Все салоны →
              </Link>
            </div>

            <div className="space-y-4">
              {businesses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-evolventa">Нет зарегистрированных салонов</p>
              ) : (
                businesses.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-xs font-black font-evolventa select-none shrink-0 font-evolventa">
                        {b.name[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-extrabold text-slate-800 truncate font-evolventa">
                          {b.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-evolventa truncate">
                          {b.city} • Владелец: {b.ownerName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${b.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={b.status === 'active' ? 'Активен' : 'Заблокирован'} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Action Footer to balance spacing */}
          <div className="border-t border-slate-100 pt-3.5 mt-3 select-none flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 font-evolventa">Всего на платформе: {businesses.length}</span>
            <button
              onClick={openAddModal}
              className="text-[10px] font-black text-[#ff5a1f] hover:text-[#e04f1a] font-evolventa cursor-pointer"
            >
              + Добавить салон
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for adding business */}
      <div className="fixed bottom-8 right-8 z-50 select-none">
        <button
          onClick={openAddModal}
          title="Зарегистрировать новый салон"
          className="w-14 h-14 rounded-full bg-[#ff5a1f] hover:bg-[#e04f1a] text-white flex items-center justify-center shadow-xl shadow-orange-600/20 smooth-transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* REGISTER NEW BUSINESS DRAWER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-350 ease-out ${
              isAnimateOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeAddModal}
          />
          
          {/* Drawer Panel */}
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl flex flex-col justify-between p-6 transition-transform duration-300 ease-out z-10 ${
              isAnimateOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Регистрация бизнеса</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Создание новой точки в Bronly Platform</p>
              </div>
              <button onClick={closeAddModal} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleAddBusiness} className="flex-1 py-6 space-y-5 overflow-y-auto pr-1">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Название салона *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Elite Barber"
                  value={newBranch.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Slug / Адрес ссылки *</label>
                  <span className="text-[8px] text-slate-455 font-bold font-evolventa">
                    client.bronly-hub.uz/{newBranch.slug || '...'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Например: elite-barber"
                  value={newBranch.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Имя владельца *</label>
                <input
                  type="text"
                  required
                  placeholder="Алексей Смирнов"
                  value={newBranch.ownerName}
                  onChange={(e) => setNewBranch({ ...newBranch, ownerName: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Email владельца (логин CRM) *</label>
                <input
                  type="email"
                  required
                  placeholder="owner@salon.com"
                  value={newBranch.ownerEmail}
                  onChange={(e) => setNewBranch({ ...newBranch, ownerEmail: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Телефон *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123-45-67"
                    value={newBranch.ownerPhone}
                    onChange={(e) => setNewBranch({ ...newBranch, ownerPhone: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Пароль CRM *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newBranch.password}
                    onChange={(e) => setNewBranch({ ...newBranch, password: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Город</label>
                <div className="relative">
                  <select
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition cursor-pointer"
                  >
                    <option value="Ташкент">Ташкент</option>
                    <option value="Самарканд">Самарканд</option>
                    <option value="Бухара">Бухара</option>
                    <option value="Андижан">Андижан</option>
                    <option value="Карши">Карши</option>
                    <option value="Нукус">Нукус</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={closeAddModal}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-3.5 rounded-xl smooth-transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={handleAddBusiness}
                className="flex-1 bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-bold text-xs py-3.5 rounded-xl smooth-transition cursor-pointer"
              >
                Зарегистрировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
