'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { User, Business as TypesBusiness, Appointment } from '@bronly/types';
import { ToastProvider, useToast } from '../components/ui/Toast';

// Extend interfaces for convenient local usage
export interface Master {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  description: string;
  services: string[]; // Service IDs
  isActive: boolean;
  telegramLink: string;
  telegramId?: string | null;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  description?: string;
  image?: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientTelegramId?: string;
  masterId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'new' | 'confirmed' | 'completed' | 'cancelled' | 'noshow';
  price: number;
  comment?: string;
}

export interface MiniAppSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  instagram: string;
  telegram: string;
  logo: string;
  coverImage: string;
  primaryColor: string; // hex
  schedule?: string;
}

export interface BusinessSettings {
  name: string;
  phone: string;
  address: string;
  currency: string;
  timezone: string;
  minBufferHours: number;
  maxBookingDays: number;
  ownerName?: string;
  ownerEmail?: string;
}

interface BusinessContextType {
  masters: Master[];
  services: Service[];
  bookings: Booking[];
  miniAppSettings: MiniAppSettings;
  settings: BusinessSettings;
  fetchData: () => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  addMaster: (master: Omit<Master, 'id' | 'isActive' | 'telegramLink'>) => void;
  updateMaster: (id: string, master: Partial<Omit<Master, 'id'>>) => void;
  addService: (service: Omit<Service, 'id' | 'isActive'>) => void;
  updateService: (id: string, service: Partial<Omit<Service, 'id'>>) => void;
  deleteService: (id: string) => void;
  toggleServiceStatus: (id: string) => void;
  updateMiniAppSettings: (settings: Partial<MiniAppSettings>) => void;
  updateSettings: (settings: Partial<BusinessSettings>) => void;
  toggleMasterStatus: (id: string) => void;
  deleteMaster: (id: string) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_HOST}/api/v1`;


export const BusinessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <BusinessProviderInner>{children}</BusinessProviderInner>
    </ToastProvider>
  );
};

const BusinessProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  // State variables initially loaded as empty arrays/defaults
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [miniAppSettings, setMiniAppSettings] = useState<MiniAppSettings>({
    name: '',
    description: '',
    address: '',
    phone: '',
    instagram: '',
    telegram: '',
    logo: '',
    coverImage: '',
    primaryColor: '#ff5a1f',
    schedule: ''
  });

  const [settings, setSettings] = useState<BusinessSettings>({
    name: '',
    phone: '',
    address: '',
    currency: 'сум',
    timezone: 'Asia/Tashkent (GMT+5)',
    minBufferHours: 2,
    maxBookingDays: 30,
    ownerName: '',
    ownerEmail: ''
  });

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('business_admin_logged_in') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, []);

  const handleResponse = useCallback(async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('business_admin_logged_in');
        window.location.href = '/login';
      }
      throw new Error('Неавторизован. Пожалуйста, войдите снова.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.detail === 'Inactive business' || err.detail === 'Inactive business account') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('business_admin_logged_in');
          window.location.href = '/login?error=blocked';
        }
      }
      throw new Error(err.detail || 'Произошла ошибка при запросе к серверу');
    }
    return res.json();
  }, []);


  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('business_admin_logged_in') : null;
    if (!token) return;

    try {
      // 1. Fetch current business profile settings
      const businessData = await fetch(`${BASE_URL}/businesses/me`, { headers: getHeaders() }).then(handleResponse);
      setMiniAppSettings({
        name: businessData.name || '',
        description: businessData.description || '',
        address: businessData.address || '',
        phone: businessData.phone || '',
        instagram: businessData.instagram || '',
        telegram: businessData.telegram || '',
        logo: businessData.logo || '',
        coverImage: businessData.cover_image || '',
        primaryColor: businessData.primary_color || '#ff5a1f',
        schedule: businessData.schedule || ''
      });

      setSettings({
        name: businessData.name || '',
        phone: businessData.phone || '',
        address: businessData.address || '',
        currency: businessData.currency || 'сум',
        timezone: businessData.timezone || 'Asia/Tashkent (GMT+5)',
        minBufferHours: businessData.min_buffer_hours ?? 2,
        maxBookingDays: businessData.max_booking_days ?? 30,
        ownerName: businessData.owner_name || '',
        ownerEmail: businessData.owner_email || ''
      });

      // 2. Fetch services list
      const servicesData = await fetch(`${BASE_URL}/services/`, { headers: getHeaders() }).then(handleResponse);
      const mappedServices: Service[] = servicesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
        duration: s.duration,
        description: s.description || '',
        image: s.image || '',
        isActive: s.is_active
      }));
      setServices(mappedServices);

      const masterBotUser = businessData.master_bot_username || 'bronly_master_bot';
      const businessIdStr = businessData.id;

      // 3. Fetch masters list
      const mastersData = await fetch(`${BASE_URL}/masters/`, { headers: getHeaders() }).then(handleResponse);
      const mappedMasters: Master[] = mastersData.map((m: any) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar || '',
        phone: m.phone || '',
        description: m.description || '',
        services: m.services || [],
        isActive: m.is_active,
        telegramLink: `https://t.me/${masterBotUser}?start=${businessIdStr}_${m.id}`,
        telegramId: m.telegram_id
      }));
      setMasters(mappedMasters);

      // 4. Fetch bookings list
      const bookingsData = await fetch(`${BASE_URL}/bookings/`, { headers: getHeaders() }).then(handleResponse);
      const mappedBookings: Booking[] = bookingsData.map((b: any) => {
        const matchingService = mappedServices.find(s => s.name === b.service_name);
        return {
          id: b.id,
          clientName: b.client_name,
          clientPhone: b.client_phone,
          clientTelegramId: b.client_telegram_id || undefined,
          masterId: b.master_id,
          serviceId: matchingService ? matchingService.id : 's1',
          date: b.date,
          time: b.time,
          status: b.status,
          price: b.price,
          comment: b.comment || undefined
        };
      });
      setBookings(mappedBookings);

    } catch (err) {
      console.error('Ошибка загрузки данных с бэкенда:', err);
    }
  }, [getHeaders, handleResponse]);

  useEffect(() => {
    fetchData();
    // Auto-refresh data every 15 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Action methods with API integration
  const addBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    try {
      const service = services.find(s => s.id === booking.serviceId);
      const serviceName = service ? service.name : 'Услуга';
      const serviceDuration = service ? service.duration : 30;

      const body = {
        client_name: booking.clientName,
        client_phone: booking.clientPhone,
        client_telegram_id: booking.clientTelegramId || null,
        date: booking.date,
        time: booking.time,
        service_name: serviceName,
        duration: serviceDuration,
        price: booking.price,
        comment: booking.comment || null,
        status: 'new',
        master_id: booking.masterId,
        business_id: '' // assigned by backend
      };

      await fetch(`${BASE_URL}/bookings/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse);

      fetchData();
      showToast('Запись успешно создана', 'success');
    } catch (err) {
      console.error('Ошибка при добавлении записи:', err);
      showToast('Не удалось создать запись', 'error');
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      await fetch(`${BASE_URL}/bookings/${id}/status?status_str=${status}`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse);

      fetchData();
      showToast('Статус записи обновлён', 'success');
    } catch (err) {
      console.error('Ошибка при обновлении статуса записи:', err);
      showToast('Не удалось обновить статус', 'error');
    }
  };

  const addMaster = async (master: Omit<Master, 'id' | 'isActive' | 'telegramLink'>) => {
    try {
      const body = {
        name: master.name,
        phone: master.phone,
        avatar: master.avatar,
        description: master.description || '',
        services: master.services,
        business_id: '', // assigned by backend
        is_active: true
      };

      await fetch(`${BASE_URL}/masters/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse);

      fetchData();
      showToast('Мастер успешно добавлен', 'success');
    } catch (err) {
      console.error('Ошибка при добавлении мастера:', err);
      showToast('Не удалось добавить мастера', 'error');
    }
  };

  const updateMaster = async (id: string, updatedFields: Partial<Omit<Master, 'id'>>) => {
    try {
      const body: any = {};
      if (updatedFields.name !== undefined) body.name = updatedFields.name;
      if (updatedFields.phone !== undefined) body.phone = updatedFields.phone;
      if (updatedFields.avatar !== undefined) body.avatar = updatedFields.avatar;
      if (updatedFields.description !== undefined) body.description = updatedFields.description;
      if (updatedFields.isActive !== undefined) body.is_active = updatedFields.isActive;
      if (updatedFields.services !== undefined) body.services = updatedFields.services;
      if (updatedFields.telegramId !== undefined) body.telegram_id = updatedFields.telegramId;

      await fetch(`${BASE_URL}/masters/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse);

      fetchData();
      showToast('Данные мастера обновлены', 'success');
    } catch (err) {
      console.error('Ошибка при обновлении мастера:', err);
      showToast('Не удалось обновить мастера', 'error');
    }
  };

  const toggleMasterStatus = async (id: string) => {
    const master = masters.find(m => m.id === id);
    if (master) {
      await updateMaster(id, { isActive: !master.isActive });
    }
  };

  const deleteMaster = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/masters/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse);

      fetchData();
      showToast('Мастер удалён из штата', 'success');
    } catch (err) {
      console.error('Ошибка при удалении мастера:', err);
      showToast('Не удалось удалить мастера', 'error');
    }
  };

  const addService = async (service: Omit<Service, 'id' | 'isActive'>) => {
    try {
      const body = {
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        description: service.description || '',
        image: service.image || '',
        business_id: '', // assigned by backend
        is_active: true
      };

      await fetch(`${BASE_URL}/services/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse);

      fetchData();
      showToast('Услуга успешно создана', 'success');
    } catch (err) {
      console.error('Ошибка при добавлении услуги:', err);
      showToast('Не удалось создать услугу', 'error');
    }
  };

  const updateService = async (id: string, updatedFields: Partial<Omit<Service, 'id'>>) => {
    try {
      const body: any = {};
      if (updatedFields.name !== undefined) body.name = updatedFields.name;
      if (updatedFields.category !== undefined) body.category = updatedFields.category;
      if (updatedFields.price !== undefined) body.price = updatedFields.price;
      if (updatedFields.duration !== undefined) body.duration = updatedFields.duration;
      if (updatedFields.description !== undefined) body.description = updatedFields.description;
      if (updatedFields.image !== undefined) body.image = updatedFields.image;
      if (updatedFields.isActive !== undefined) body.is_active = updatedFields.isActive;

      await fetch(`${BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      }).then(handleResponse);

      fetchData();
      showToast('Услуга обновлена', 'success');
    } catch (err) {
      console.error('Ошибка при обновлении услуги:', err);
      showToast('Не удалось обновить услугу', 'error');
    }
  };

  const deleteService = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).then(handleResponse);

      fetchData();
      showToast('Услуга удалена из прейскуранта', 'success');
    } catch (err) {
      console.error('Ошибка при удалении услуги:', err);
      showToast('Не удалось удалить услугу', 'error');
    }
  };

  const toggleServiceStatus = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (service) {
      await updateService(id, { isActive: !service.isActive });
    }
  };

  const updateMiniAppSettings = async (newSettings: Partial<MiniAppSettings>) => {
    const currentStorage = typeof window !== 'undefined' ? localStorage.getItem('mini_app_settings') : null;
    const parsed = currentStorage ? JSON.parse(currentStorage) : {};
    const updatedStorage = { ...parsed, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem('mini_app_settings', JSON.stringify(updatedStorage));
    }

    try {
      const body: any = {};
      if (newSettings.name !== undefined) body.name = newSettings.name;
      if (newSettings.logo !== undefined) body.logo = newSettings.logo;
      if (newSettings.address !== undefined) body.address = newSettings.address;
      if (newSettings.phone !== undefined) body.phone = newSettings.phone;
      if (newSettings.description !== undefined) body.description = newSettings.description;
      if (newSettings.instagram !== undefined) body.instagram = newSettings.instagram;
      if (newSettings.telegram !== undefined) body.telegram = newSettings.telegram;
      if (newSettings.coverImage !== undefined) body.cover_image = newSettings.coverImage;
      if (newSettings.primaryColor !== undefined) body.primary_color = newSettings.primaryColor;
      if (newSettings.schedule !== undefined) body.schedule = newSettings.schedule;

      if (Object.keys(body).length > 0) {
        await fetch(`${BASE_URL}/businesses/me`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(body)
        }).then(handleResponse);
      }
      
      fetchData();
    } catch (err) {
      console.error('Ошибка при обновлении настроек приложения:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    // Optimistically update local state immediately for responsiveness
    setSettings(prev => ({ ...prev, ...newSettings }));

    try {
      const body: any = {};
      if (newSettings.name !== undefined) body.name = newSettings.name;
      if (newSettings.address !== undefined) body.address = newSettings.address;
      if (newSettings.phone !== undefined) body.phone = newSettings.phone;
      if (newSettings.currency !== undefined) body.currency = newSettings.currency;
      if (newSettings.timezone !== undefined) body.timezone = newSettings.timezone;
      if (newSettings.minBufferHours !== undefined) body.min_buffer_hours = newSettings.minBufferHours;
      if (newSettings.maxBookingDays !== undefined) body.max_booking_days = newSettings.maxBookingDays;
      if (newSettings.ownerName !== undefined) body.owner_name = newSettings.ownerName;
      if (newSettings.ownerEmail !== undefined) body.owner_email = newSettings.ownerEmail;

      if (Object.keys(body).length > 0) {
        await fetch(`${BASE_URL}/businesses/me`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(body)
        }).then(handleResponse);
      }

      fetchData();
    } catch (err) {
      console.error('Ошибка при обновлении настроек бизнеса:', err);
      showToast('Не удалось сохранить настройки', 'error');
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        masters,
        services,
        bookings,
        miniAppSettings,
        settings,
        fetchData,
        addBooking,
        updateBookingStatus,
        addMaster,
        updateMaster,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
        updateMiniAppSettings,
        updateSettings,
        toggleMasterStatus,
        deleteMaster
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
