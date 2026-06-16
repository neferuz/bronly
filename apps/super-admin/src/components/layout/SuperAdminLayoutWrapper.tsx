'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function SuperAdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('super_admin_logged_in');
    
    if (pathname === '/login') {
      if (isLoggedIn) {
        router.push('/dashboard');
      }
      return;
    }

    if (!isLoggedIn) {
      setAuthorized(false);
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
          <span className="text-[12px] font-bold text-slate-450 uppercase tracking-widest font-evolventa">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen relative">
      {/* Sidebar Left */}
      <Sidebar />

      {/* Scrollable Main Area Right */}
      <div className="flex-1 flex flex-col pl-[240px]">
        {/* Top Sticky Header */}
        <Header />

        {/* Dynamic Page Workspace Content */}
        <main className="flex-1 px-6 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
