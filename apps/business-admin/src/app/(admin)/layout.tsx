'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useBusiness } from '../../hooks/useBusiness';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const { fetchData } = useBusiness();

  useEffect(() => {
    // Basic client-side check for demonstration/MVP purposes
    const isLoggedIn = localStorage.getItem('business_admin_logged_in');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setAuthorized(true);
      fetchData();
    }
  }, [router, fetchData]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!authorized) {
    // Render a minimal loading screen while checking authentication status
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
          <span className="text-[12px] font-bold text-slate-455 uppercase tracking-widest font-evolventa">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen h-[100dvh] overflow-hidden relative">
      {/* Sidebar Left */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Scrollable Main Area Right */}
      <div className="flex-1 flex flex-col pl-0 xl:pl-[240px] h-full overflow-hidden">
        {/* Top Sticky Header */}
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Workspace Content */}
        <main className="flex-1 px-4 xl:px-6 pt-4 xl:pt-6 pb-4 xl:pb-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
