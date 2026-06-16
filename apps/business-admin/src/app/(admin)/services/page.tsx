'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBusiness, Service } from '../../../hooks/useBusiness';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
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
        // Fallback to reader
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

export default function Services() {
  const { services, addService, updateService, deleteService, toggleServiceStatus } = useBusiness();
  const { showToast } = useToast();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Lock background scroll when modal/drawer is open
  useEffect(() => {
    if (isOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenModal]);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Стрижки');
  const [priceStr, setPriceStr] = useState('100 000');
  const [durationStr, setDurationStr] = useState('45');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helpers for formatting
  const formatNumber = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const parseNumber = (s: string) => parseInt(s.replace(/\s/g, ''), 10) || 0;

  const handlePriceChange = (val: string) => {
    const raw = val.replace(/\s/g, '');
    if (raw === '') { setPriceStr(''); return; }
    if (!/^\d*$/.test(raw)) return;
    setPriceStr(formatNumber(parseInt(raw, 10)));
  };

  const handleDurationChange = (val: string) => {
    const raw = val.replace(/\s/g, '');
    if (raw === '') { setDurationStr(''); return; }
    if (!/^\d*$/.test(raw)) return;
    setDurationStr(raw);
  };

  // Extract unique categories for tabs
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  // Filtering Logic
  const filteredServices = services.filter((s) => {
    return selectedTab === 'all' || s.category === selectedTab;
  });

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpenModal(false);
      setIsClosing(false);
      setEditingService(null);
    }, 350);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setName('');
    setCategory('Стрижки');
    setPriceStr('100 000');
    setDurationStr('45');
    setDescription('');
    setImage('');
    setIsActive(true);
    setIsCreatingCategory(false);
    setIsClosing(false);
    setIsOpenModal(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setCategory(s.category);
    setPriceStr(formatNumber(s.price));
    setDurationStr(String(s.duration));
    setDescription(s.description || '');
    setImage(s.image || '');
    setIsActive(s.isActive);
    setIsCreatingCategory(false);
    setIsClosing(false);
    setIsOpenModal(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation checks
    if (file.size > 12 * 1024 * 1024) {
      showToast('Файл слишком большой. Пожалуйста, выберите изображение размером меньше 12 МБ.', 'error');
      return;
    }

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      showToast('Формат HEIC/HEIF не поддерживается напрямую. Сконвертируйте его в JPG, PNG или WebP перед загрузкой.', 'error');
      return;
    }
    
    try {
      const compressed = await compressImage(file);
      setImage(compressed);
    } catch (err) {
      console.error('Ошибка при сжатии изображения:', err);
      // Fallback to FileReader if something fails
      const reader = new FileReader();
      reader.onloadend = () => {
        const resStr = reader.result as string;
        if (resStr.length > 2 * 1024 * 1024) {
          showToast('Изображение имеет слишком высокий размер. Выберите другое изображение или сожмите его.', 'error');
        } else {
          setImage(resStr);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseNumber(priceStr);
    const duration = parseInt(durationStr, 10) || 0;
    if (!name || price <= 0 || duration <= 0) return;

    if (editingService) {
      updateService(editingService.id, {
        name,
        category,
        price,
        duration,
        description,
        image,
        isActive
      });
    } else {
      addService({
        name,
        category,
        price,
        duration,
        description,
        image
      });
    }

    // Reset Form
    setName('');
    setCategory('Стрижки');
    setPriceStr('100 000');
    setDurationStr('45');
    setDescription('');
    setImage('');
    closeDrawer();
  };

  const handleDelete = () => {
    if (editingService) {
      setIsConfirmOpen(true);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight font-evolventa">
            Услуги и цены
          </h2>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5">Настройка прейскуранта салона, категорий услуг и их длительности</p>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa shrink-0 cursor-pointer active:scale-95 hover:scale-102 flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Создать услугу
        </button>
      </div>

      {/* Tabs & Categorization Capsule */}
      <div className="bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-none flex items-center select-none overflow-hidden">
        <div className="flex overflow-x-auto bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTab(cat)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg smooth-transition whitespace-nowrap shrink-0 ${
                selectedTab === cat
                  ? 'bg-white text-slate-800 border border-slate-200/40 shadow-none'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat === 'all' ? 'Все категории' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200/80 shadow-none p-16 text-center text-slate-400 select-none space-y-1">
            <p className="text-sm font-evolventa font-bold">Список услуг пуст</p>
            <p className="text-[10px] text-slate-400 font-evolventa">Вы можете создать первую услугу с помощью кнопки «Создать услугу» вверху.</p>
          </div>
        ) : (
          filteredServices.map((s) => (
            <div
              key={s.id}
              onClick={() => handleOpenEdit(s)}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-none smooth-transition hover:border-slate-350 flex flex-col justify-between cursor-pointer overflow-hidden group"
            >
              {/* Service Image */}
              {s.image ? (
                <div className="relative w-full h-32 sm:h-40 overflow-hidden bg-slate-100">
                  <img 
                    src={s.image} 
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Category badge on image */}
                  <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 inline-flex bg-white/90 backdrop-blur-sm text-[#ff5a1f] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[9px] font-black tracking-wide uppercase select-none leading-none">
                    {s.category}
                  </span>
                  {/* Price on image */}
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-800 font-evolventa">{s.price.toLocaleString('ru-RU')}</span>
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-400 ml-0.5 uppercase">сум</span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-24 sm:h-28 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                  {/* Category badge */}
                  <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 inline-flex bg-orange-50 text-[#ff5a1f] border border-orange-100/40 px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black tracking-wide uppercase select-none leading-none">
                    {s.category}
                  </span>
                  {/* Price */}
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3">
                    <span className="text-xs sm:text-sm font-black text-slate-800 font-evolventa">{s.price.toLocaleString('ru-RU')}</span>
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-400 ml-0.5 uppercase">сум</span>
                  </div>
                </div>
              )}

              <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa leading-tight">{s.name}</h3>

                {/* Description */}
                {s.description && (
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 flex-1">
                    {s.description}
                  </p>
                )}

                {/* Duration and Status Toggle info */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[8px] font-evolventa select-none">
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                    <span>{s.duration} мин</span>
                  </div>
                  
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-wide leading-none select-none ${
                    s.isActive
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                      : 'border-rose-100 bg-rose-50 text-rose-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    {s.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RIGHT SIDE DRAWER — CREATE / EDIT SERVICE */}
      {isOpenModal && (
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
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff5a1f] to-[#ff8c42] flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {editingService ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base font-evolventa leading-tight">
                      {editingService ? 'Редактирование' : 'Новая услуга'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold leading-none">
                      {editingService ? 'Изменение параметров услуги' : 'Добавление в прейскурант'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center smooth-transition cursor-pointer mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Body — scrollable */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Фото услуги</label>
                  
                  {image ? (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-100 group/img">
                      <img 
                        src={image} 
                        alt="Превью" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 smooth-transition flex items-center justify-center">
                        <div className="opacity-0 group-hover/img:opacity-100 smooth-transition flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center smooth-transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="w-9 h-9 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white flex items-center justify-center smooth-transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#ff5a1f]/40 bg-slate-50/50 hover:bg-orange-50/30 smooth-transition flex flex-col items-center justify-center gap-2.5 cursor-pointer group/upload"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-orange-50 group-hover/upload:bg-orange-100 smooth-transition flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#ff5a1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-bold text-slate-500 group-hover/upload:text-slate-600 smooth-transition font-evolventa block">
                          Загрузить фото
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">PNG, JPG до 5 МБ</span>
                      </div>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* URL input as alternative */}
                  <input
                    type="text"
                    placeholder="Или вставьте ссылку на изображение..."
                    value={image.startsWith('data:') ? '' : image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-[10px] focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                  />
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Service Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Название услуги</label>
                  <input
                    type="text"
                    required
                    placeholder="Например, Оформление бороды"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                  />
                </div>

                {/* Category Input / Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Категория</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isCreatingCategory;
                        setIsCreatingCategory(nextVal);
                        setCategory(nextVal ? '' : 'Стрижки');
                      }}
                      className="text-[10px] text-[#ff5a1f] hover:underline font-bold font-evolventa cursor-pointer"
                    >
                      {isCreatingCategory ? 'Выбрать из списка' : '+ Новая категория'}
                    </button>
                  </div>

                  {isCreatingCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Например, Окрашивание"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-3 pr-8 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold font-evolventa cursor-pointer appearance-none"
                      >
                        {Array.from(new Set([...['Стрижки', 'Борода', 'Комбо', 'Уход'], ...services.map(s => s.category)])).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price and Duration Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Цена (сум)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="100 000"
                      value={priceStr}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                    />
                    <span className="text-[8px] text-slate-400 font-medium font-evolventa">от 1 000 сум</span>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Время (мин)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="45"
                      value={durationStr}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                    />
                    <span className="text-[8px] text-slate-400 font-medium font-evolventa">от 5 минут, шаг 5 мин</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Описание услуги</label>
                  <textarea
                    placeholder="Детали услуги (мытье головы, используемая косметика и т.д.)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa h-24 resize-none"
                  />
                </div>

                {/* Active Toggle (Only in edit mode) */}
                {editingService && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 font-evolventa leading-tight">Статус активности</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">Доступна ли услуга для записи клиентам</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        isActive ? 'bg-[#ff5a1f]' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ${
                          isActive ? 'translate-x-4.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Actions — sticky */}
              <div className="border-t border-slate-100 p-5 flex items-center justify-between shrink-0 bg-white">
                <div>
                  {editingService && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs smooth-transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Удалить
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="px-5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-500 font-bold text-xs smooth-transition font-evolventa cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {editingService ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (editingService) {
            deleteService(editingService.id);
            closeDrawer();
          }
        }}
        title="Удаление услуги"
        message={`Вы уверены, что хотите удалить услугу "${editingService?.name || ''}" из прейскуранта? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        type="danger"
      />
    </div>
  );
}
