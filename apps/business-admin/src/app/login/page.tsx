'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect straight to dashboard, otherwise check if blocked error parameter exists
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('business_admin_logged_in');
    if (isLoggedIn) {
      router.push('/dashboard');
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'blocked') {
        setError('Ваш салон заблокирован администратором. Доступ ограничен.');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiHost}/api/v1/auth/login/access-token`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.detail === 'Inactive business' || errData.detail === 'Inactive business account') {
          throw new Error('Ваш салон заблокирован администратором. Доступ ограничен.');
        }
        throw new Error(errData.detail || 'Неверный адрес электронной почты или пароль');
      }

      const data = await response.json();
      localStorage.setItem('business_admin_logged_in', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 font-sans select-none antialiased">
      {/* Login Card */}
      <div className="w-full max-w-[360px] bg-white border border-slate-200/80 rounded-[28px] p-8 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-1.5 text-center mt-2">
          <img src="/b-orange.svg" alt="Bronly Logo" className="w-12 h-12 object-contain mb-1" />
          <span className="font-black text-3xl text-slate-800 tracking-tight font-evolventa lowercase">
            bronly<span className="text-[#ff5a1f]">.</span>
          </span>
          <span className="text-[11px] font-bold text-slate-450 uppercase tracking-widest font-evolventa">
            crm для бизнеса
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-500 font-bold leading-normal font-evolventa animate-shake">
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa px-1">
              Электронная почта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
              required
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa px-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-[#ff5a1f] text-white font-extrabold text-[13px] font-evolventa uppercase tracking-wider hover:bg-orange-600 transition-colors active:scale-98 transition-transform flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Войти в систему'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
