'use client';

import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';

interface DayConfig {
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function Schedule() {
  const { miniAppSettings, updateMiniAppSettings } = useBusiness();
  const { showToast } = useToast();
  const [salonDays, setSalonDays] = useState<DayConfig[]>([
    { dayName: 'Понедельник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Вторник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Среда', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Четверг', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Пятница', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Суббота', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { dayName: 'Воскресенье', isOpen: false, openTime: '10:00', closeTime: '18:00' }
  ]);

  useEffect(() => {
    if (miniAppSettings?.schedule) {
      try {
        const parsed = JSON.parse(miniAppSettings.schedule);
        if (Array.isArray(parsed) && parsed.length === 7) {
          setSalonDays(parsed);
        }
      } catch (err) {
        console.error('Failed to parse schedule:', err);
      }
    }
  }, [miniAppSettings?.schedule]);

  const toggleDay = (index: number) => {
    setSalonDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', val: string) => {
    setSalonDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: val } : d))
    );
  };

  const handleSave = () => {
    // Validate that openTime < closeTime for open days
    for (const day of salonDays) {
      if (day.isOpen) {
        if (!day.openTime || !day.closeTime) {
          showToast(`Пожалуйста, укажите время для дня: ${day.dayName}`, 'error');
          return;
        }
        if (day.openTime >= day.closeTime) {
          showToast(`Ошибка в дне "${day.dayName}": время открытия должно быть раньше времени закрытия.`, 'error');
          return;
        }
      }
    }

    updateMiniAppSettings({
      schedule: JSON.stringify(salonDays)
    });
    showToast('Расписание работы салона успешно сохранено!', 'success');
  };


  return (
    <div className="space-y-6 sm:space-y-8 w-full font-sans">
      {/* Block 1: Salon Global Working Hours */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-none space-y-4 sm:space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 select-none">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg font-evolventa tracking-tight">Часы работы заведения</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-evolventa">Настройте общие рабочие дни и часы вашего салона или барбершопа.</p>
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa cursor-pointer self-start sm:self-auto active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Сохранить график
          </button>
        </div>

        {/* Days configuration rows */}
        <div className="space-y-2.5 sm:space-y-3">
          {salonDays.map((d, idx) => (
            <div
              key={d.dayName}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 gap-3 sm:gap-4 ${
                d.isOpen
                  ? 'border-orange-100 bg-orange-50/10'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              {/* Day title & Active Check */}
              <div className="flex items-center gap-3 sm:gap-3.5">
                <button
                  onClick={() => toggleDay(idx)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer shrink-0 ${
                    d.isOpen ? 'bg-[#ff5a1f]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                      d.isOpen ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2 select-none">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 font-evolventa min-w-[80px] sm:min-w-[100px]">
                    {d.dayName}
                  </span>
                  {d.isOpen ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[7px] sm:text-[8px] font-black text-emerald-600 border border-emerald-100/60 uppercase tracking-wide font-evolventa">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Работает
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-[7px] sm:text-[8px] font-black text-rose-500 border border-rose-100/60 uppercase tracking-wide font-evolventa">
                      Выходной
                    </span>
                  )}
                </div>
              </div>

              {/* Time pickers if open */}
              {d.isOpen ? (
                <div className="flex items-center gap-2 sm:gap-3 pl-11 sm:pl-0">
                  <input
                    type="time"
                    value={d.openTime}
                    onChange={(e) => handleTimeChange(idx, 'openTime', e.target.value)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 text-slate-700 bg-slate-50 text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 smooth-transition font-evolventa w-[100px] sm:w-auto"
                  />
                  <span className="text-slate-400 font-medium select-none text-sm">—</span>
                  <input
                    type="time"
                    value={d.closeTime}
                    onChange={(e) => handleTimeChange(idx, 'closeTime', e.target.value)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 text-slate-700 bg-slate-50 text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 focus:border-[#ff5a1f]/30 smooth-transition font-evolventa w-[100px] sm:w-auto"
                  />
                </div>
              ) : (
                <span className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-wider font-evolventa select-none pl-11 sm:pl-0 sm:pr-2">Выходной день</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
