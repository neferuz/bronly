export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'master' | 'business-admin' | 'super-admin';
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  address?: string;
  ownerId: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  masterId: string;
  businessId: string;
  dateTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
  currency: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
