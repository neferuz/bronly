'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const businessId = searchParams.get('b');

  const [booking, setBooking] = useState<any | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingId) {
      setError('Не указан идентификатор записи.');
      setIsLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/v1/public/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Запись не найдена в системе.');
        const data = await res.json();
        setBooking(data);
        
        // Dynamically apply primary color branding if available
        if (data.business_id) {
          const resBus = await fetch(`${API_HOST}/api/v1/public/businesses/${data.business_id}`);
          if (resBus.ok) {
            const dataBus = await resBus.json();
            const primaryColor = dataBus.primary_color || '#ff5a1f';
            document.documentElement.style.setProperty('--primary', primaryColor);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки данных записи.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_HOST}/api/v1/public/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Не удалось отправить отзыв. Пожалуйста, попробуйте позже.');
      }

      setSuccess(true);
      
      // Auto close Telegram Web App after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.close();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке отзыва.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.close();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Загрузка данных...</span>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-500 text-2xl font-black border border-rose-100/60">
          ⚠️
        </div>
        <h3 className="font-bold text-slate-800 mb-2">Произошла ошибка</h3>
        <p className="text-sm text-slate-450 max-w-[280px] leading-relaxed mb-6">{error}</p>
        <button
          onClick={handleClose}
          className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider smooth-transition"
        >
          Закрыть
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 text-emerald-500 text-3xl border border-emerald-100/60">
          ✓
        </div>
        <h2 className="font-black text-2xl text-slate-800 mb-3 tracking-tight font-evolventa">
          Спасибо за ваш отзыв!
        </h2>
        <p className="text-sm text-slate-450 max-w-[280px] leading-relaxed mb-6 font-semibold">
          Ваше мнение помогает нам улучшать качество услуг и развивать платформу.
        </p>
        <button
          onClick={handleClose}
          className="px-6 py-3.5 rounded-2xl bg-[#ff5a1f] hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider smooth-transition"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 font-sans select-none antialiased">
      {/* Header Container */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-[32px] p-6 flex flex-col gap-6 mt-2">
        {/* Visit Details Card */}
        <div className="flex flex-col gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ff5a1f]/10 flex items-center justify-center font-bold text-[#ff5a1f] text-sm font-evolventa">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-evolventa">ваш визит</span>
              <span className="text-sm font-extrabold text-slate-800 font-evolventa">
                {booking?.service_name || 'Услуга'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Мастер</span>
              <span className="text-slate-700 font-bold">{booking?.master_name || 'Специалист'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Дата и время</span>
              <span className="text-slate-700 font-bold">{booking?.date} в {booking?.time}</span>
            </div>
          </div>
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-500 font-bold leading-normal font-evolventa animate-shake">
              {error}
            </div>
          )}

          {/* Star selector */}
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-evolventa">
              Оцените качество обслуживания
            </span>
            <div className="flex items-center gap-2.5 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none cursor-pointer smooth-transition transform active:scale-90"
                >
                  <svg
                    className={`w-9 h-9 ${
                      star <= rating ? 'text-[#ff5a1f] fill-[#ff5a1f]' : 'text-slate-200 fill-transparent stroke-slate-300 stroke-2'
                    } transition-colors duration-150`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-sm font-extrabold text-slate-800 font-evolventa">
              {
                {
                  1: 'Очень плохо 😡',
                  2: 'Плохо 😞',
                  3: 'Нормально 😐',
                  4: 'Хорошо 🙂',
                  5: 'Отлично! 😍'
                }[rating]
              }
            </span>
          </div>

          {/* Comment input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-evolventa px-1">
              Ваш комментарий (необязательно)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите, что вам понравилось или как мы можем улучшить наш сервис..."
              className="w-full min-h-[100px] max-h-[160px] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
              maxLength={500}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-[#ff5a1f] hover:bg-orange-600 text-white font-extrabold text-[13px] font-evolventa uppercase tracking-wider smooth-transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              'Отправить отзыв'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-evolventa">Загрузка...</span>
        </div>
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
