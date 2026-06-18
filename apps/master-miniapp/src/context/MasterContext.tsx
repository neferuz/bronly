'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Master {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  isActive: boolean;
  services?: string[];
  telegramId?: string | null;
}

export interface Business {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  schedule?: string | null;
  commissionRate?: number;
}

type AuthStatus = 'loading' | 'link_required' | 'unauthorized' | 'no_params' | 'success';

interface MasterContextType {
  authStatus: AuthStatus;
  businessId: string;
  masterId: string;
  telegramId: string;
  currentMaster: Master | null;
  business: Business | null;
  services: Service[];
  errorMessage: string;
  setAuthStatus: (status: AuthStatus) => void;
  setCurrentMaster: React.Dispatch<React.SetStateAction<Master | null>>;
  handleLinkAccount: () => Promise<void>;
  toggleMasterActive: () => Promise<void>;
  refreshContextData: () => Promise<void>;
}

const MasterContext = createContext<MasterContextType | undefined>(undefined);

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function MasterProvider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [businessId, setBusinessId] = useState<string>('');
  const [masterId, setMasterId] = useState<string>('');
  const [telegramId, setTelegramId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentMaster, setCurrentMaster] = useState<Master | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const initAuth = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      let qB = params.get('b') || params.get('business_id');

      if (!qB && typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const systemRoutes = ['profile', 'history'];
        if (pathParts.length > 0 && !systemRoutes.includes(pathParts[0])) {
          qB = pathParts[0];
        }
      }

      const qM = params.get('m') || params.get('master_id');
      const qTg = params.get('tg_id') || params.get('telegram_id');
      const qStartParam = params.get('tgWebAppStartParam') || params.get('start_param') || params.get('startapp') || '';

      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      let tgStartParam = '';
      let tgUserId = '';
      
      if (tg) {
        if (typeof tg.ready === 'function') {
          try { tg.ready(); } catch(e) {}
        }
        if (typeof tg.expand === 'function') {
          try { tg.expand(); } catch(e) {}
        }
        if (typeof tg.enableClosingConfirmation === 'function') {
          try { tg.enableClosingConfirmation(); } catch(e) {}
        }
        if (typeof tg.disableVerticalSwipes === 'function') {
          try { tg.disableVerticalSwipes(); } catch(e) {}
        }
        tgStartParam = tg.initDataUnsafe?.start_param || qStartParam || '';
        if (tg.initDataUnsafe?.user) {
          tgUserId = String(tg.initDataUnsafe.user.id);
        }
      } else {
        tgStartParam = qStartParam;
      }

      let finalB = qB || '';
      let finalM = qM || '';
      let finalTg = qTg || tgUserId || '';

      if (tgStartParam) {
        const parts = tgStartParam.split('_');
        if (parts.length >= 2) {
          const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          if (uuidPattern.test(parts[0])) {
            finalB = parts[0];
            finalM = parts.slice(1).join('_');
          } else {
            finalB = parts.slice(0, -1).join('_');
            finalM = parts[parts.length - 1];
          }
        }
      }

      if (typeof window !== 'undefined') {
        if (!finalB) finalB = localStorage.getItem('master_business_id') || '';
        if (!finalM) finalM = localStorage.getItem('master_id') || '';
        if (!finalTg) finalTg = localStorage.getItem('master_telegram_id') || '';
      }

      if (!finalB || (!finalM && !finalTg)) {
        setAuthStatus('no_params');
        return;
      }

      setBusinessId(finalB);
      setMasterId(finalM);
      setTelegramId(finalTg);

      if (typeof window !== 'undefined') {
        localStorage.setItem('master_business_id', finalB);
        if (finalM) localStorage.setItem('master_id', finalM);
        if (finalTg) localStorage.setItem('master_telegram_id', finalTg);
      }

      // Fetch verify status
      const url = `${API_HOST}/api/v1/public/masters/verify?business_id=${finalB}&master_id=${finalM}&telegram_id=${finalTg}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          setErrorMessage('Профиль мастера не найден в системе.');
          setAuthStatus('unauthorized');
        } else {
          setErrorMessage('Ошибка сервера при проверке доступа.');
          setAuthStatus('unauthorized');
        }
        return;
      }

      const data = await res.json();
      
      let loadedMaster: Master | null = null;
      if (data.master) {
        const m = data.master;
        setMasterId(m.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('master_id', m.id);
        }
        loadedMaster = {
          id: m.id,
          name: m.name,
          avatar: m.avatar || '',
          phone: m.phone || '',
          rating: m.rating || 5.0,
          isActive: m.is_active,
          services: m.services || [],
          telegramId: m.telegram_id
        };
        setCurrentMaster(loadedMaster);
      }

      // Fetch business details & services
      try {
        const [bRes, sRes] = await Promise.all([
          fetch(`${API_HOST}/api/v1/public/businesses/${finalB}`),
          fetch(`${API_HOST}/api/v1/public/businesses/${finalB}/services`)
        ]);

        if (bRes.ok) {
          const bData = await bRes.json();
          setBusiness({
            id: bData.id,
            name: bData.name,
            address: bData.address,
            phone: bData.phone,
            schedule: bData.schedule,
            commissionRate: bData.commission_rate
          });
        }

        if (sRes.ok) {
          const sData = await sRes.json();
          const mapped = sData.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration
          }));
          setServices(mapped);
        }
      } catch (fetchErr) {
        console.error("Error fetching business or services:", fetchErr);
      }

      if (data.status === 'link_required') {
        if (!finalTg) {
          setErrorMessage('Для привязки кабинета откройте его внутри Telegram.');
          setAuthStatus('unauthorized');
        } else {
          setAuthStatus('link_required');
        }
      } else if (data.status === 'success') {
        setAuthStatus('success');
      } else {
        setErrorMessage(data.message || 'Доступ к кабинету ограничен.');
        setAuthStatus('unauthorized');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Не удалось связаться с сервером.');
      setAuthStatus('unauthorized');
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleLinkAccount = async () => {
    if (!businessId || !masterId || !telegramId) return;
    setAuthStatus('loading');
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/masters/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          master_id: masterId,
          telegram_id: telegramId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          if (data.master) {
            const m = data.master;
            setCurrentMaster({
              id: m.id,
              name: m.name,
              avatar: m.avatar || '',
              phone: m.phone || '',
              rating: m.rating || 5.0,
              isActive: m.is_active,
              services: m.services || [],
              telegramId: m.telegram_id
            });
          }
          setAuthStatus('success');
        } else {
          setErrorMessage(data.message || 'Ошибка при привязке аккаунта.');
          setAuthStatus('unauthorized');
        }
      } else {
        setErrorMessage('Не удалось привязать аккаунт.');
        setAuthStatus('unauthorized');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Ошибка сети при привязке.');
      setAuthStatus('unauthorized');
    }
  };

  const toggleMasterActive = async () => {
    if (!currentMaster || !masterId || !telegramId) return;
    const nextStatus = !currentMaster.isActive;
    try {
      const res = await fetch(`${API_HOST}/api/v1/public/masters/${masterId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: nextStatus,
          telegram_id: telegramId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentMaster(prev => prev ? { ...prev, isActive: data.is_active } : null);
      }
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const refreshContextData = async () => {
    if (!businessId) return;
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_HOST}/api/v1/public/businesses/${businessId}`),
        fetch(`${API_HOST}/api/v1/public/businesses/${businessId}/services`)
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        setBusiness({
          id: bData.id,
          name: bData.name,
          address: bData.address,
          phone: bData.phone,
          schedule: bData.schedule,
          commissionRate: bData.commission_rate
        });
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        const mapped = sData.map((s: any) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        }));
        setServices(mapped);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  // --- RENDER TOP-LEVEL SCREENS IN PROVIDER TO PROTECT PAGES ---
  if (authStatus === 'loading') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6">
        <div className="w-12 h-12 border-4 border-t-[#ff5a1f] border-slate-700 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-400 font-evolventa">Проверка прав доступа...</p>
      </div>
    );
  }

  if (authStatus === 'no_params') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-[#ff5a1f]/10 border border-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f] mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-2">Кабинет Мастера Bronly</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Пожалуйста, откройте это приложение через официального Telegram-бота по вашей персональной ссылке.
        </p>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-2">Доступ ограничен</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
          {errorMessage || 'Данный Telegram-аккаунт не имеет доступа к этому кабинету мастера.'}
        </p>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-evolventa">
          Bronly Security System
        </span>
      </div>
    );
  }

  if (authStatus === 'link_required') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-6 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-[#ff5a1f]/30 flex items-center justify-center text-3xl font-black text-[#ff5a1f] mb-6 font-evolventa">
          {currentMaster ? (currentMaster.avatar && currentMaster.avatar.length <= 3 ? currentMaster.avatar : currentMaster.name.split(' ').map(n=>n[0]).join('').slice(0,2)) : 'М'}
        </div>
        <h3 className="text-lg font-black font-evolventa tracking-tight mb-1">Привязка кабинета</h3>
        <p className="text-sm font-bold text-[#ff5a1f] mb-4 font-evolventa">{currentMaster?.name}</p>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
          Этот кабинет мастера еще не привязан к вашему Telegram-аккаунту. Нажмите кнопку ниже для подтверждения привязки.
        </p>
        
        <button
          onClick={handleLinkAccount}
          className="w-full max-w-xs py-4 rounded-[20px] bg-[#ff5a1f] text-white font-extrabold text-[14px] font-evolventa tracking-wide uppercase shadow-[0_8px_30px_rgb(255,90,31,0.2)] active:scale-95 transition-transform cursor-pointer"
        >
          Подтвердить привязку
        </button>
      </div>
    );
  }

  return (
    <MasterContext.Provider
      value={{
        authStatus,
        businessId,
        masterId,
        telegramId,
        currentMaster,
        business,
        services,
        errorMessage,
        setAuthStatus,
        setCurrentMaster,
        handleLinkAccount,
        toggleMasterActive,
        refreshContextData
      }}
    >
      {children}
    </MasterContext.Provider>
  );
}

export function useMaster() {
  const context = useContext(MasterContext);
  if (context === undefined) {
    throw new Error('useMaster must be used within a MasterProvider');
  }
  return context;
}
