'use client';

import React, { useRef } from 'react';
import { useBusiness } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(objectUrl);
      resolve(compressedBase64);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};

export default function MiniAppSettings() {
  const { miniAppSettings, updateMiniAppSettings, services } = useBusiness();
  const { showToast } = useToast();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof typeof miniAppSettings, value: string) => {
    updateMiniAppSettings({ [field]: value });
  };

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Файл слишком большой. Выберите изображение размером меньше 10 МБ.', 'error');
      return;
    }

    try {
      const compressed = await compressImage(file, 300, 300, 0.85);
      handleInputChange('logo', compressed);
    } catch (err) {
      console.error(err);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast('Файл слишком большой. Выберите изображение размером меньше 12 МБ.', 'error');
      return;
    }

    try {
      const compressed = await compressImage(file, 1200, 800, 0.75);
      handleInputChange('coverImage', compressed);
    } catch (err) {
      console.error(err);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('coverImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    showToast('Настройки Telegram Mini App успешно сохранены!', 'success');
  };

  // Preselected colors
  const premiumColors = [
    { name: 'Bronly Orange', hex: '#ff5a1f' },
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Deep Space', hex: '#0f172a' },
    { name: 'Teal Green', hex: '#0d9488' },
    { name: 'Crimson Glow', hex: '#e11d48' },
    { name: 'Golden Amber', hex: '#b45309' }
  ];

  return (
    <div className="space-y-8 w-full font-sans">
      {/* Visual Workspace Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Customization Forms */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between select-none">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-lg font-evolventa tracking-tight">Брендинг Mini App</h3>
              <p className="text-xs text-slate-400 font-evolventa">Настройте внешний вид клиентского приложения записи в Telegram.</p>
            </div>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa cursor-pointer"
            >
              Сохранить
            </button>
          </div>

          <div className="space-y-4">
            {/* Salon Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Название барбершопа</label>
              <input
                type="text"
                placeholder="Укажите название салона"
                value={miniAppSettings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 font-evolventa">Описание / Приветствие</label>
              <textarea
                placeholder="Укажите краткое описание или приветствие..."
                value={miniAppSettings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition h-24 resize-none leading-relaxed font-evolventa"
              />
            </div>

            {/* Logo & Cover Image Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              
              {/* Logo block */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Логотип Mini App</label>
                
                <div className="flex items-center gap-3">
                  {/* Preview of logo */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 select-none">
                    {miniAppSettings.logo && (miniAppSettings.logo.startsWith('data:') || miniAppSettings.logo.startsWith('http') || miniAppSettings.logo.startsWith('/')) ? (
                      <img src={miniAppSettings.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Нет фото</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {/* Trigger File Upload */}
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider smooth-transition cursor-pointer"
                    >
                      Выбрать файл
                    </button>
                    
                    {/* Reset logo */}
                    {miniAppSettings.logo && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('logo', '')}
                        className="text-[9px] text-rose-500 hover:text-rose-650 font-bold text-left underline cursor-pointer"
                      >
                        Сбросить логотип
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo URL input */}
                <input
                  type="text"
                  placeholder="Или укажите ссылку на логотип..."
                  value={miniAppSettings.logo.startsWith('data:') ? 'Изображение загружено с компьютера' : miniAppSettings.logo}
                  disabled={miniAppSettings.logo.startsWith('data:')}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                  className="w-full px-4 py-2.5 mt-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-850 text-xs focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition truncate font-evolventa disabled:opacity-50 disabled:bg-slate-100"
                />
                
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Cover Image block */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Обложка Mini App</label>
                
                <div className="flex items-center gap-3">
                  {/* Preview of cover */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 select-none">
                    {miniAppSettings.coverImage ? (
                      <img src={miniAppSettings.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Нет фото</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-slate-855 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider smooth-transition cursor-pointer"
                    >
                      Выбрать файл
                    </button>
                    
                    {miniAppSettings.coverImage && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('coverImage', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80')}
                        className="text-[9px] text-rose-500 hover:text-rose-650 font-bold text-left underline cursor-pointer"
                      >
                        Сбросить по умолчанию
                      </button>
                    )}
                  </div>
                </div>

                {/* Cover Image URL input */}
                <input
                  type="text"
                  placeholder="Или укажите прямую ссылку на фото..."
                  value={miniAppSettings.coverImage.startsWith('data:') ? 'Изображение загружено с компьютера' : miniAppSettings.coverImage}
                  disabled={miniAppSettings.coverImage.startsWith('data:')}
                  onChange={(e) => handleInputChange('coverImage', e.target.value)}
                  className="w-full px-4 py-2.5 mt-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-850 text-xs focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition truncate font-evolventa disabled:opacity-50 disabled:bg-slate-100"
                />

                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleCoverFileSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Адрес филиала</label>
                <input
                  type="text"
                  placeholder="Укажите адрес филиала"
                  value={miniAppSettings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Телефон для справок</label>
                <input
                  type="text"
                  placeholder="Укажите телефон для справок"
                  value={miniAppSettings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
                />
              </div>
            </div>

            {/* Social media links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Ник в Telegram (без @)</label>
                <input
                  type="text"
                  placeholder="elite_barber_tash"
                  value={miniAppSettings.telegram || ''}
                  onChange={(e) => handleInputChange('telegram', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 font-evolventa">Ник в Instagram (без @)</label>
                <input
                  type="text"
                  placeholder="elite_barbershop_tash"
                  value={miniAppSettings.instagram || ''}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
                />
              </div>
            </div>

            {/* Accent Theme Color */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 block font-evolventa">Цветовая гамма приложения</label>
              <div className="flex flex-wrap gap-2 select-none">
                {premiumColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleInputChange('primaryColor', color.hex)}
                    style={miniAppSettings.primaryColor === color.hex ? { borderColor: color.hex, color: color.hex, backgroundColor: `${color.hex}15` } : {}}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold smooth-transition cursor-pointer ${
                      miniAppSettings.primaryColor === color.hex
                        ? ''
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-650'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </button>
                ))}
              </div>

              {/* Custom Color Selector (HEX & Color Picker Palette) */}
              <div className="flex items-center gap-3 pt-3.5 border-t border-slate-100/60 mt-3 select-none">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 font-evolventa uppercase tracking-wider">Свой цвет (HEX)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="#ff5a1f"
                        value={miniAppSettings.primaryColor || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val && !val.startsWith('#') && val.length <= 7) {
                            val = '#' + val;
                          }
                          handleInputChange('primaryColor', val);
                        }}
                        className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold focus:outline-none focus:border-[#ff5a1f]/30 focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-evolventa"
                      />
                      {/* Visual Preview circle inside input */}
                      <div 
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-slate-200"
                        style={{ backgroundColor: miniAppSettings.primaryColor || '#ff5a1f' }}
                      />
                    </div>

                    {/* Palette/Pipette Native Color Picker Trigger */}
                    <label className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 smooth-transition shrink-0 active:scale-95">
                      <input
                        type="color"
                        value={(miniAppSettings.primaryColor && miniAppSettings.primaryColor.startsWith('#') && miniAppSettings.primaryColor.length === 7) ? miniAppSettings.primaryColor : '#ff5a1f'}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="sr-only"
                      />
                      <svg className="w-4.5 h-4.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.344l2.122-2.122a1 1 0 011.414 0l3.829 3.829a1 1 0 010 1.414L16.243 12.657M11 7.344L7.485 10.858M11 7.344L14.656 11" />
                      </svg>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: LIVE MINI APP PREVIEW CARD */}
        <div className="flex flex-col items-center justify-start lg:pt-6 select-none lg:sticky lg:top-6 self-start">
          <div className="w-full max-w-[380px] h-[640px] bg-slate-50 border border-slate-200/80 rounded-[32px] overflow-hidden flex flex-col relative shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
            
            {/* Mini App Screen Canvas */}
            <div className="flex-1 bg-slate-50 flex flex-col relative text-left text-slate-800">
              
              {/* Header Image Cover */}
              <div className="relative h-52 bg-slate-900 flex flex-col justify-between p-4 shrink-0 z-0">
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-65" 
                    style={{ backgroundImage: `url('${miniAppSettings.coverImage || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80'}')` }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
                </div>
                
                {/* Logo & Name Row */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div 
                      style={{ backgroundColor: miniAppSettings.primaryColor || '#ff5a1f' }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white border border-white/20 overflow-hidden shrink-0"
                    >
                      {miniAppSettings.logo && (miniAppSettings.logo.startsWith('data:') || miniAppSettings.logo.startsWith('http') || miniAppSettings.logo.startsWith('/')) ? (
                        <img src={miniAppSettings.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-black uppercase font-evolventa">{miniAppSettings.logo || 'EB'}</span>
                      )}
                    </div>
                    <span className="text-white font-extrabold text-[10px] tracking-wide font-evolventa drop-shadow-md">
                      {miniAppSettings.name || 'Elite Barber'}
                    </span>
                  </div>
                  
                  {/* Mock profile avatar */}
                  <div className="w-6 h-6 rounded-full bg-slate-200 border border-white/20 overflow-hidden">
                    <img src="https://ui-avatars.com/api/?name=Александр&background=f1f5f9&color=0f172a&bold=true&font-size=0.35" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Bottom details */}
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-white font-evolventa tracking-tight leading-none drop-shadow">
                      {miniAppSettings.name || 'Elite Barber'}
                    </h2>
                    <div className="flex items-center gap-0.5 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      <span className="text-[6px] font-black text-emerald-300 font-evolventa uppercase tracking-wider">Открыто</span>
                    </div>
                  </div>
                  <p className="text-[8px] text-white/75 font-medium font-evolventa flex items-center gap-1 drop-shadow">
                    <svg className="w-2.5 h-2.5 shrink-0" style={{ color: miniAppSettings.primaryColor || '#ff5a1f' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="truncate">{miniAppSettings.address || 'Не указан'}</span>
                  </p>
                </div>
              </div>

              {/* Main overlapping list */}
              <div className="flex-1 bg-slate-50 rounded-t-2xl -mt-4 relative z-20 p-4 space-y-4">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Детали записи</p>
                <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden divide-y divide-slate-100">
                  {/* Master row */}
                  <div className="p-3.5 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Специалист</p>
                        <p className="text-slate-800 text-[11px] font-extrabold mt-0.5">Любой мастер</p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  {/* Time row */}
                  <div className="p-3.5 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-450 shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Дата и время</p>
                        <p className="text-[11px] font-extrabold mt-0.5" style={{ color: miniAppSettings.primaryColor || '#ff5a1f' }}>Выбрать время</p>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>

                {/* Floating button */}
                <div 
                  className="w-full py-3 rounded-2xl text-center text-white text-[11px] font-black tracking-wide uppercase transition-colors"
                  style={{ backgroundColor: miniAppSettings.primaryColor || '#ff5a1f' }}
                >
                  Записаться онлайн
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
