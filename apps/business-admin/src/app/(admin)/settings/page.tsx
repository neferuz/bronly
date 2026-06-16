'use client';

import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';
import { BusinessSettings } from '../../../hooks/useBusiness';

export default function Settings() {
  const { settings, updateSettings } = useBusiness();
  const { showToast } = useToast();

  // Local draft so inputs don't trigger API calls on every keystroke
  const [draft, setDraft] = useState<BusinessSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sync draft when settings are loaded from the backend
  useEffect(() => {
    setDraft(settings);
    setIsDirty(false);
  }, [settings]);

  const handleChange = (field: keyof BusinessSettings, value: string | number) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(draft);
      showToast('Настройки бизнеса успешно сохранены!', 'success');
      setIsDirty(false);
    } catch {
      showToast('Не удалось сохранить настройки', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(settings);
    setIsDirty(false);
  };

  return (
    <div className="space-y-8 w-full font-sans">

      {/* Settings Block */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-lg font-evolventa tracking-tight">Настройки бизнеса</h3>
            <p className="text-xs text-slate-400 font-evolventa">Общие настройки вашего филиала, часовые пояса и валюты.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDirty && (
              <button
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs smooth-transition font-evolventa cursor-pointer disabled:opacity-50"
              >
                Отменить
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : 'Сохранить настройки'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Salon Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Название филиала</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Телефон филиала</label>
              <input
                type="text"
                value={draft.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 font-evolventa">Адрес заведения</label>
            <input
              type="text"
              value={draft.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Currency */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Валюта</label>
              <select
                value={draft.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
              >
                <option value="сум">сум (UZS)</option>
                <option value="руб">руб (RUB)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Часовой пояс</label>
              <select
                value={draft.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
              >
                <option value="Asia/Tashkent (GMT+5)">Asia/Tashkent (GMT+5)</option>
                <option value="Europe/Moscow (GMT+3)">Europe/Moscow (GMT+3)</option>
                <option value="Europe/London (GMT+0)">Europe/London (GMT+0)</option>
                <option value="America/New_York (GMT-5)">America/New_York (GMT-5)</option>
                <option value="Asia/Dubai (GMT+4)">Asia/Dubai (GMT+4)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rules and Limitations block */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none space-y-6">
        <div className="border-b border-slate-100 pb-4 space-y-1 select-none">
          <h3 className="font-extrabold text-slate-800 text-lg font-evolventa tracking-tight">Правила и ограничения записей</h3>
          <p className="text-xs text-slate-400 font-evolventa">Настройки буферного времени, отмен и глубины бронирования.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Buffer hours */}
          <div className="space-y-2">
            <div className="space-y-0.5 select-none">
              <label className="text-xs font-bold text-slate-700 font-evolventa">Минимальное время до визита</label>
              <p className="text-[10px] text-slate-400 font-evolventa">За сколько часов до визита клиент может сделать запись в Mini App.</p>
            </div>
            <select
              value={draft.minBufferHours}
              onChange={(e) => handleChange('minBufferHours', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
            >
              <option value={1}>1 час</option>
              <option value={2}>2 часа (рекомендуется)</option>
              <option value={3}>3 часа</option>
              <option value={6}>6 часов</option>
              <option value={12}>12 часов</option>
            </select>
          </div>

          {/* Booking window depth */}
          <div className="space-y-2">
            <div className="space-y-0.5 select-none">
              <label className="text-xs font-bold text-slate-700 font-evolventa">Глубина бронирования</label>
              <p className="text-[10px] text-slate-400 font-evolventa">На сколько дней вперед клиенты могут делать записи.</p>
            </div>
            <select
              value={draft.maxBookingDays}
              onChange={(e) => handleChange('maxBookingDays', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
            >
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={30}>30 дней (рекомендуется)</option>
              <option value={60}>60 дней</option>
            </select>
          </div>
        </div>

        {/* Save reminder banner when dirty */}
        {isDirty && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#ff5a1f]/5 border border-[#ff5a1f]/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ff5a1f] animate-pulse" />
              <span className="text-xs font-bold text-[#ff5a1f] font-evolventa">Есть несохранённые изменения</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 font-evolventa cursor-pointer"
              >
                Отменить
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-[#ff5a1f] text-white text-xs font-extrabold font-evolventa cursor-pointer hover:bg-[#e04f1a] smooth-transition flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSaving ? (
                  <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Сохранение...</>
                ) : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info block — read only stats */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none">
        <div className="border-b border-slate-100 pb-4 mb-4 select-none">
          <h3 className="font-extrabold text-slate-800 text-lg font-evolventa tracking-tight">Текущая конфигурация</h3>
          <p className="text-xs text-slate-400 font-evolventa mt-0.5">Сводка сохранённых настроек из базы данных.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Название', value: settings.name },
            { label: 'Телефон', value: settings.phone || '—' },
            { label: 'Валюта', value: settings.currency },
            { label: 'Мин. буфер', value: `${settings.minBufferHours} ч` },
            { label: 'Глубина', value: `${settings.maxBookingDays} дн.` },
            { label: 'Часовой пояс', value: settings.timezone.split(' ')[0] },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-[13px] font-black text-slate-800 font-evolventa truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
