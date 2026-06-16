'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '../components/ui/Toast';

export interface BusinessBranch {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerTelegram?: string;
  city: string;
  registeredAt: string; // YYYY-MM-DD
  mastersCount: number;
  bookingsCount: number;
  clientsCount: number;
  servicesCount: number;
  revenue: number;
  status: 'active' | 'blocked';
  plainPassword?: string;
  clientBotUsername?: string;
  clientBotToken?: string;
  masterBotUsername?: string;
  masterBotToken?: string;
}

export interface PlatformStats {
  totalRevenue: number;
  totalBusinesses: number;
  activeBusinesses: number;
  totalMiniAppClicks: number;
  totalBookings: number;
}

export interface BusinessRegisterInput {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  city: string;
  ownerTelegram?: string;
}

interface SuperAdminContextType {
  businesses: BusinessBranch[];
  stats: PlatformStats;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  addBusiness: (business: BusinessRegisterInput) => Promise<void>;
  toggleBusinessStatus: (id: string) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
  updateBusinessCredentials: (
    id: string, 
    email?: string, 
    password?: string,
    clientBotUsername?: string,
    clientBotToken?: string,
    masterBotUsername?: string,
    masterBotToken?: string
  ) => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${apiHost}/api/v1/super-admin`;
const ADMIN_HEADERS = { 'X-Admin-Key': process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || 'bronly-hq-secret-2026' };


export const SuperAdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessBranch[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalRevenue: 0,
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalMiniAppClicks: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE_URL}/stats`, { headers: ADMIN_HEADERS });
      if (!statsRes.ok) throw new Error('Failed to fetch platform stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Businesses
      const bizRes = await fetch(`${API_BASE_URL}/businesses`, { headers: ADMIN_HEADERS });
      if (!bizRes.ok) throw new Error('Failed to fetch businesses');
      const bizData = await bizRes.json();
      
      const mappedBusinesses: BusinessBranch[] = bizData.map((b: any) => ({
        id: b.id,
        name: b.name,
        ownerName: b.owner_name,
        ownerEmail: b.owner_email,
        ownerPhone: b.owner_phone || '',
        ownerTelegram: b.owner_telegram || '',
        city: b.city,
        registeredAt: b.registered_at,
        mastersCount: b.masters_count,
        bookingsCount: b.bookings_count,
        clientsCount: b.clients_count,
        servicesCount: b.services_count,
        revenue: b.revenue,
        status: b.status,
        plainPassword: b.plain_password,
        clientBotUsername: b.client_bot_username || '',
        clientBotToken: b.client_bot_token || '',
        masterBotUsername: b.master_bot_username || '',
        masterBotToken: b.master_bot_token || '',
      }));

      setBusinesses(mappedBusinesses);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addBusiness = async (input: BusinessRegisterInput) => {
    try {
      const res = await fetch(`${API_BASE_URL}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({
          name: input.name,
          owner_name: input.ownerName,
          owner_email: input.ownerEmail,
          owner_phone: input.ownerPhone,
          password: input.password,
          city: input.city,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to register business');
      }

      showToast('Бизнес успешно зарегистрирован', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Не удалось зарегистрировать бизнес', 'error');
      throw err;
    }
  };

  const toggleBusinessStatus = async (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (!biz) return;

    const newIsActive = biz.status !== 'active';

    try {
      const res = await fetch(`${API_BASE_URL}/businesses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({ is_active: newIsActive }),
      });

      if (!res.ok) throw new Error('Failed to update business status');
      showToast('Статус бизнеса успешно обновлен', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Не удалось изменить статус бизнеса', 'error');
    }
  };

  const updateBusinessCredentials = async (
    id: string, 
    email?: string, 
    password?: string,
    clientBotUsername?: string,
    clientBotToken?: string,
    masterBotUsername?: string,
    masterBotToken?: string
  ) => {
    try {
      const body: any = {};
      if (email) body.owner_email = email;
      if (password) body.password = password;
      if (clientBotUsername !== undefined) body.client_bot_username = clientBotUsername;
      if (clientBotToken !== undefined) body.client_bot_token = clientBotToken;
      if (masterBotUsername !== undefined) body.master_bot_username = masterBotUsername;
      if (masterBotToken !== undefined) body.master_bot_token = masterBotToken;

      const res = await fetch(`${API_BASE_URL}/businesses/${id}/credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update credentials');
      }
      
      showToast('Данные доступа успешно сохранены', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Не удалось обновить доступы', 'error');
      throw err;
    }
  };

  const deleteBusiness = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/businesses/${id}`, {
        method: 'DELETE',
        headers: ADMIN_HEADERS,
      });

      if (!res.ok) throw new Error('Failed to delete business');
      showToast('Бизнес и все связанные данные успешно удалены', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Не удалось удалить бизнес', 'error');
      throw err;
    }
  };

  return (
    <SuperAdminContext.Provider
      value={{
        businesses,
        stats,
        loading,
        error,
        fetchData,
        addBusiness,
        toggleBusinessStatus,
        deleteBusiness,
        updateBusinessCredentials,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
};

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};
