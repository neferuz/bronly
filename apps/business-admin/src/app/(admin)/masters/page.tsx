'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBusiness, Master } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
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
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

export default function Masters() {
  const { masters, services, addMaster, updateMaster, deleteMaster, toggleMasterStatus } = useBusiness();
  const { showToast } = useToast();
  const [copiedMasterId, setCopiedMasterId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
  
  // Toolbar states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'vacation'>('all');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Неизвестно';

  const masterColorConfig: Record<string, { bg: string; text: string }> = {
    m1: { bg: 'bg-orange-100 text-[#ff5a1f]', text: '#ff5a1f' },
    m2: { bg: 'bg-blue-100 text-blue-600', text: '#2563eb' },
    m3: { bg: 'bg-emerald-100 text-emerald-600', text: '#059669' },
    m4: { bg: 'bg-slate-100 text-slate-500', text: '#64748b' }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'М';
    const parts = nameStr.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  // Base64 Image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 400, 0.7); // Master avatar can be smaller (400x400)
      setAvatar(compressed);
    } catch (err) {
      console.error('Ошибка при сжатии изображения:', err);
      // Fallback to raw base64 if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceCheckbox = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const closeDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
      setEditingMaster(null);
    }, 350);
  };

  // Open Drawer in CREATE mode
  const handleOpenCreate = () => {
    setEditingMaster(null);
    setName('');
    setPhone('');
    setAvatar('');
    setDescription('');
    setSelectedServices([]);
    setIsActive(true);
    setIsClosing(false);
    setIsDrawerOpen(true);
  };

  // Open Drawer in EDIT mode
  const handleOpenEdit = (m: Master) => {
    setEditingMaster(m);
    setName(m.name);
    setPhone(m.phone);
    setAvatar(m.avatar);
    setDescription(m.description || '');
    setSelectedServices(m.services);
    setIsActive(m.isActive);
    setIsClosing(false);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    let finalAvatar = avatar;
    if (!finalAvatar) {
      finalAvatar = getInitials(name);
    }

    if (editingMaster) {
      updateMaster(editingMaster.id, {
        name,
        phone,
        avatar: finalAvatar,
        description,
        services: selectedServices,
        isActive
      });
    } else {
      addMaster({
        name,
        phone,
        avatar: finalAvatar,
        description,
        services: selectedServices
      });
    }

    closeDrawer();
  };

  const handleDelete = () => {
    if (editingMaster) {
      setIsConfirmOpen(true);
    }
  };

  // Filtering Logic
  const filteredMasters = masters.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);
      
    if (statusFilter === 'active') return matchesSearch && m.isActive;
    if (statusFilter === 'vacation') return matchesSearch && !m.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 w-full font-sans relative">
      {/* Unified Team Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none overflow-hidden">
        {/* Header + Search & Segment filter */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col gap-4 select-none">
          {/* Top Row: Title and Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Команда мастеров</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Сотрудники, оказываемые услуги, рабочие кабинеты Telegram и статусы</p>
            </div>
            
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-xs smooth-transition shadow-none font-evolventa shrink-0 cursor-pointer active:scale-95 hover:scale-102 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Нанять мастера
            </button>
          </div>

          {/* Bottom Row: Search and Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search bar */}
            <div className="w-full sm:w-80 relative">
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

            {/* Filter segment tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold font-evolventa">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-1.5 rounded-lg smooth-transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-800 border border-slate-200/40 shadow-none'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Все ({masters.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-1.5 rounded-lg smooth-transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-600 border border-slate-200/40 shadow-none'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                В штате ({masters.filter(m => m.isActive).length})
              </button>
              <button
                onClick={() => setStatusFilter('vacation')}
                className={`px-4 py-1.5 rounded-lg smooth-transition ${
                  statusFilter === 'vacation'
                    ? 'bg-white text-rose-500 border border-slate-200/40 shadow-none'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                В отпуске ({masters.filter(m => !m.isActive).length})
              </button>
            </div>
          </div>
        </div>

        {/* Masters Table — Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-5 font-evolventa">Мастер</th>
                <th className="py-3.5 px-5 font-evolventa">Оказываемые услуги</th>
                <th className="py-3.5 px-5 font-evolventa">Telegram Кабинет</th>
                <th className="py-3.5 px-5 font-evolventa text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
              {filteredMasters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 select-none">
                    <p className="text-sm font-evolventa font-bold">Мастера не найдены</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска или наймите нового сотрудника.</p>
                  </td>
                </tr>
              ) : (
                filteredMasters.map((m) => {
                  const masterColor = masterColorConfig[m.id] || { bg: 'bg-slate-100 text-slate-500', text: '#64748b' };
                  return (
                    <tr
                      key={m.id}
                      onClick={() => handleOpenEdit(m)}
                      className="hover:bg-slate-50/30 smooth-transition cursor-pointer"
                    >
                      {/* Master Profile Info */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          {m.avatar.startsWith('data:image') || m.avatar.startsWith('http') || m.avatar.startsWith('/') ? (
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black border select-none text-[9px] font-evolventa shrink-0 ${masterColor.bg}`}>
                              {m.avatar}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-slate-800 text-[11px] leading-tight font-evolventa">{m.name}</span>
                            <span className="text-[8px] text-slate-400 font-bold leading-normal mt-0.5 font-evolventa">{m.phone}</span>
                            {m.description && (
                              <span className="text-[9px] text-slate-450 font-semibold italic mt-1 truncate max-w-[200px] font-evolventa" title={m.description}>
                                {m.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Services list */}
                      <td className="py-3 px-5">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {m.services.length === 0 ? (
                            <span className="text-[10px] text-slate-350 italic font-evolventa">Услуги не назначены</span>
                          ) : (
                            m.services.map((sId) => (
                              <span
                                key={sId}
                                className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-slate-150/40 font-evolventa"
                              >
                                {getServiceName(sId)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Telegram copy Link */}
                      <td className="py-3 px-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.telegramLink);
                                setCopiedMasterId(m.id);
                                showToast(`Ссылка для мастера ${m.name} скопирована!`, 'success');
                                setTimeout(() => setCopiedMasterId(null), 2000);
                              }}
                              className={`group h-8 px-3 rounded-xl font-evolventa text-[10px] font-extrabold tracking-wide flex items-center gap-2 transition-all duration-300 border cursor-pointer select-none active:scale-95 ${
                                copiedMasterId === m.id
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-none'
                                  : 'bg-[#ff5a1f]/5 hover:bg-[#ff5a1f] border-[#ff5a1f]/15 hover:border-[#ff5a1f] text-[#ff5a1f] hover:text-white shadow-none'
                              }`}
                              title="Скопировать ссылку на Telegram-кабинет"
                            >
                              {copiedMasterId === m.id ? (
                                <>
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                  <span>Скопировано!</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.37.88-3.87 2.56-.37.25-.7.37-.99.36-.33-.01-.96-.19-1.43-.34-.57-.19-1.02-.29-1.02-.29 0 0-.29-.15.02-.27.21-.08.68-.22 1.34-.48 4.14-1.8 6.9-2.98 8.28-3.55.33-.14.65-.24.96-.24.12 0 .38.03.55.17.15.12.2.28.22.41z"/>
                                  </svg>
                                  <span>Копировать кабинет</span>
                                </>
                              )}
                            </button>
                            
                            {m.telegramId && (
                              <button
                                onClick={() => {
                                  updateMaster(m.id, { telegramId: null });
                                }}
                                className="h-8 px-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer text-[10px] font-bold font-evolventa"
                                title="Сбросить привязку к Telegram"
                              >
                                Сбросить
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {m.telegramId ? (
                              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg font-evolventa">
                                Привязан (ID: {m.telegramId})
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg font-evolventa">
                                Ожидает входа
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status switch toggle */}
                      <td className="py-3 px-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-wide leading-none select-none ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-rose-50 text-rose-500 border-rose-100'
                            }`}
                          >
                            {m.isActive ? 'Работает' : 'В отпуске'}
                          </span>
                          
                          <button
                            onClick={() => toggleMasterStatus(m.id)}
                            className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                              m.isActive ? 'bg-[#ff5a1f]' : 'bg-slate-200'
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                                m.isActive ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Masters Cards — Mobile */}
        <div className="md:hidden">
          {filteredMasters.length === 0 ? (
            <div className="py-16 text-center text-slate-400 select-none px-4">
              <p className="text-sm font-evolventa font-bold">Мастера не найдены</p>
              <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Попробуйте изменить параметры поиска или наймите нового сотрудника.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMasters.map((m) => {
                const masterColor = masterColorConfig[m.id] || { bg: 'bg-slate-100 text-slate-500', text: '#64748b' };
                return (
                  <div
                    key={m.id}
                    onClick={() => handleOpenEdit(m)}
                    className="p-4 hover:bg-slate-50/30 smooth-transition cursor-pointer active:bg-slate-50/50"
                  >
                    {/* Top: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {m.avatar.startsWith('data:image') || m.avatar.startsWith('http') || m.avatar.startsWith('/') ? (
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border select-none text-xs font-evolventa shrink-0 ${masterColor.bg}`}>
                            {m.avatar}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-800 text-sm leading-tight font-evolventa truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold leading-normal mt-0.5 font-evolventa">{m.phone}</span>
                          {m.description && (
                            <span className="text-[10px] text-slate-450 font-semibold italic mt-0.5 truncate max-w-[200px] font-evolventa">
                              {m.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Toggle */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-wide leading-none select-none ${
                            m.isActive
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-rose-50 text-rose-500 border-rose-100'
                          }`}
                        >
                          {m.isActive ? 'Работает' : 'В отпуске'}
                        </span>
                        <button
                          onClick={() => toggleMasterStatus(m.id)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                            m.isActive ? 'bg-[#ff5a1f]' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                              m.isActive ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {m.services.length === 0 ? (
                        <span className="text-[10px] text-slate-350 italic font-evolventa">Услуги не назначены</span>
                      ) : (
                        m.services.map((sId) => (
                          <span
                            key={sId}
                            className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-slate-150/40 font-evolventa"
                          >
                            {getServiceName(sId)}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Telegram Section */}
                    <div className="mt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {m.telegramId ? (
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-lg font-evolventa">
                            Привязан (ID: {m.telegramId})
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg font-evolventa">
                            Ожидает входа
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(m.telegramLink);
                            setCopiedMasterId(m.id);
                            showToast(`Ссылка для мастера ${m.name} скопирована!`, 'success');
                            setTimeout(() => setCopiedMasterId(null), 2000);
                          }}
                          className={`h-7 px-2.5 rounded-lg font-evolventa text-[9px] font-extrabold tracking-wide flex items-center gap-1.5 transition-all duration-300 border cursor-pointer select-none active:scale-95 ${
                            copiedMasterId === m.id
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#ff5a1f]/5 border-[#ff5a1f]/15 text-[#ff5a1f]'
                          }`}
                        >
                          {copiedMasterId === m.id ? (
                            <>
                              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              <span>Скопировано</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 shrink-0 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.2-.02-.08.02-1.37.88-3.87 2.56-.37.25-.7.37-.99.36-.33-.01-.96-.19-1.43-.34-.57-.19-1.02-.29-1.02-.29 0 0-.29-.15.02-.27.21-.08.68-.22 1.34-.48 4.14-1.8 6.9-2.98 8.28-3.55.33-.14.65-.24.96-.24.12 0 .38.03.55.17.15.12.2.28.22.41z"/>
                              </svg>
                              <span>Кабинет</span>
                            </>
                          )}
                        </button>

                        {m.telegramId && (
                          <button
                            onClick={() => updateMaster(m.id, { telegramId: null })}
                            className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer text-[9px] font-bold font-evolventa"
                          >
                            Сбросить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE DRAWER — ADD / EDIT MASTER */}
      {isDrawerOpen && (
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
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#ff5a1f] to-[#ff8c42] flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {editingMaster ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base font-evolventa leading-tight">
                    {editingMaster ? 'Редактирование' : 'Найм сотрудника'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold leading-none">
                    {editingMaster ? 'Изменение профиля мастера' : 'Регистрация нового специалиста'}
                  </span>
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
                {/* Interactive Image Upload Area */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/60 flex flex-col items-center justify-center cursor-pointer smooth-transition relative overflow-hidden group border-orange-100 hover:border-[#ff5a1f]/50"
                  >
                    {avatar && (avatar.startsWith('data:') || avatar.startsWith('http')) ? (
                      <>
                        <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center smooth-transition">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#ff5a1f] smooth-transition select-none">
                        <svg className="w-6 h-6 mb-1 text-slate-300 group-hover:text-[#ff5a1f]/60 smooth-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-wider font-evolventa">Фото</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <span className="text-[10px] text-slate-400 font-bold font-evolventa">Реальное фото сотрудника</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">ФИО Мастера</label>
                  <input
                    type="text"
                    required
                    placeholder="Например, Сардор Абдуллаев"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Номер телефона</label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 font-evolventa uppercase tracking-wider">Описание/Биография мастера</label>
                  <textarea
                    placeholder="Например, Опытный барбер, мастер по мужским стрижкам..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-[#ff5a1f]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/10 smooth-transition h-20 resize-none font-semibold placeholder:font-normal placeholder:text-slate-400 font-evolventa"
                  />
                </div>

                {/* Services assignment — visual cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 block font-evolventa uppercase tracking-wider">Оказываемые услуги</label>
                    <span className="text-[9px] font-bold text-slate-400 font-evolventa">
                      {selectedServices.length} из {services.length} выбрано
                    </span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto p-1 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-2">
                    {services.map((s) => {
                      const isSelected = selectedServices.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleServiceCheckbox(s.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer smooth-transition select-none ${
                            isSelected
                              ? 'bg-orange-50 border border-[#ff5a1f]/20'
                              : 'bg-white border border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {/* Service Image */}
                          {s.image ? (
                            <img
                              src={s.image}
                              alt={s.name}
                              className={`w-10 h-10 rounded-xl object-cover shrink-0 smooth-transition ${
                                isSelected ? 'ring-2 ring-[#ff5a1f]/30' : 'ring-1 ring-slate-100'
                              }`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 smooth-transition ${
                              isSelected ? 'bg-orange-100' : 'bg-slate-100'
                            }`}>
                              <svg className={`w-4 h-4 smooth-transition ${isSelected ? 'text-[#ff5a1f]' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                              </svg>
                            </div>
                          )}

                          {/* Service Info */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-[11px] truncate leading-tight smooth-transition ${
                                isSelected ? 'text-[#ff5a1f]' : 'text-slate-800'
                              }`}>{s.name}</span>
                              <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0 ${
                                isSelected ? 'bg-[#ff5a1f]/10 text-[#ff5a1f]' : 'bg-slate-100 text-slate-400'
                              }`}>{s.category}</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold leading-normal mt-0.5">
                              {s.price.toLocaleString('ru-RU')} сум • {s.duration} мин
                            </span>
                          </div>

                          {/* Check indicator */}
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 smooth-transition ${
                            isSelected
                              ? 'bg-[#ff5a1f] text-white'
                              : 'border-2 border-slate-200'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Selector Switch (Only in edit mode) */}
                {editingMaster && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 font-evolventa leading-tight">Статус активности</span>
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">Работает или находится в отпуске</span>
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

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 font-evolventa leading-tight">Telegram Кабинет</span>
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">
                          {editingMaster.telegramId ? `Привязан (ID: ${editingMaster.telegramId})` : 'Ожидает привязки по ссылке'}
                        </span>
                      </div>
                      
                      {editingMaster.telegramId && (
                        <button
                          type="button"
                          onClick={() => {
                            updateMaster(editingMaster.id, { telegramId: null });
                            closeDrawer();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 text-[10px] font-bold font-evolventa cursor-pointer transition-colors active:scale-95"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions — sticky */}
              <div className="border-t border-slate-100 p-5 flex items-center justify-between shrink-0 bg-white">
                <div>
                  {editingMaster && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs smooth-transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Уволить
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
                    {editingMaster ? 'Сохранить' : 'Нанять'}
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
          if (editingMaster) {
            deleteMaster(editingMaster.id);
            closeDrawer();
          }
        }}
        title="Увольнение сотрудника"
        message={`Вы уверены, что хотите уволить мастера ${editingMaster?.name || ''}? Это действие полностью удалит его профиль и расписание из системы.`}
        confirmText="Уволить"
        cancelText="Отмена"
        type="danger"
      />

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
