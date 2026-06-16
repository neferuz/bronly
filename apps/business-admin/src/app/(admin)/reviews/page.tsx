'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useBusiness } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';

interface Review {
  id: string;
  booking_id: string;
  master_id: string;
  business_id: string;
  rating: number;
  comment?: string | null;
  reply_comment?: string | null;
  created_at: string;
}

export default function ReviewsPage() {
  const { masters, bookings, services } = useBusiness();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter states
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer states (replacing center modal)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [modalReplyInputText, setModalReplyInputText] = useState<string>('');

  const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const BASE_URL = `${API_HOST}/api/v1`;

  // Helper check for valid avatar URLs
  const isValidImageUrl = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:');
  };

  const getInitials = (name: string) => {
    if (!name) return 'М';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  // Fetch reviews from API
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('business_admin_logged_in') : null;
      const response = await fetch(`${BASE_URL}/businesses/me/reviews`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось загрузить отзывы');
      }

      const data = await response.json();
      setReviews(data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Ошибка при загрузке отзывов', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rating = r.rating as 5 | 4 | 3 | 2 | 1;
      if (distribution[rating] !== undefined) {
        distribution[rating] += 1;
      }
    });

    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      total: reviews.length,
      distribution
    };
  }, [reviews]);

  // Compute recommendation rate
  const statsMetrics = useMemo(() => {
    if (reviews.length === 0) return { positivePercent: 0 };
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    return {
      positivePercent: Math.round((positiveReviews / reviews.length) * 100)
    };
  }, [reviews]);

  // Best Master computation
  const bestMaster = useMemo(() => {
    if (reviews.length === 0) return null;
    const masterStats: Record<string, { sum: number; count: number }> = {};
    reviews.forEach((r) => {
      if (!masterStats[r.master_id]) {
        masterStats[r.master_id] = { sum: 0, count: 0 };
      }
      masterStats[r.master_id].sum += r.rating;
      masterStats[r.master_id].count += 1;
    });

    let bestId: string | null = null;
    let bestAvg = 0;
    let bestCount = 0;

    Object.entries(masterStats).forEach(([id, data]) => {
      const avg = data.sum / data.count;
      if (avg > bestAvg || (avg === bestAvg && data.count > bestCount)) {
        bestAvg = avg;
        bestCount = data.count;
        bestId = id;
      }
    });

    if (!bestId) return null;
    const masterObj = masters.find((m) => m.id === bestId);
    return {
      id: bestId,
      name: masterObj ? masterObj.name : 'Мастер',
      avatar: masterObj ? masterObj.avatar : '',
      average: Math.round(bestAvg * 10) / 10,
      count: bestCount
    };
  }, [reviews, masters]);

  // Helpers for display
  const getMasterInfo = (masterId: string) => {
    const master = masters.find((m) => m.id === masterId);
    return master ? { name: master.name, avatar: master.avatar } : { name: 'Удаленный мастер', avatar: '' };
  };

  const getBookingInfo = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      return {
        clientName: 'Клиент Bronly',
        clientPhone: '',
        clientInitials: 'К',
        serviceName: null
      };
    }
    const clientName = booking.clientName || 'Клиент',
      clientPhone = booking.clientPhone || '';
    
    // Get service name
    const service = services.find((s) => s.id === booking.serviceId);
    const serviceName = service ? service.name : 'Услуга';

    // Initials
    const parts = clientName.trim().split(/\s+/);
    const clientInitials = parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : parts[0][0].toUpperCase();

    return {
      clientName,
      clientPhone,
      clientInitials,
      serviceName
    };
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Reply handlers linking to FastAPI backend
  const handleSaveReply = async (reviewId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('business_admin_logged_in') : null;
      const response = await fetch(`${BASE_URL}/businesses/me/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reply_text: text })
      });

      if (!response.ok) {
        throw new Error('Не удалось отправить ответ');
      }

      const updatedReview = await response.json();
      
      // Update reviews list in state
      setReviews(prev => prev.map(r => r.id === reviewId ? updatedReview : r));
      
      // Sync with modal if active
      if (selectedReview?.id === reviewId) {
        setSelectedReview(updatedReview);
      }
      
      showToast('Ответ сохранен в CRM и отправлен клиенту в Telegram!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Ошибка отправки ответа', 'error');
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('business_admin_logged_in') : null;
      const response = await fetch(`${BASE_URL}/businesses/me/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error('Не удалось удалить ответ');
      }

      const updatedReview = await response.json();
      
      // Update reviews list in state
      setReviews(prev => prev.map(r => r.id === reviewId ? updatedReview : r));
      
      // Sync with modal if active
      if (selectedReview?.id === reviewId) {
        setSelectedReview(updatedReview);
      }
      
      showToast('Ответ удален из базы данных', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Ошибка удаления ответа', 'error');
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedRating(null);
    setSelectedMasterId(null);
    setSearchQuery('');
  };

  // Drawer toggle handlers
  const openReviewDetails = (review: Review) => {
    setSelectedReview(review);
    setTimeout(() => {
      setIsDrawerOpen(true);
    }, 50);
  };

  const closeReviewDetails = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedReview(null);
      setModalReplyInputText('');
    }, 300);
  };

  // Filter logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // 1. Rating filter
      if (selectedRating !== null && review.rating !== selectedRating) {
        return false;
      }

      // 2. Master filter
      if (selectedMasterId !== null && review.master_id !== selectedMasterId) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const commentMatch = review.comment?.toLowerCase().includes(query) || false;
        
        // Lookup client name/phone
        const booking = bookings.find((b) => b.id === review.booking_id);
        const nameMatch = booking?.clientName?.toLowerCase().includes(query) || false;
        const phoneMatch = booking?.clientPhone?.includes(query) || false;
        
        if (!commentMatch && !nameMatch && !phoneMatch) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, selectedRating, selectedMasterId, searchQuery, bookings]);

  const hasActiveFilters = selectedRating !== null || selectedMasterId !== null || searchQuery.trim() !== '';

  // Drawer computed variables
  const modalClient = useMemo(() => {
    if (!selectedReview) return { clientName: '', clientPhone: '', clientInitials: '', serviceName: '' };
    return getBookingInfo(selectedReview.booking_id);
  }, [selectedReview, bookings]);

  const modalMaster = useMemo(() => {
    if (!selectedReview) return { name: '', avatar: '' };
    return getMasterInfo(selectedReview.master_id);
  }, [selectedReview, masters]);

  const modalBookingPrice = useMemo(() => {
    if (!selectedReview) return null;
    return bookings.find(b => b.id === selectedReview.booking_id)?.price || null;
  }, [selectedReview, bookings]);

  return (
    <div className="space-y-8 w-full font-sans select-none pb-4 xl:pb-12 animate-in fade-in duration-300">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight font-evolventa">
          Отзывы клиентов
        </h2>
        <p className="text-xs text-slate-450 font-semibold uppercase tracking-wider font-evolventa">
          Аналитика качества услуг и обратная связь
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
            <span className="text-xs font-bold text-slate-455 uppercase tracking-widest font-evolventa">Загрузка отзывов...</span>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100/50">
            <svg className="w-8 h-8 text-[#ff5a1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.9 1.603-.9 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.357 1.23.588 1.81l-3.97 2.885a1 1 0 00-.364 1.118l1.518 4.674c.3.9-.755 1.688-1.538 1.118l-3.971-2.885a1 1 0 00-1.175 0l-3.97 2.885c-.782.57-1.838-.218-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.1c-.77-.58-.375-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 text-lg font-evolventa">Отзывов пока нет</h3>
          <p className="text-xs text-slate-400 font-evolventa max-w-[320px] leading-relaxed">
            Отзывы клиентов будут автоматически собираться и отображаться здесь по мере завершения сеансов.
          </p>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards Row (Matching dashboard style, looking "expensive") */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Average score card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-350 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Средняя оценка</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/60">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-slate-850 tracking-tight font-evolventa flex items-baseline gap-1">
                  {stats.average} <span className="text-xs font-bold text-slate-400">/ 5</span>
                </h3>
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(stats.average) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Total reviews count card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-350 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Всего отзывов</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-slate-850 tracking-tight font-evolventa">
                  {stats.total}
                </h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1.5 font-evolventa">
                  За всё время работы
                </span>
              </div>
            </div>

            {/* Recommendation rate card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-350 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Доля довольных</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-emerald-600 tracking-tight font-evolventa">
                  {statsMetrics.positivePercent}%
                </h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1.5 font-evolventa">
                  Оценки 4 и 5 звезд
                </span>
              </div>
            </div>

            {/* Best Master Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-350 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Любимец клиентов</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                {bestMaster ? (
                  <div className="flex items-center gap-2.5">
                    {isValidImageUrl(bestMaster.avatar) ? (
                      <img 
                        src={bestMaster.avatar} 
                        alt={bestMaster.name} 
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200/50 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#ff5a1f] flex items-center justify-center font-black text-[10px] border border-orange-100 font-evolventa shrink-0">
                        {getInitials(bestMaster.name)}
                      </div>
                    )}
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-black text-slate-750 font-evolventa truncate leading-tight block">
                        {bestMaster.name}
                      </span>
                      <span className="text-[8px] text-[#ff5a1f] font-black block mt-0.5 font-evolventa flex items-center gap-0.5">
                        <svg className="w-2.5 h-2.5 fill-current text-amber-400 inline shrink-0" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {bestMaster.average} ({bestMaster.count} отз.)
                      </span>
                    </div>
                  </div>
                ) : (
                  <h3 className="text-xl md:text-2xl font-black text-slate-400 font-evolventa">—</h3>
                )}
              </div>
            </div>
          </div>

          {/* Main Grid Section: Sticky Filter Sidebar & Scrollable Reviews Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* Left Column: Sticky Filter and Star Distribution (4 columns width) */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-0 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto pr-1 scrollbar-none">
              {/* Star Distribution Breakdown */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 smooth-transition hover:border-slate-300 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-800 font-evolventa tracking-tight">Распределение оценок</h4>
                  {selectedRating !== null && (
                    <button
                      onClick={() => setSelectedRating(null)}
                      className="text-[10px] font-bold text-[#ff5a1f] hover:underline font-evolventa cursor-pointer"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {([5, 4, 3, 2, 1] as const).map((stars) => {
                    const count = stats.distribution[stars];
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    const isCurrentFilter = selectedRating === stars;
                    
                    return (
                      <div 
                        key={stars} 
                        onClick={() => setSelectedRating(isCurrentFilter ? null : stars)}
                        className={`flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl cursor-pointer smooth-transition ${
                          isCurrentFilter 
                            ? 'bg-orange-50/70 border border-orange-100/50' 
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                        title={`Фильтровать по оценке ${stars} звезд`}
                      >
                        <span className={`text-xs font-bold font-evolventa min-w-[28px] flex items-center gap-0.5 ${isCurrentFilter ? 'text-[#ff5a1f]' : 'text-slate-655'}`}>
                          {stars}
                          <svg className={`w-3 h-3 ${isCurrentFilter ? 'text-[#ff5a1f] fill-[#ff5a1f]' : 'text-amber-400 fill-amber-400'} shrink-0`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full smooth-transition ${
                              isCurrentFilter ? 'bg-[#ff5a1f]' : 'bg-amber-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-400 font-evolventa min-w-[24px] text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <span className="text-[9px] text-slate-400 font-semibold font-evolventa text-center leading-normal">
                  Нажмите на строку распределения оценок, чтобы применить быстрый фильтр по звездам.
                </span>
              </div>

              {/* Search & Master Filters Block */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa px-1">
                    Поиск по отзыву:
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Имя, телефон или текст..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa px-1">
                    Фильтр по мастерам:
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedMasterId(null)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-evolventa smooth-transition border cursor-pointer ${
                        selectedMasterId === null
                          ? 'bg-[#ff5a1f] text-white border-transparent'
                          : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Все ({reviews.length})
                    </button>

                    {masters.map((master) => {
                      const reviewsCount = reviews.filter((r) => r.master_id === master.id).length;
                      if (reviewsCount === 0) return null;

                      const isActive = selectedMasterId === master.id;
                      return (
                        <button
                          key={master.id}
                          onClick={() => setSelectedMasterId(isActive ? null : master.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold font-evolventa border smooth-transition cursor-pointer ${
                            isActive
                              ? 'bg-orange-50 text-[#ff5a1f] border-orange-100/60'
                              : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-55'
                          }`}
                        >
                          <span>{master.name}</span>
                          <span className="text-[8px] bg-slate-100 text-slate-400 rounded px-1.5 ml-0.5 font-bold">
                            {reviewsCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="w-full py-2.5 mt-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] font-evolventa uppercase tracking-wider transition-all cursor-pointer border border-rose-100"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Scrollable Reviews List Feed (8 columns width) */}
            <div className="flex flex-col gap-4 lg:col-span-8 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto pr-2 scrollbar-none">
              {filteredReviews.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="font-bold text-slate-800 font-evolventa text-[15px]">Ничего не найдено</h3>
                  <p className="text-xs text-slate-400 font-evolventa max-w-[280px]">
                    Попробуйте изменить поисковый запрос или сбросить фильтры.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-2 text-xs font-extrabold text-[#ff5a1f] bg-orange-50 hover:bg-orange-100/60 px-4 py-2 rounded-xl transition-all"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => {
                    const master = getMasterInfo(review.master_id);
                    const client = getBookingInfo(review.booking_id);
                    const hasReply = !!review.reply_comment;

                    return (
                      <div
                        key={review.id}
                        onClick={() => openReviewDetails(review)}
                        className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-200 hover:border-[#ff5a1f]/60 relative group select-none cursor-pointer active:scale-[0.99]"
                      >
                        {/* Client details + stars + date */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm border font-evolventa shrink-0 ${
                              review.rating >= 4 
                                ? 'bg-orange-50 text-[#ff5a1f] border-orange-100/60' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {client.clientInitials}
                            </div>
                            
                            <div className="flex flex-col text-left min-w-0">
                              <span className="font-extrabold text-slate-800 text-sm truncate font-evolventa leading-tight">
                                {client.clientName}
                              </span>
                              {client.clientPhone && (
                                <span className="text-[10px] text-slate-400 font-bold font-evolventa mt-0.5">
                                  {client.clientPhone.slice(0, 4)} (••) •••-••-{client.clientPhone.slice(-2)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end text-right shrink-0">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold mt-1 font-evolventa">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Review text */}
                        <div className="relative">
                          {review.comment ? (
                            <div className="pl-4 border-l-4 border-[#ff5a1f] italic text-slate-700 text-xs md:text-[13px] leading-relaxed font-evolventa py-1 bg-[#ff5a1f]/5 rounded-r-2xl pr-4">
                              "{review.comment}"
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[11px] italic font-evolventa bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100 select-none">
                              Оценка без текстового комментария
                            </div>
                          )}
                        </div>

                        {/* Service / Master footer badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100/60 pt-4">
                          <div className="flex flex-wrap items-center gap-3">
                            {client.serviceName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold bg-slate-100 text-slate-655 border border-slate-200/20 font-evolventa">
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{client.serviceName}</span>
                              </span>
                            )}
                            
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-2xl px-3 py-1">
                              {isValidImageUrl(master.avatar) ? (
                                <img 
                                  src={master.avatar} 
                                  alt={master.name} 
                                  className="w-5 h-5 rounded-md object-cover border border-slate-200/50"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-orange-50 text-[#ff5a1f] flex items-center justify-center font-bold text-[9px] border border-orange-100 font-evolventa">
                                  {getInitials(master.name)}
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-slate-650 font-evolventa">
                                Мастер: <span className="text-slate-800">{master.name}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-black uppercase font-evolventa tracking-wider">
                            {hasReply ? (
                              <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Ответ отправлен
                              </span>
                            ) : (
                              <span className="text-[#ff5a1f] bg-orange-50 group-hover:bg-[#ff5a1f] group-hover:text-white px-3 py-1.5 rounded-xl border border-orange-100/40 transition-colors flex items-center gap-1 select-none">
                                Ответить
                                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Review Details RIGHT SIDE DRAWER (Matching clients details sidebar, "comes out from the right") */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={closeReviewDetails}
            className={`fixed inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
              isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
          
          {/* Drawer Panel */}
          <div 
            className={`relative w-full max-w-[480px] h-full bg-white border-l border-slate-200/80 flex flex-col transition-transform duration-300 ease-out z-50 ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border font-evolventa shrink-0 ${
                  selectedReview.rating >= 4 
                    ? 'bg-orange-50 text-[#ff5a1f] border-orange-100/60' 
                    : 'bg-slate-100 text-slate-655 border-slate-200'
                }`}>
                  {modalClient.clientInitials}
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base font-evolventa leading-tight">
                    {modalClient.clientName}
                  </h3>
                  {modalClient.clientPhone && (
                    <span className="text-[10px] text-slate-400 font-bold font-evolventa mt-0.5">
                      {modalClient.clientPhone}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={closeReviewDetails}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center smooth-transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body - scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Visit details */}
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-evolventa mb-2">
                  Детали визита в салон
                </span>
                
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100/50 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-evolventa leading-none">Мастер</span>
                    <div className="flex items-center gap-2 mt-2 min-w-0">
                      {isValidImageUrl(modalMaster.avatar) ? (
                        <img 
                          src={modalMaster.avatar} 
                          alt={modalMaster.name} 
                          className="w-5 h-5 rounded-md object-cover border border-slate-200/50 shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-orange-50 text-[#ff5a1f] flex items-center justify-center font-black text-[9px] border border-orange-100 font-evolventa shrink-0">
                          {getInitials(modalMaster.name)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-slate-700 font-evolventa truncate">{modalMaster.name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-evolventa leading-none">Услуга</span>
                    <div className="flex items-center gap-1.5 mt-2 min-w-0">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7h7m-7 0a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-750 font-evolventa truncate" title={modalClient.serviceName || 'Мужская стрижка'}>
                        {modalClient.serviceName || 'Мужская стрижка'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-evolventa leading-none">Когда приходил</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-700 font-evolventa">
                        {formatDate(selectedReview.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider font-evolventa leading-none">Стоимость</span>
                    <span className="text-xs font-black text-[#ff5a1f] font-evolventa block mt-2.5">
                      {modalBookingPrice ? `${modalBookingPrice.toLocaleString('ru-RU')} сум` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client Profile Page Link */}
              {modalClient.clientPhone && (
                <Link
                  href={`/clients/${encodeURIComponent(modalClient.clientPhone)}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-[#ff5a1f] text-slate-700 hover:text-white border border-slate-200/50 hover:border-transparent font-extrabold text-xs font-evolventa uppercase tracking-wider transition-all duration-200 cursor-pointer text-center select-none"
                  onClick={closeReviewDetails}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Профиль и история визитов</span>
                </Link>
              )}

              <div className="h-[1px] bg-slate-100" />

              {/* Review Comment Details */}
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-evolventa mb-2">
                  Отзыв клиента
                </span>
                
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= selectedReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.9 1.603-.9 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.9-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.218-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#ff5a1f] font-evolventa ml-1">
                    {
                      {
                        5: 'Отлично',
                        4: 'Хорошо',
                        3: 'Нормально',
                        2: 'Плохо',
                        1: 'Ужасно'
                      }[selectedReview.rating as 5|4|3|2|1]
                    }
                  </span>
                </div>

                <div className="pl-4 border-l-4 border-[#ff5a1f] italic text-slate-700 text-xs md:text-[13px] leading-relaxed font-evolventa py-2.5 bg-[#ff5a1f]/5 rounded-r-2xl pr-4">
                  {selectedReview.comment ? `"${selectedReview.comment}"` : "Без текстового комментария, только оценка."}
                </div>
              </div>

              <div className="h-[1px] bg-slate-100" />

              {/* Bot Reply Comment section */}
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-evolventa mb-2">
                  Ответ заведения
                </span>
                
                {selectedReview.reply_comment ? (
                  <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#ff5a1f] text-white flex items-center justify-center text-[9px] font-black font-evolventa">
                          B
                        </div>
                        <span className="text-[10px] font-bold text-[#ff5a1f] uppercase tracking-wider font-evolventa">
                          Ответ опубликован в Telegram-боте
                        </span>
                      </div>
                      
                      <button
                        onClick={async () => {
                          await handleDeleteReply(selectedReview.id);
                        }}
                        className="text-slate-405 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title="Удалить ответ"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-slate-700 text-xs md:text-[13px] leading-relaxed font-evolventa pl-7 pr-2">
                      {selectedReview.reply_comment}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={modalReplyInputText}
                      onChange={(e) => setModalReplyInputText(e.target.value)}
                      placeholder="Напишите вежливый ответ клиенту..."
                      className="w-full min-h-[90px] max-h-[160px] px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs md:text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]/20 transition-all font-semibold font-evolventa"
                    />
                    
                    <div className="flex gap-2 items-start bg-slate-50 rounded-xl p-3 border border-slate-200/50">
                      <svg className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[9px] text-slate-500 font-medium font-evolventa leading-normal">
                        Ответ будет сохранен в базе данных и автоматически отправлен клиенту в Telegram от имени вашего бота.
                      </span>
                    </div>
                    
                    <button
                      onClick={async () => {
                        if (!modalReplyInputText.trim()) return;
                        await handleSaveReply(selectedReview.id, modalReplyInputText);
                        setModalReplyInputText('');
                      }}
                      disabled={!modalReplyInputText.trim()}
                      className="py-3.5 px-4 rounded-2xl bg-[#ff5a1f] hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs font-evolventa uppercase tracking-wider transition-all cursor-pointer text-center select-none"
                    >
                      Отправить ответ в Telegram
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
