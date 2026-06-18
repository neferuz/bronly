'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBusiness } from '../../../hooks/useBusiness';
import { useToast } from '../../../components/ui/Toast';

export default function Newsletter() {
  const { showToast } = useToast();
  const [audience, setAudience] = useState<'all' | 'frequent' | 'inactive'>('all');
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [audienceStats, setAudienceStats] = useState({ total: 0, frequent: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('business_admin_logged_in');
      const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const [resHistory, resStats] = await Promise.all([
        fetch(`${API_HOST}/api/v1/businesses/me/broadcasts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_HOST}/api/v1/businesses/me/audience-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (resHistory.ok) {
        const data = await resHistory.json();
        setHistory(data);
      }
      if (resStats.ok) {
        const statsData = await resStats.json();
        setAudienceStats(statsData);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const insertFormatting = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageText;
    
    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);
    
    const newText = `${beforeText}<${tag}>${selectedText}</${tag}>${afterText}`;
    setMessageText(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, end + tag.length + 2);
    }, 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Файл слишком большой. Максимум 10 МБ.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!messageText.trim() && !imageUrl) {
      showToast('Пожалуйста, добавьте текст или фото для рассылки.', 'error');
      return;
    }

    let targetCount = 0;
    if (audience === 'all') targetCount = audienceStats.total;
    else if (audience === 'frequent') targetCount = audienceStats.frequent;
    else if (audience === 'inactive') targetCount = audienceStats.inactive;

    if (targetCount === 0) {
      showToast('В выбранной категории нет клиентов для отправки.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('business_admin_logged_in');
      const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const res = await fetch(`${API_HOST}/api/v1/businesses/me/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          audience,
          message_text: messageText,
          image_url: imageUrl || null
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Ошибка сети');
      }

      const data = await res.json();
      showToast(`Рассылка успешно запущена! Доставлено: ${data.sent_count}`, 'success');
      setMessageText('');
      setImageUrl('');
      fetchData();
    } catch (e: any) {
      showToast(e.message || 'Произошла ошибка при отправке рассылки.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 w-full font-sans select-none pb-4 xl:pb-12 animate-in fade-in duration-300">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight font-evolventa">
          Рассылка
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-evolventa">
          Массовая отправка сообщений клиентам
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-evolventa">Загрузка...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards Row (Matching dashboard style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
             {/* Total Clients Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Всего клиентов</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-evolventa">
                  {audienceStats.total} <span className="text-xs font-bold text-slate-400 font-sans">чел.</span>
                </h3>
              </div>
            </div>

            {/* Frequent Clients Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Постоянные (3+ визитов)</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#ff5a1f] flex items-center justify-center border border-orange-100/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-[#ff5a1f] tracking-tight font-evolventa">
                  {audienceStats.frequent} <span className="text-xs font-bold text-[#ff5a1f]/60 font-sans">чел.</span>
                </h3>
              </div>
            </div>

            {/* Inactive Clients Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 smooth-transition hover:border-slate-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Спящие (&gt;30 дней)</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200/60">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-black text-slate-600 tracking-tight font-evolventa">
                  {audienceStats.inactive} <span className="text-xs font-bold text-slate-400 font-sans">чел.</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Main Grid Section: Sticky Form Sidebar & Scrollable Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative mt-8">
            
            {/* Left Column: Sticky Form (4 columns width) */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-1 scrollbar-none">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 flex flex-col gap-6 relative overflow-hidden">
                {isSending && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                     <div className="w-8 h-8 border-4 border-[#ff5a1f]/30 border-t-[#ff5a1f] rounded-full animate-spin"></div>
                     <p className="mt-3 font-bold text-slate-700 text-xs font-evolventa">Отправка...</p>
                  </div>
                )}

                <div className="flex flex-col gap-1 select-none">
                  <h3 className="font-extrabold text-slate-800 text-lg font-evolventa tracking-tight">Новая рассылка</h3>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Audience Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Аудитория</label>
                    <div className="flex flex-col bg-slate-50 p-1 rounded-2xl select-none border border-slate-100 gap-1">
                      <button
                        onClick={() => setAudience('all')}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${audience === 'all' ? 'bg-white text-slate-800 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100/50'}`}
                      >
                        Всем клиентам
                      </button>
                      <button
                        onClick={() => setAudience('frequent')}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${audience === 'frequent' ? 'bg-white text-slate-800 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100/50'}`}
                      >
                        Постоянным (3+ визитов)
                      </button>
                      <button
                        onClick={() => setAudience('inactive')}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${audience === 'inactive' ? 'bg-white text-slate-800 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100/50'}`}
                      >
                        Спящим
                      </button>
                    </div>
                  </div>

                  {/* Photo Attachment */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Фото (Опционально)</label>
                    
                    {!imageUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-500 mb-1.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-[11px] font-bold text-slate-500 font-evolventa">Загрузить картинку</span>
                      </div>
                    ) : (
                      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                        <img src={imageUrl} alt="Attached" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => setImageUrl('')}
                            className="px-3 py-1.5 bg-white text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Удалить
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Message Text */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-evolventa">Текст</label>
                      <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 rounded-md p-0.5">
                          <button 
                            onClick={() => insertFormatting('b')}
                            className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded text-xs font-serif font-bold transition-colors"
                            title="Жирный (Bold)"
                          >
                            B
                          </button>
                          <button 
                            onClick={() => insertFormatting('i')}
                            className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded text-xs font-serif italic transition-colors"
                            title="Курсив (Italic)"
                          >
                            I
                          </button>
                        </div>
                      </div>
                    </div>
                    <textarea
                      ref={textareaRef}
                      placeholder="Напишите сообщение..."
                      value={messageText}
                      maxLength={1000}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#ff5a1f]/50 focus:bg-white transition-colors h-32 resize-none leading-relaxed font-evolventa placeholder:text-slate-400"
                    />
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">{messageText.length} / 1000</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      onClick={handleSend}
                      disabled={isSending || (!messageText.trim() && !imageUrl)}
                      className="w-full py-3.5 rounded-2xl bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-extrabold text-[13px] transition-colors font-evolventa cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Scrollable History List Feed (8 columns width) */}
            <div className="flex flex-col gap-4 lg:col-span-8 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-2 scrollbar-none">
              {history.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center border border-slate-100/50">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-800 font-evolventa text-[15px]">История пуста</h3>
                  <p className="text-xs text-slate-400 font-evolventa max-w-[280px] leading-relaxed">
                    Здесь будут отображаться запущенные кампании и их статистика доставки.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-200 hover:border-[#ff5a1f]/60 relative group select-none"
                    >
                      {/* Header: Date + Audience Badge */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm border font-evolventa shrink-0 bg-orange-50 text-[#ff5a1f] border-orange-100/60`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                          </div>
                          
                          <div className="flex flex-col text-left min-w-0">
                            <span className="font-extrabold text-slate-800 text-sm truncate font-evolventa leading-tight">
                              Рассылка от {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-evolventa mt-0.5">
                              {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end text-right shrink-0">
                          <span className="text-[10px] font-black px-2.5 py-1 bg-[#ff5a1f]/10 text-[#ff5a1f] rounded-lg uppercase tracking-wider font-evolventa">
                            {item.audience === 'all' ? 'Всем клиентам' : item.audience === 'frequent' ? 'Постоянным (3+)' : 'Спящим'}
                          </span>
                        </div>
                      </div>

                      {/* Review text */}
                      <div className="relative pl-2">
                        <div className="pl-4 border-l-[3px] border-[#ff5a1f]/50 text-slate-700 text-[13px] leading-relaxed font-evolventa py-1.5 pr-4">
                          <span dangerouslySetInnerHTML={{ __html: item.message_text.replace(/\n/g, '<br/>') }} />
                        </div>
                        {item.image_url && (
                           <div className="mt-3 pl-4">
                              <img src={item.image_url} alt="Прикрепленное изображение" className="w-48 max-h-64 object-cover rounded-xl border border-slate-200" />
                           </div>
                        )}
                      </div>

                      {/* Footer badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100/80 pt-4 mt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100/50 rounded-xl px-3 py-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-bold text-emerald-700 font-evolventa">
                              Успешно доставлено: <span className="font-black ml-0.5">{item.sent_count} чел.</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
