'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Custom interfaces matching the backend / admin data definitions
interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  image?: string;
}

interface Master {
  id: string;
  name: string;
  avatar: string;
  services: string[];
  description: string;
  rating: number;
}

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ClientMiniApp() {
  const router = useRouter();
  
  // Dynamic business and DB states
  const [businessId, setBusinessId] = useState<string>('');
  const [isParamsChecked, setIsParamsChecked] = useState<boolean>(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [dbMasters, setDbMasters] = useState<Master[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const services = useMemo(() => dbServices, [dbServices]);
  const masters = useMemo(() => dbMasters, [dbMasters]);


  // Dynamic Date Generator for the next 7 days
  const bookingDates = useMemo(() => {
    const days = [];
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = [
      'янв', 'фев', 'мар', 'апр', 'май', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    
    for (let i = 0; i < 7; i++) {
      const baseDate = new Date();
      const tashkentStr = baseDate.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
      const d = new Date(tashkentStr);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      days.push({
        dateStr, // YYYY-MM-DD
        dayName: i === 0 ? 'Сегодня' : dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
        fullText: `${d.getDate()} ${monthNames[d.getMonth()]}`
      });
    }
    return days;
  }, []);

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // App States
  type ViewState = 'hub' | 'select-service' | 'select-master' | 'select-datetime' | 'checkout';
  const [activeView, setActiveView] = useState<ViewState>('hub');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(bookingDates[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client input states
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientTelegramId, setClientTelegramId] = useState<string>('');
  const [clientPhotoUrl, setClientPhotoUrl] = useState<string>('');
  const [clientComment, setClientComment] = useState<string>('');
  
  // Search & Category states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Все');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Fetch business details and resources on mount + load client credentials (TG WebApp / URL params / localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        let bId = params.get('business_id') || params.get('b');
        
        if (!bId && window.location.pathname && window.location.pathname !== '/') {
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const systemRoutes = ['profile', 'history', 'review'];
          if (pathParts.length > 0 && !systemRoutes.includes(pathParts[0])) {
            bId = pathParts[0];
          }
        }

        // Safe localStorage access
        const getStorage = (key: string) => {
          try { return localStorage.getItem(key); } catch(e) { return null; }
        };
        const setStorage = (key: string, val: string) => {
          try { localStorage.setItem(key, val); } catch(e) {}
        };

        if (!bId) {
          bId = getStorage('last_business_id') || '';
        } else {
          bId = bId.replace(/[^a-zA-Z0-9_-]/g, '');
          setStorage('last_business_id', bId);
        }
        setBusinessId(bId);

        // 1. Try to read from query params
        const qName = params.get('name') || params.get('client_name') || params.get('username') || params.get('n');
        const qPhone = params.get('phone') || params.get('client_phone') || params.get('p');
        const qTgId = params.get('tg_id') || params.get('telegram_id') || params.get('uid');

        let finalName = qName || '';
        let finalPhone = qPhone || '';
        let finalTgId = qTgId || '';
        let finalPhotoUrl = '';

        // 2. Try to read from Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          if (typeof tg.ready === 'function') {
            try { tg.ready(); } catch(e) {}
          }
          if (typeof tg.expand === 'function') {
            try { tg.expand(); } catch(e) {}
          }
          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser) {
            if (!finalName) {
              finalName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
              if (!finalName && tgUser.username) {
                finalName = tgUser.username;
              }
            }
            if (!finalTgId) {
              finalTgId = String(tgUser.id);
            }
            if (tgUser.photo_url) {
              finalPhotoUrl = tgUser.photo_url;
            }
          }
        }

        // 3. Fallback to localStorage if still empty
        if (!finalName) {
          finalName = getStorage('client_name') || '';
        }
        if (!finalPhone) {
          finalPhone = getStorage('client_phone') || '';
        }
        if (!finalTgId) {
          finalTgId = getStorage('client_telegram_id') || '';
        }
        if (!finalPhotoUrl) {
          finalPhotoUrl = getStorage('client_photo_url') || '';
        }

        // 4. Default mock data fallback for testing/local PC (prevent blocking empty inputs)
        if (!finalName) {
          finalName = 'Иван';
        }
        if (!finalPhone) {
          finalPhone = '+998 90 123-45-67';
        }

        // Update state and localStorage
        setClientName(finalName);
        setClientPhone(finalPhone);
        if (finalTgId) {
          setClientTelegramId(finalTgId);
          setStorage('client_telegram_id', finalTgId);
        }
        if (finalPhotoUrl) {
          setClientPhotoUrl(finalPhotoUrl);
          setStorage('client_photo_url', finalPhotoUrl);
        }
        setStorage('client_name', finalName);
        setStorage('client_phone', finalPhone);
      } catch (err) {
        console.error("Error in mount useEffect:", err);
      } finally {
        setIsParamsChecked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }
    const fetchBusinessDetails = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch business info
        const resBus = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}`);
        if (!resBus.ok) throw new Error('Failed to fetch business');
        const dataBus = await resBus.json();
        setBusinessData(dataBus);

        // Save active business details to localStorage for subpages (history, profile)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('mini_app_settings', JSON.stringify({
              primaryColor: dataBus.primary_color || '#ff5a1f',
              name: dataBus.name || 'Elite Barber',
              logo: dataBus.logo || 'EB',
              coverImage: dataBus.cover_image || '',
              phone: dataBus.phone || '',
              address: dataBus.address || '',
              telegram: dataBus.telegram || '',
              instagram: dataBus.instagram || ''
            }));
          } catch (e) {}
        }

        // Apply primary color branding dynamically
        const primaryColor = dataBus.primary_color || '#ff5a1f';
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-hover', primaryColor + 'cc');
        
        // Hex color to RGBA conversion for smooth glow/shadow variables
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        try {
          if (primaryColor.startsWith('#') && primaryColor.length === 7) {
            document.documentElement.style.setProperty('--primary-glow', hexToRgba(primaryColor, 0.08));
            document.documentElement.style.setProperty('--primary-glow-ring', hexToRgba(primaryColor, 0.2));
          }
        } catch (colorErr) {
          console.error('Failed to parse color:', colorErr);
        }

        // 2. Fetch services
        const resServ = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}/services`);
        if (resServ.ok) {
          const dataServ = await resServ.json();
          setDbServices(dataServ.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            price: s.price,
            duration: s.duration,
            description: s.description || '',
            image: s.image || ''
          })));
        }

        // 3. Fetch masters
        const resMast = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}/masters`);
        if (resMast.ok) {
          const dataMast = await resMast.json();
          setDbMasters(dataMast.map((m: any) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar ? (m.avatar.startsWith('http') || m.avatar.startsWith('data:') ? m.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=ff5a1f&bold=true`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=f1f5f9&color=ff5a1f&bold=true`,
            services: m.services || [],
            description: m.description || 'Опытный мастер нашего салона.',
            rating: m.rating || 5.0
          })));
        }
      } catch (err) {
        console.error('Error fetching public business details:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessId]);

  // Fetch busy slots when date or master changes
  useEffect(() => {
    if (!selectedMaster) {
      setBusySlots([]);
      return;
    }
    const fetchBusySlots = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/v1/public/businesses/${businessId}/bookings/busy-slots?date=${selectedDate}&master_id=${selectedMaster.id}`);
        if (res.ok) {
          const slots = await res.json();
          setBusySlots(slots);
        }
      } catch (err) {
        console.error('Error fetching busy slots:', err);
      }
    };
    fetchBusySlots();
  }, [selectedDate, selectedMaster, businessId]);

  // Client info loaded successfully on mount

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Все' || service.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, services]);

  // Available masters based on selected service
  const availableMasters = useMemo(() => {
    if (!selectedService) return masters;
    return masters.filter(master => master.services.includes(selectedService.id));
  }, [selectedService, masters]);

  // Categories list
  const categories = ['Все', 'Стрижки', 'Борода', 'Комбо', 'Уход'];

  // Handle Form Submission
  const handleSubmitBooking = async () => {
    if (!clientName || !clientPhone) {
      showToast('Пожалуйста, заполните имя и телефон');
      return;
    }
    if (!selectedService || !selectedMaster || !selectedTime) {
      showToast('Не все параметры записи выбраны');
      return;
    }

    try {
      const payload = {
        business_id: businessId,
        master_id: selectedMaster.id,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        client_telegram_id: clientTelegramId || undefined,
        date: selectedDate,
        time: selectedTime,
        comment: clientComment || undefined
      };

      const res = await fetch(`${API_HOST}/api/v1/public/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to submit booking');
      }

      // Save client details locally
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('client_name', clientName);
          localStorage.setItem('client_phone', clientPhone);
        } catch (e) {}
      }

      // Show success toast and redirect to history
      showToast('✅ Запись успешно оформлена!');
      setTimeout(() => {
        router.push(`/history?b=${businessId}`);
      }, 1200);
    } catch (err: any) {
      showToast(err.message || 'Ошибка создания записи');
    }
  };

  // Format date for display
  const getSelectedDateText = () => {
    const matched = bookingDates.find(d => d.dateStr === selectedDate);
    return matched ? matched.fullText : selectedDate;
  };

  // Reset booking flow
  const handleReset = () => {
    setSelectedService(null);
    setSelectedMaster(null);
    setSelectedDate(bookingDates[0].dateStr);
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setClientComment('');
    setSearchQuery('');
    setActiveCategory('Все');
    setActiveView('hub');
  };

  const getWeekScheduleList = () => {
    if (businessData?.schedule) {
      try {
        const parsed = JSON.parse(businessData.schedule);
        if (Array.isArray(parsed) && parsed.length === 7) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { dayName: 'Понедельник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Вторник', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Среда', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Четверг', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Пятница', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Суббота', isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { dayName: 'Воскресенье', isOpen: false, openTime: '10:00', closeTime: '18:00' }
    ];
  };

  const getTodayScheduleText = () => {
    const list = getWeekScheduleList();
    const now = new Date();
    const tashkentStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
    const dayIndex = new Date(tashkentStr).getDay();
    const mapDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const today = list[mapDayIndex];
    if (today) {
      return today.isOpen ? `Сегодня работает до ${today.closeTime}` : 'Сегодня выходной';
    }
    return 'Режим работы не указан';
  };

  const getInitials = (name: string) => {
    if (!name) return 'К';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const isValidImageUrl = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:');
  };


  if (!isParamsChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#ff5a1f] rounded-full animate-spin" />
          <span className="text-slate-400 text-xs font-bold font-evolventa">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!businessId || hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-200/80 shadow-none space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-xl mx-auto shrink-0 select-none">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-800 font-evolventa">
              {!businessId ? "Укажите ID салона" : "Салон не найден"}
            </h2>
            <p className="text-slate-400 text-xs font-evolventa leading-relaxed">
              {!businessId 
                ? "Для входа в Mini App необходимо указать идентификатор салона в ссылке, например: ?b=b1"
                : `Не удалось загрузить данные салона с ID "${businessId}". Пожалуйста, убедитесь, что ссылка верна.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased pb-24 w-full relative overflow-hidden">
      
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section for Steps 1-4 */}
      {activeView !== 'checkout' && (
        <div className="relative h-64 bg-slate-900 flex flex-col justify-between p-5 shrink-0 select-none z-0">
          {/* Background Cover Wrapper */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-65 scale-102 animate-ken-burns" 
              style={{ backgroundImage: `url('${businessData?.cover_image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80'}')` }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
          </div>
          
          {/* Top Row: Native App Header Bar */}
          <div className="relative z-10 flex items-center justify-between mt-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/40 overflow-hidden shrink-0">
                  {businessData?.logo && (businessData.logo.startsWith('http') || businessData.logo.startsWith('data:') || businessData.logo.startsWith('/')) ? (
                    <img src={businessData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black uppercase font-evolventa">{businessData?.logo || getInitials(businessData?.name || 'Elite Barber')}</span>
                  )}
                </div>
                <span className="text-white font-extrabold text-sm tracking-wide font-evolventa drop-shadow-md">
                  {businessData?.name || 'Elite Barber'}
                </span>
              </div>
            </div>

            {/* Profile Photo Avatar */}
            <Link 
              href={`/profile?b=${businessId}`}
              title="Профиль клиента"
              className="relative group cursor-pointer active:scale-95 springy-transition"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white/20 overflow-hidden shadow-lg group-hover:border-white/50 transition-colors">
                {clientPhotoUrl ? (
                  <img src={clientPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/15 text-[var(--primary)] font-black text-[13px] font-evolventa">
                    {getInitials(clientName)}
                  </div>
                )}
              </div>
              {/* Notification/Status Dot */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </Link>
          </div>

          {/* Bottom Row: Header text & actions */}
          <div className="relative z-10 flex items-end justify-between pb-8 px-1">
            {/* Left: Text and Status */}
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white font-evolventa tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {businessData?.name || 'Elite Barber'}
                </h2>
                <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-300 font-evolventa uppercase tracking-wider">Открыто</span>
                </div>
              </div>
              <p className="text-[10px] text-white/75 font-medium font-evolventa flex items-center gap-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                <svg className="w-3.5 h-3.5 text-[var(--primary)] filter drop-shadow-[0_0_2px_var(--primary-glow)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{businessData?.address || 'ул. Амира Темура, д. 45'}</span>
              </p>
            </div>

            {/* Right: Quick Action Circles */}
            <div className="flex items-center gap-2">
              <button onClick={() => setIsAboutOpen(true)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xl border border-white/60 flex items-center justify-center text-slate-800 active:scale-90 springy-transition cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)] group">
                <svg className="w-4.5 h-4.5 group-hover:text-[var(--primary)] transition-colors duration-300 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </button>
                  <button onClick={() => setIsAboutOpen(true)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xl border border-white/60 flex items-center justify-center text-slate-800 active:scale-90 springy-transition cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)] group">
                    <svg className="w-4 h-4 group-hover:text-[var(--primary)] transition-colors duration-300 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button onClick={() => setIsAboutOpen(true)} className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xl border border-white/60 flex items-center justify-center text-slate-800 active:scale-90 springy-transition cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.15)] group">
                    <svg className="w-4 h-4 group-hover:text-[var(--primary)] transition-colors duration-300 drop-shadow-sm group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Main Content Section overlapping the cover photo */}
          <div className={`flex flex-col flex-1 bg-slate-50 ${activeView !== 'checkout' ? 'rounded-t-[32px] -mt-6 relative z-20 pt-0' : 'relative z-20 min-h-screen'}`}>

          {/* HUB VIEW: Main Booking Dashboard */}
          {activeView === 'hub' && (
            <div className="flex-1 px-4 py-6 flex flex-col select-none animate-fade-slide-up relative bg-slate-50 rounded-t-[32px] pb-6">
              <h3 className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest font-evolventa mb-3 px-2">Детали записи</h3>
              <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-slate-200/60 overflow-hidden">
                {/* Master */}
                <div onClick={() => setActiveView('select-master')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100/80 active:bg-slate-100">
                  <div className="flex items-center gap-3.5">
                    {selectedMaster ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-300/50 shadow-sm shrink-0 flex items-center justify-center bg-orange-50 font-bold text-xs text-[#ff5a1f] font-evolventa">
                        {isValidImageUrl(selectedMaster.avatar) ? (
                          <img src={selectedMaster.avatar} alt={selectedMaster.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(selectedMaster.name)
                        )}
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200/60 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Специалист</p>
                      <p className="text-[14px] font-extrabold text-slate-800 font-evolventa">{selectedMaster ? selectedMaster.name : 'Любой мастер'}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>

                {/* Date/Time */}
                <div onClick={() => setActiveView('select-datetime')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100/80 active:bg-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Дата и время</p>
                      <p className={`text-[14px] font-extrabold font-evolventa ${selectedTime ? 'text-slate-800' : 'text-[var(--primary)]'}`}>{selectedTime ? `${getSelectedDateText()}, ${selectedTime}` : 'Выбрать время'}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>

                {/* Service */}
                <div onClick={() => setActiveView('select-service')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors active:bg-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                      {selectedService?.image ? (
                        <img src={selectedService.image} alt="Service" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l-7-7m7 7l-2.828 2.828M15 11l4.243-4.243a2 2 0 00-2.828-2.828L12.172 8.172" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Услуга</p>
                      <p className={`text-[14px] font-extrabold font-evolventa truncate ${selectedService ? 'text-slate-800' : 'text-[var(--primary)]'}`}>{selectedService ? selectedService.name : 'Выбрать услугу'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedService && <span className="text-[12px] font-black text-slate-800">{selectedService.price.toLocaleString('ru-RU')} сум</span>}
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* STEP 1: SELECT SERVICE */}
          {activeView === 'select-service' && (
            <div className="flex-1 p-4 flex flex-col gap-4 select-none animate-fade-slide-up">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="font-extrabold text-[16px] font-evolventa text-slate-800">Выберите услугу</span>
                <button onClick={() => setActiveView('hub')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform hover:bg-slate-200">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Minimalist Search Bar */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Поиск услуг..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/70 border-none text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-slate-100 focus:ring-1 focus:ring-slate-200 transition-colors font-evolventa"
                />
                <svg className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Minimalist Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 select-none scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Services List */}
              <div className="space-y-3 pb-2">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => { setSelectedService(service); setActiveView('hub'); }}
                        className={`p-3.5 rounded-[24px] cursor-pointer smooth-transition flex items-center gap-3.5 border bg-white/70 backdrop-blur-md ${
                          isSelected
                            ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                            : 'border-slate-200/60 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        {/* Service Photo */}
                        <div className="relative w-16 h-16 shrink-0 rounded-[16px] overflow-hidden bg-slate-100">
                          {service.image ? (
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col min-w-0 py-0.5">
                          <h4 className="font-extrabold text-slate-800 text-[13.5px] font-evolventa truncate">
                            {service.name}
                          </h4>
                          <p className="text-[10.5px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                            {service.description}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[13px] font-extrabold text-slate-800 font-evolventa">
                              {service.price.toLocaleString('ru-RU')} сум
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="9" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                              </svg>
                              <span>{service.duration} мин</span>
                            </div>
                          </div>
                        </div>

                        {/* Selection Radio */}
                        <div className="shrink-0 flex items-center justify-center pr-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    Услуги не найдены. Попробуйте другой запрос.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 2: SELECT MASTER */}
          {activeView === 'select-master' && (
            <div className="flex-1 p-4 flex flex-col gap-4 select-none animate-fade-slide-up">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="font-extrabold text-[16px] font-evolventa text-slate-800">Выберите специалиста</span>
                <button onClick={() => setActiveView('hub')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform hover:bg-slate-200">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Master Cards */}
              <div className="space-y-3.5">
                <div 
                  onClick={() => { setSelectedMaster(null); setActiveView('hub'); }}
                  className={`p-2.5 rounded-[20px] bg-white/70 backdrop-blur-md border cursor-pointer smooth-transition flex items-center gap-3 ${
                    !selectedMaster
                      ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                      : 'border-slate-200/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-[14px] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-extrabold text-slate-800 text-[13px] font-evolventa">Любой мастер</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-snug truncate">Подберем свободного специалиста</p>
                  </div>
                </div>

                {availableMasters.map((master) => {
                  const isSelected = selectedMaster?.id === master.id;
                  return (
                    <div
                      key={master.id}
                      onClick={() => { setSelectedMaster(master); setActiveView('hub'); }}
                      className={`p-3.5 rounded-[24px] bg-white/70 backdrop-blur-md border cursor-pointer smooth-transition flex flex-col gap-2.5 ${
                        isSelected
                          ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                          : 'border-slate-200/60 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Photo Avatar */}
                        <div className="w-14 h-14 rounded-[18px] bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center bg-orange-50 font-black text-sm text-[#ff5a1f] font-evolventa">
                          {isValidImageUrl(master.avatar) ? (
                            <img src={master.avatar} alt={master.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(master.name)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-slate-800 text-sm font-evolventa truncate">
                              {master.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                              <span>{master.rating}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">
                            Опыт более 5 лет
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-450 leading-relaxed border-t border-slate-50 pt-2 text-left">
                        {master.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DATE AND TIME */}
          {activeView === 'select-datetime' && (
            <div className="flex-1 p-4 flex flex-col gap-5 select-none animate-fade-slide-up">
              <div className="flex items-center justify-between px-1">
                <span className="font-extrabold text-[16px] font-evolventa text-slate-800">Выберите дату и время</span>
                <button onClick={() => setActiveView('hub')} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform hover:bg-slate-200">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Date Horizontal Carousel */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-500 font-evolventa block">Дата визита</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
                  {bookingDates.map((date) => {
                    const isSelected = selectedDate === date.dateStr;
                    return (
                      <button
                        key={date.dateStr}
                        onClick={() => setSelectedDate(date.dateStr)}
                        className={`w-14 py-3.5 rounded-[22px] border flex flex-col items-center gap-1.5 shrink-0 smooth-transition cursor-pointer backdrop-blur-sm ${
                          isSelected
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md'
                            : 'bg-white/80 border-slate-200/60 text-slate-700 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {date.dayName}
                        </span>
                        <span className="text-[15px] font-black font-evolventa leading-none">
                          {date.dayNum}
                        </span>
                        <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {date.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Grid slots */}
              <div className="space-y-2.5">
                <label className="text-xs font-extrabold text-slate-500 font-evolventa block">Доступное время</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isBusy = busySlots.includes(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        disabled={isBusy}
                        onClick={() => { if (!isBusy) { setSelectedTime(time); setActiveView('hub'); } }}
                        className={`py-3.5 rounded-[18px] border text-[13px] smooth-transition font-evolventa backdrop-blur-sm ${
                          isBusy
                            ? 'bg-slate-100/50 border-slate-200/40 text-slate-300 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-black shadow-[0_4px_12px_var(--primary-glow)] ring-1 ring-[var(--primary)]/20'
                            : 'bg-white/70 border-slate-200/60 text-slate-600 font-bold hover:bg-white hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: CHECKOUT (Full Screen, No inputs, No Scroll) */}
          {activeView === 'checkout' && (
            <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col animate-fade-slide-up overflow-hidden">
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4 border border-[var(--primary)]/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <h2 className="text-[18px] font-black font-evolventa text-slate-800 tracking-tight text-center mb-1.5">Проверьте детали</h2>
                <p className="text-[11px] text-slate-400 font-medium text-center max-w-[260px] mb-6 leading-snug">
                  Пожалуйста, убедитесь, что всё указано верно.
                </p>

                <div className="w-full bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-[20px] overflow-hidden max-w-sm">
                   <div className="py-2.5 px-4 border-b border-slate-100/80 flex items-center justify-between">
                     <div>
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Салон</p>
                       <p className="text-[13px] font-black font-evolventa text-slate-800">{businessData?.name || 'Elite Barber'}</p>
                     </div>
                   </div>
                   <div className="py-2.5 px-4 border-b border-slate-100/80">
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Услуга</p>
                     <p className="text-[14px] font-black font-evolventa text-slate-800 leading-snug">{selectedService?.name}</p>
                   </div>
                   <div className="py-2.5 px-4 flex items-center justify-between border-b border-slate-100/80">
                     <div>
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Сумма</p>
                       <p className="text-[13px] font-bold text-slate-800">{selectedService?.price.toLocaleString('ru-RU')} сум</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Длительность</p>
                       <p className="text-[13px] font-bold text-slate-800">{selectedService?.duration} мин</p>
                     </div>
                   </div>
                   <div className="py-2.5 px-4 flex items-center justify-between border-b border-slate-100/80">
                     <div>
                       <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Специалист</p>
                       <p className="text-[13px] font-bold text-slate-800">{selectedMaster?.name || 'Любой свободный мастер'}</p>
                     </div>
                   </div>
                   <div className="py-2.5 px-4 bg-[var(--primary)]/5 flex items-center justify-between border-b border-slate-100/80">
                     <div>
                       <p className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-widest mb-0.5">Дата и время визита</p>
                       <p className="text-[15px] font-black font-evolventa text-[var(--primary)]">{getSelectedDateText()}, {selectedTime}</p>
                     </div>
                   </div>
                   <div className="py-2.5 px-4 border-b border-slate-100/80">
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Ваше имя</p>
                     <input
                       type="text"
                       placeholder="Имя"
                       value={clientName}
                       onChange={(e) => setClientName(e.target.value)}
                       className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:border-[var(--primary)]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-colors font-bold font-evolventa"
                     />
                   </div>
                   <div className="py-2.5 px-4">
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Номер телефона</p>
                     <input
                       type="tel"
                       placeholder="+998 90 123-45-67"
                       value={clientPhone}
                       onChange={(e) => setClientPhone(e.target.value)}
                       className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:border-[var(--primary)]/30 focus:bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/10 transition-colors font-bold font-evolventa"
                     />
                   </div>
                </div>
              </div>

              {/* Checkout Save Button (Pinned to Bottom) */}
              <div className="p-4 pb-6 mt-auto flex items-center gap-2.5 bg-slate-50">
                <button 
                  onClick={() => setActiveView('hub')} 
                  className="w-12 h-12 rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-slate-400 active:scale-95 transition-transform shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={handleSubmitBooking} 
                  className="flex-1 h-12 rounded-[18px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold text-[14px] font-evolventa active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  Подтвердить
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Powered by Bronly Footer */}
          {activeView !== 'checkout' && (
            <div className="flex items-center justify-center gap-1.5 mt-auto pt-6 pb-6 opacity-40 select-none">
              <span className="text-[10px] font-bold text-slate-400 font-evolventa uppercase tracking-wider">Работает на</span>
              <img src="/b-orange.svg" alt="B" className="w-3.5 h-3.5 object-contain" />
              <span className="font-extrabold text-[13px] text-slate-750 tracking-tight font-evolventa lowercase">
                bronly<span className="text-[var(--primary)] font-black">.</span>
              </span>
            </div>
          )}
          </div>

          {/* Floating Dynamic Bottom Navigation */}
          {activeView !== 'checkout' && (
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[280px] z-30 bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[24px] transition-all duration-300">
               {selectedService && selectedTime ? (
                  /* Checkout Action State */
                  <div className="p-1 animate-fade-slide-up">
                    <button
                      onClick={() => setActiveView('checkout')}
                      className="w-full py-2.5 rounded-[20px] flex items-center justify-center gap-2 font-extrabold text-[15px] font-evolventa transition-all duration-300 bg-[var(--primary)] text-white shadow-[0_4px_16px_var(--primary-glow)] active:scale-95"
                    >
                      <span>Оформить визит</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
               ) : (
                  /* App Navigation Menu State */
                  <div className="flex items-center justify-between px-6 py-2 animate-fade-slide-up">
                    <Link href={`/?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-[var(--primary)] group">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      </div>
                      <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Запись</span>
                    </Link>
                    
                    <Link href={`/history?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">История</span>
                    </Link>

                    <Link href={`/profile?b=${businessId}`} className="flex flex-col items-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-slate-600">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <span className="text-[9px] font-black font-evolventa tracking-wider uppercase">Профиль</span>
                    </Link>
                  </div>
               )}
             </div>
           )}

      {/* Contact Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/30 backdrop-blur-[2px] z-50 flex flex-col justify-end select-none transition-all duration-300 ${
          isAboutOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsAboutOpen(false)}
      >
        <div 
          className={`bg-white/95 backdrop-blur-xl w-full max-w-md mx-auto rounded-t-[32px] p-6 pb-12 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border-t border-white/50 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isAboutOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto mb-6" />
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[18px] font-black text-slate-800 font-evolventa mb-1">Наши контакты</h3>
              <p className="text-[12px] font-bold text-slate-400">Свяжитесь с нами любым способом</p>
            </div>
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Адрес</p>
                <p className="text-[13px] font-black text-slate-800">{businessData?.address || 'Не указан'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Телефон</p>
                {businessData?.phone ? (
                  <a href={`tel:${businessData.phone.replace(/\s+/g, '')}`} className="text-[13px] font-black text-slate-800">
                    {businessData.phone}
                  </a>
                ) : (
                  <span className="text-[13px] font-bold text-slate-400">Не указан</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100/60 pt-3">
              <div 
                onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Режим работы</p>
                    <p className="text-[13px] font-black text-slate-800">
                      {getTodayScheduleText()}
                    </p>
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-slate-400 smooth-transition ${isScheduleExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded 7-day schedule */}
              {isScheduleExpanded && (
                <div className="pl-13 pr-2 py-2 space-y-2 select-none animate-fade-slide-up bg-slate-50/50 rounded-2xl border border-slate-100 p-3 mt-1">
                  {getWeekScheduleList().map((d: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">{d.dayName}</span>
                      <span className={`font-black ${d.isOpen ? 'text-slate-800' : 'text-rose-500'}`}>
                        {d.isOpen ? `${d.openTime} - ${d.closeTime}` : 'Выходной'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {businessData?.telegram ? (
            <a 
              href={`https://t.me/${businessData.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-6 py-3.5 rounded-[20px] bg-[#2AABEE] hover:bg-[#2298D6] text-white flex items-center justify-center gap-2 text-[14px] font-extrabold font-evolventa transition-all active:scale-95 shadow-[0_4px_16px_rgba(42,171,238,0.3)]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.304-.346-.108l-6.398 4.025-2.766-.864c-.602-.188-.614-.602.125-.893l10.82-4.168c.502-.18.948.118.825.859z"/></svg>
              <span>Открыть чат в Telegram</span>
            </a>
          ) : (
            <div className="w-full mt-6 py-3.5 rounded-[20px] bg-slate-100 text-slate-400 flex items-center justify-center gap-2 text-[14px] font-bold font-evolventa select-none border border-slate-200/50">
              <span>Telegram не указан</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
