'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';

export default function Settings() {
  const { showToast } = useToast();
  const [tgAlerts, setTgAlerts] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [dbSize, setDbSize] = useState('0.0 KB');
  const [logs, setLogs] = useState<string[]>([]);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const API_BASE_URL = `${apiHost}/api/v1/super-admin`;
  const ADMIN_HEADERS: Record<string, string> = { 'X-Admin-Key': process.env.NEXT_PUBLIC_SUPER_ADMIN_KEY || 'bronly-hq-secret-2026' };


  useEffect(() => {
    const fetchStatusAndLogs = async () => {
      try {
        // 1. Fetch maintenance status
        const maintRes = await fetch(`${API_BASE_URL}/server/maintenance`, { headers: ADMIN_HEADERS });
        if (maintRes.ok) {
          const data = await maintRes.json();
          setMaintenance(data.maintenance_mode);
        }

        // 2. Fetch server health
        const statusRes = await fetch(`${API_BASE_URL}/server/status`, { headers: ADMIN_HEADERS });
        if (statusRes.ok) {
          const data = await statusRes.json();
          setApiStatus(data.api_status);
          setDbStatus(data.db_status);
          setDbSize(`${data.db_size_kb} KB`);
        } else {
          setApiStatus('offline');
          setDbStatus('offline');
        }

        // 3. Fetch server logs
        const logsRes = await fetch(`${API_BASE_URL}/server/logs`, { headers: ADMIN_HEADERS });
        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(data.logs);
        }
      } catch (err) {
        setApiStatus('offline');
        setDbStatus('offline');
      }
    };

    fetchStatusAndLogs();
    const interval = setInterval(fetchStatusAndLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMaintenance = async (checked: boolean) => {
    setMaintenance(checked);
    try {
      const res = await fetch(`${API_BASE_URL}/server/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADERS },
        body: JSON.stringify({ maintenance_mode: checked })
      });
      if (res.ok) {
        showToast(checked ? 'Режим технических работ АКТИВИРОВАН!' : 'Режим технических работ отключен.', 'success');
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast('Не удалось изменить режим техработ', 'error');
      setMaintenance(!checked);
    }
  };

  const handleBackup = async () => {
    showToast('Запуск бэкапа базы данных...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/db/backup`, { method: 'POST', headers: ADMIN_HEADERS });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast(data.message || 'Бэкап успешно создан!', 'success');
    } catch (err) {
      showToast('Не удалось создать резервную копию', 'error');
    }
  };

  const handleClearCache = async () => {
    showToast('Запуск очистки кэша и дефрагментации...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/db/clear-cache`, { method: 'POST', headers: ADMIN_HEADERS });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast(data.message || 'Очистка успешно выполнена!', 'success');
    } catch (err) {
      showToast('Не удалось очистить кэш', 'error');
    }
  };

  return (
    <div className="space-y-6 w-full font-sans select-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Config Forms & Logs Terminal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Глобальные параметры платформы</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Параметры безопасности и статус обслуживания</p>
            </div>

            <div className="space-y-5">
              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-750 font-evolventa">Алерты ошибок в Telegram</span>
                    <span className="text-[9px] text-slate-400 font-bold font-evolventa mt-0.5">Отправлять системные ошибки в закрытую группу разработчиков</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tgAlerts}
                    onChange={(e) => setTgAlerts(e.target.checked)}
                    className="w-8 h-4 bg-slate-200 rounded-full checked:bg-[#ff5a1f] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-750 font-evolventa">Режим технических работ</span>
                    <span className="text-[9px] text-slate-400 font-bold font-evolventa mt-0.5">Временное ограничение доступа к CRM для всех филиалов</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenance}
                    onChange={(e) => handleToggleMaintenance(e.target.checked)}
                    className="w-8 h-4 bg-slate-200 rounded-full checked:bg-[#ff5a1f] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Backup and Cache block */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Резервные копии и оптимизация</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Управление резервными копиями базы данных и свободным пространством</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-700 font-evolventa block">База Данных SQLite</span>
                  <span className="text-[9px] text-slate-400 font-bold font-evolventa mt-0.5">Размер файла БД: {dbSize}</span>
                </div>
                <button
                  onClick={handleBackup}
                  className="bg-[#ff5a1f] hover:bg-orange-600 text-white font-bold text-[10px] px-4 py-2 rounded-xl smooth-transition cursor-pointer"
                >
                  Бэкап
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-700 font-evolventa block">Оптимизация БД (VACUUM)</span>
                  <span className="text-[9px] text-slate-400 font-bold font-evolventa mt-0.5">Сжатие файла и сброс кэша сессий</span>
                </div>
                <button
                  onClick={handleClearCache}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-[10px] px-4 py-2 rounded-xl smooth-transition cursor-pointer"
                >
                  Оптимизировать
                </button>
              </div>
            </div>
          </div>

          {/* Real-time System Logs Terminal */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-none font-mono">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider font-evolventa">Системный терминал логов API</h3>
                <p className="text-[9px] text-slate-500 font-medium mt-0.5 font-evolventa">Входящие HTTP-запросы и системные ошибки в реальном времени</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-evolventa">LIVE MONITOR</span>
              </div>
            </div>

            <div className="h-[220px] overflow-y-auto text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2 flex flex-col">
              <div className="flex flex-col gap-1 text-left">
                {logs.length === 0 ? (
                  <span className="text-slate-500 italic">Ожидание активности на сервере...</span>
                ) : (
                  logs.map((log, index) => {
                    const isError = log.includes('ERROR') || log.includes('Failed');
                    const isGet = log.includes('GET');
                    const isPost = log.includes('POST') || log.includes('PATCH') || log.includes('PUT') || log.includes('DELETE');
                    let colorClass = 'text-slate-300';
                    if (isError) colorClass = 'text-rose-400 font-bold';
                    else if (isGet) colorClass = 'text-sky-400';
                    else if (isPost) colorClass = 'text-emerald-400';
                    
                    return (
                      <div key={index} className={`whitespace-pre-wrap ${colorClass}`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Services Health Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-none h-fit space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Статус серверов и API</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Состояние компонентов платформы</p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            {/* FastAPI API */}
            <div className="flex items-center justify-between">
              <span className="font-evolventa">Backend Server (FastAPI)</span>
              <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-black font-evolventa ${
                apiStatus === 'online' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {apiStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* SQLite */}
            <div className="flex items-center justify-between">
              <span className="font-evolventa">Database (SQLite)</span>
              <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-black font-evolventa ${
                dbStatus === 'online' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {dbStatus === 'online' ? 'Active' : 'Error'}
              </span>
            </div>

            {/* CRM App */}
            <div className="flex items-center justify-between">
              <span className="font-evolventa">CRM App (Port 3003)</span>
              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black font-evolventa">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Super Admin App */}
            <div className="flex items-center justify-between">
              <span className="font-evolventa">Super Admin (Port 3004)</span>
              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black font-evolventa">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
