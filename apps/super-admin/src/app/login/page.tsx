'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('super_admin_logged_in');
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    // Delay login slightly for premium spinner feel
    setTimeout(() => {
      if (email.trim() === 'notferuz@gmail.com' && password.trim() === '1235804679f') {
        localStorage.setItem('super_admin_logged_in', 'true');
        router.push('/dashboard');
      } else {
        setError('Неверный логин или пароль администратора');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4 font-sans select-none antialiased relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#ff5a1f]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[380px] bg-slate-800/80 border border-slate-700/50 backdrop-blur-xl rounded-[32px] p-8 flex flex-col gap-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <img src="/b-orange.svg" alt="Bronly Logo" className="w-12 h-12 object-contain mb-1" />
          <span className="font-black text-2xl text-white tracking-tight font-evolventa lowercase">
            bronly<span className="text-[#ff5a1f]">.</span>hq
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-evolventa">
            панель суперадминистратора
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-[11px] text-rose-400 font-bold leading-normal font-evolventa">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-evolventa px-1">
              Логин (Email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bronly.uz"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
              required
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-evolventa px-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 py-3.5 rounded-2xl bg-[#ff5a1f] hover:bg-orange-600 disabled:bg-slate-700 text-white font-extrabold text-[12px] font-evolventa uppercase tracking-wider transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ff5a1f]/15"
          >
            {isLoading ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Войти в панель'
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright */}
      <span className="mt-6 text-[9px] text-slate-500 font-bold uppercase tracking-wider font-evolventa">
        Bronly HQ © 2026
      </span>
    </div>
  );
}
