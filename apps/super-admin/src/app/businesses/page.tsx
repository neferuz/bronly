'use client';

import React, { useState } from 'react';
import { useSuperAdmin, BusinessBranch } from '../../hooks/useSuperAdmin';
import { useToast } from '../../components/ui/Toast';

export default function Businesses() {
  const { showToast } = useToast();
  const { businesses, addBusiness, toggleBusinessStatus, deleteBusiness, updateBusinessCredentials, loading } = useSuperAdmin();
  
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddAnimateOpen, setIsAddAnimateOpen] = useState(false);
  
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessBranch | null>(null);
  const [isDetailsAnimateOpen, setIsDetailsAnimateOpen] = useState(false);

  // Custom Confirmation Dialog States
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessBranch | null>(null);
  const [isConfirmAnimateOpen, setIsConfirmAnimateOpen] = useState(false);

  // Edit Credentials Form State
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [isPasswordShown, setIsPasswordShown] = useState(false);

  // Telegram Bot Configuration States
  const [clientBotUsername, setClientBotUsername] = useState('');
  const [clientBotToken, setClientBotToken] = useState('');
  const [masterBotUsername, setMasterBotUsername] = useState('');
  const [masterBotToken, setMasterBotToken] = useState('');

  // Add Business Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    city: 'Ташкент'
  });

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setTimeout(() => setIsAddAnimateOpen(true), 10);
  };

  const closeAddModal = () => {
    setIsAddAnimateOpen(false);
    setTimeout(() => setIsAddModalOpen(false), 300);
  };

  const openDetailsDrawer = (business: BusinessBranch) => {
    setSelectedBusiness(business);
    setCredEmail(business.ownerEmail);
    setCredPassword('');
    setClientBotUsername(business.clientBotUsername || '');
    setClientBotToken(business.clientBotToken || '');
    setMasterBotUsername(business.masterBotUsername || '');
    setMasterBotToken(business.masterBotToken || '');
    setIsPasswordShown(false);
    setTimeout(() => setIsDetailsAnimateOpen(true), 10);
  };

  const closeDetailsDrawer = () => {
    setIsDetailsAnimateOpen(false);
    setTimeout(() => setSelectedBusiness(null), 300);
  };

  const openConfirmDialog = (business: BusinessBranch) => {
    setDeletingBusiness(business);
    setTimeout(() => setIsConfirmAnimateOpen(true), 10);
  };

  const closeConfirmDialog = () => {
    setIsConfirmAnimateOpen(false);
    setTimeout(() => setDeletingBusiness(null), 300);
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.ownerName || !newBranch.ownerEmail || !newBranch.ownerPhone || !newBranch.password) {
      showToast('Пожалуйста, заполните все обязательные поля', 'error');
      return;
    }
    try {
      await addBusiness(newBranch);
      closeAddModal();
      setNewBranch({
        name: '',
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        password: '',
        city: 'Ташкент'
      });
    } catch (err) {
      // Error handles in hook
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    if (!credEmail) {
      showToast('Email не может быть пустым', 'error');
      return;
    }

    setIsSavingCreds(true);
    try {
      await updateBusinessCredentials(
        selectedBusiness.id,
        credEmail !== selectedBusiness.ownerEmail ? credEmail : undefined,
        credPassword || undefined,
        clientBotUsername,
        clientBotToken,
        masterBotUsername,
        masterBotToken
      );
      
      // Update local state copy to match
      setSelectedBusiness({
        ...selectedBusiness,
        ownerEmail: credEmail,
        plainPassword: credPassword || selectedBusiness.plainPassword,
        clientBotUsername,
        clientBotToken,
        masterBotUsername,
        masterBotToken
      });
      setCredPassword('');
    } catch (err) {
      // Error handles in hook
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleDeleteBusinessConfirm = async () => {
    if (!deletingBusiness) return;
    try {
      await deleteBusiness(deletingBusiness.id);
      // If the currently open details drawer is for the deleted business, close it
      if (selectedBusiness?.id === deletingBusiness.id) {
        closeDetailsDrawer();
      }
      closeConfirmDialog();
    } catch (err) {
      // Error handles in hook
    }
  };

  // Filtered Businesses list
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ownerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading && businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500/35 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400 font-evolventa">Загрузка филиалов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans">
      {/* HEADER CONTROLS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Поиск по названию салона, владельцу или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 h-11 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
          />
        </div>

        {/* Filters & Add Action */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none text-xs font-semibold text-slate-650 bg-slate-50 border border-slate-200/80 rounded-2xl pl-4 pr-10 h-11 focus:outline-none focus:border-[#ff5a1f] cursor-pointer smooth-transition"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="blocked">Заблокированные</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          {/* Add Business Button */}
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto bg-[#ff5a1f] hover:bg-[#e04f1a] text-white text-xs font-bold px-5 h-11 rounded-2xl flex items-center justify-center gap-2 smooth-transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Зарегистрировать</span>
          </button>
        </div>
      </div>

      {/* BUSINESSES TABLE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 select-none text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-5 font-evolventa">Салон / Локация</th>
                <th className="py-3.5 px-5 font-evolventa">Владелец</th>
                <th className="py-3.5 px-5 font-evolventa">Показатели</th>
                <th className="py-3.5 px-5 font-evolventa text-right">Статус / Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-evolventa">Салоны не найдены</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-evolventa">Измените параметры поиска или зарегистрируйте новый салон.</p>
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => (
                  <tr 
                    key={b.id} 
                    onClick={() => openDetailsDrawer(b)}
                    className="hover:bg-slate-50/30 smooth-transition cursor-pointer group"
                  >
                    {/* Salon & City */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-sm font-black font-evolventa select-none shrink-0 smooth-transition group-hover:scale-105">
                          {b.name[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-800 text-[11px] truncate leading-tight font-evolventa group-hover:text-[#ff5a1f] smooth-transition">
                            {b.name}
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold leading-normal mt-1 font-evolventa">
                            {b.city} • Создан: {b.registeredAt}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Owner Contacts */}
                    <td className="py-4 px-5">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[11px] text-slate-700 font-extrabold font-evolventa">
                          {b.ownerName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 font-evolventa">
                          <span>{b.ownerPhone}</span>
                          {b.ownerTelegram && (
                            <span className="text-sky-500 bg-sky-50 border border-sky-100 px-0.5 rounded">
                              {b.ownerTelegram}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Metrics stats */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 font-evolventa">
                        <div className="text-center" title="Количество мастеров">
                          <span className="text-slate-800 font-bold block">{b.mastersCount}</span>
                          <span className="text-[7px] text-slate-400 uppercase">маст.</span>
                        </div>
                        <div className="text-center" title="Количество услуг">
                          <span className="text-slate-800 font-bold block">{b.servicesCount}</span>
                          <span className="text-[7px] text-slate-400 uppercase">услуг</span>
                        </div>
                        <div className="text-center" title="Количество сессий записи">
                          <span className="text-[#ff5a1f] font-bold block">{b.bookingsCount}</span>
                          <span className="text-[7px] text-slate-400 uppercase">запис.</span>
                        </div>
                      </div>
                    </td>

                    {/* Status & Actions toggle */}
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold leading-none select-none ${
                          b.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {b.status === 'active' ? 'Активен' : 'Блок'}
                        </span>
                        
                        {/* Block / Unblock Button */}
                        <button
                          onClick={() => toggleBusinessStatus(b.id)}
                          title={b.status === 'active' ? 'Заблокировать салон' : 'Активировать салон'}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center smooth-transition border cursor-pointer ${
                            b.status === 'active'
                              ? 'bg-amber-50 border-amber-100/50 text-amber-600 hover:bg-amber-100'
                              : 'bg-emerald-50 border-emerald-100/50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {b.status === 'active' ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => openConfirmDialog(b)}
                          title="Удалить салон"
                          className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 flex items-center justify-center smooth-transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW BUSINESS DRAWER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-350 ease-out ${
              isAddAnimateOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeAddModal}
          />
          
          {/* Drawer Panel */}
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl flex flex-col justify-between p-6 transition-transform duration-300 ease-out z-10 ${
              isAddAnimateOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm font-evolventa">Регистрация бизнеса</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-evolventa">Создание новой точки в Bronly Platform</p>
              </div>
              <button onClick={closeAddModal} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Scrollable Body */}
            <form onSubmit={handleAddBusiness} className="flex-1 py-6 space-y-5 overflow-y-auto pr-1">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Название салона *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Elite Barber"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Имя владельца *</label>
                <input
                  type="text"
                  required
                  placeholder="Алексей Смирнов"
                  value={newBranch.ownerName}
                  onChange={(e) => setNewBranch({ ...newBranch, ownerName: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Email владельца (логин CRM) *</label>
                <input
                  type="email"
                  required
                  placeholder="owner@salon.com"
                  value={newBranch.ownerEmail}
                  onChange={(e) => setNewBranch({ ...newBranch, ownerEmail: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Телефон *</label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123-45-67"
                    value={newBranch.ownerPhone}
                    onChange={(e) => setNewBranch({ ...newBranch, ownerPhone: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Пароль CRM *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newBranch.password}
                    onChange={(e) => setNewBranch({ ...newBranch, password: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Город</label>
                <div className="relative">
                  <select
                    value={newBranch.city}
                    onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                    className="w-full appearance-none text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:border-[#ff5a1f] smooth-transition cursor-pointer"
                  >
                    <option value="Ташкент">Ташкент</option>
                    <option value="Самарканд">Самарканд</option>
                    <option value="Бухара">Бухара</option>
                    <option value="Андижан">Андижан</option>
                    <option value="Карши">Карши</option>
                    <option value="Нукус">Нукус</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={closeAddModal}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-3.5 rounded-xl smooth-transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={handleAddBusiness}
                className="flex-1 bg-[#ff5a1f] hover:bg-[#e04f1a] text-white font-bold text-xs py-3.5 rounded-xl smooth-transition cursor-pointer"
              >
                Зарегистрировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW DRAWER */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-40 overflow-hidden select-none">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-350 ease-out ${
              isDetailsAnimateOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeDetailsDrawer}
          />
          
          {/* Details Drawer Panel */}
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl flex flex-col justify-between p-6 transition-transform duration-300 ease-out z-10 ${
              isDetailsAnimateOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a1f] border border-orange-100 flex items-center justify-center text-lg font-black font-evolventa shrink-0">
                  {selectedBusiness.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800 text-sm truncate font-evolventa">{selectedBusiness.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-evolventa">{selectedBusiness.city} • ID: {selectedBusiness.id}</p>
                </div>
              </div>
              <button onClick={closeDetailsDrawer} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable detailed statistics and settings */}
            <div className="flex-1 py-6 space-y-6 overflow-y-auto pr-1">
              
              {/* STATS SECTION */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Показатели филиала</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-evolventa">Всего мастеров</span>
                    <span className="text-lg font-black text-slate-800 block mt-1 font-evolventa">{selectedBusiness.mastersCount}</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-evolventa">Всего услуг</span>
                    <span className="text-lg font-black text-slate-800 block mt-1 font-evolventa">{selectedBusiness.servicesCount}</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-evolventa">Всего сессий записи</span>
                    <span className="text-lg font-black text-slate-800 block mt-1 font-evolventa">{selectedBusiness.bookingsCount}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-evolventa">Выручка филиала</span>
                    <span className="text-md font-black text-[#ff5a1f] block mt-1.5 font-evolventa">
                      {selectedBusiness.revenue.toLocaleString('ru-RU')} сум
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* SALON OWNER INFO */}
              <div className="space-y-2 text-xs font-semibold text-slate-700">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-evolventa">Контакты владельца</span>
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-200/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-evolventa">ФИО:</span>
                    <span className="font-extrabold text-slate-800 font-evolventa">{selectedBusiness.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-evolventa">Телефон:</span>
                    <span className="font-bold text-slate-800 font-evolventa">{selectedBusiness.ownerPhone}</span>
                  </div>
                  {selectedBusiness.ownerTelegram && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-evolventa">Telegram:</span>
                      <span className="font-bold text-sky-500 font-evolventa">{selectedBusiness.ownerTelegram}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-evolventa">Дата создания:</span>
                    <span className="font-bold text-slate-500 font-evolventa">{selectedBusiness.registeredAt}</span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* CRM ACCESS CONFIGURATION */}
              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-evolventa">Доступ к CRM (логин / пароль)</span>
                  <p className="text-[9px] text-slate-400 font-medium font-evolventa mb-3">
                    Вход для владельца доступен по ссылке:{' '}
                    <a 
                      href="http://localhost:3003/login" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#ff5a1f] hover:underline font-bold"
                    >
                      http://localhost:3003/login
                    </a>
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Email (Логин) *</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@salon.com"
                      value={credEmail}
                      onChange={(e) => setCredEmail(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                    />
                  </div>

                  <div className="bg-orange-50/40 border border-orange-100/60 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
                    <div className="text-left">
                      <span className="text-[8px] font-black text-slate-450 uppercase block font-evolventa">Текущий пароль CRM</span>
                      <span className="font-mono text-slate-800 font-bold">
                        {selectedBusiness.plainPassword 
                          ? (isPasswordShown ? selectedBusiness.plainPassword : '••••••••') 
                          : 'Зашифрован (не задан в открытом виде)'}
                      </span>
                    </div>
                    {selectedBusiness.plainPassword && (
                      <button
                        type="button"
                        onClick={() => setIsPasswordShown(!isPasswordShown)}
                        className="text-[10px] font-bold text-[#ff5a1f] hover:underline cursor-pointer"
                      >
                        {isPasswordShown ? 'Скрыть' : 'Показать'}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Установить новый пароль</label>
                    <input
                      type="password"
                      placeholder="Оставьте пустым, чтобы не менять"
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                    />
                  </div>

                  <hr className="border-slate-100 my-4" />

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3 font-evolventa">Настройка Telegram-ботов</span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Бот клиентов (Username)</label>
                        <input
                          type="text"
                          placeholder="@bronly_bot"
                          value={clientBotUsername}
                          onChange={(e) => setClientBotUsername(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Токен клиентского бота</label>
                        <input
                          type="password"
                          placeholder="Токен от @BotFather"
                          value={clientBotToken}
                          onChange={(e) => setClientBotToken(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Бот мастеров (Username)</label>
                        <input
                          type="text"
                          placeholder="@bronly_masters_bot"
                          value={masterBotUsername}
                          onChange={(e) => setMasterBotUsername(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 font-evolventa">Токен бота мастеров</label>
                        <input
                          type="password"
                          placeholder="Токен от @BotFather"
                          value={masterBotToken}
                          onChange={(e) => setMasterBotToken(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff5a1f] smooth-transition font-evolventa"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingCreds}
                    className="w-full bg-[#ff5a1f] hover:bg-[#e04f1a] disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl smooth-transition cursor-pointer font-evolventa flex items-center justify-center gap-2 mt-4"
                  >
                    {isSavingCreds ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <span>Сохранить доступы и ботов</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer Status Toggle */}
            <div className="pt-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 text-xs font-bold font-evolventa">
              <div className="flex flex-col text-left">
                <span className="text-[8px] text-slate-400 uppercase font-black font-evolventa">Статус филиала</span>
                <span className={`text-xs mt-0.5 ${selectedBusiness.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedBusiness.status === 'active' ? 'Активен' : 'Заблокирован'}
                </span>
              </div>
              
              <button
                onClick={() => {
                  toggleBusinessStatus(selectedBusiness.id).then(() => {
                    // Update details view status
                    const updated = businesses.find((b) => b.id === selectedBusiness.id);
                    if (updated) setSelectedBusiness(updated);
                  });
                }}
                className={`px-4 py-2.5 rounded-xl border smooth-transition cursor-pointer ${
                  selectedBusiness.status === 'active'
                    ? 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {selectedBusiness.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {deletingBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden select-none">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-out ${
              isConfirmAnimateOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeConfirmDialog}
          />

          {/* Modal Box */}
          <div
            className={`relative w-[90%] max-w-sm bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xl transition-all duration-280 ease-out transform z-10 ${
              isConfirmAnimateOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}
          >
            {/* Warning Icon Graphic */}
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4 animate-bounce">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Content text */}
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-slate-800 font-extrabold text-sm font-evolventa">Удалить салон?</h3>
              <p className="text-[11px] font-semibold text-slate-500 font-evolventa leading-relaxed">
                Вы уверены, что хотите удалить салон <strong className="text-slate-800">«{deletingBusiness.name}»</strong> и все связанные данные? Это действие необратимо.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeConfirmDialog}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs py-3 rounded-xl smooth-transition cursor-pointer font-evolventa"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteBusinessConfirm}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-xl smooth-transition cursor-pointer font-evolventa shadow-md shadow-rose-500/10"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
