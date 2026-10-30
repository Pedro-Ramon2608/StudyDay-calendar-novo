import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useStudyStorage } from './hooks/useStudyStorage';
import { ActiveTab, TaskPriority } from './types';
import { getTodayString } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { DayView } from './components/Calendar/DayView';
import { WeekView } from './components/Week/WeekView';
import { PomodoroView } from './components/Pomodoro/PomodoroView';
import { FutureTasksView } from './components/FutureTasks/FutureTasksView';
import { CatPawEffect } from './components/Cat/CatPawEffect';
import { AuthModal } from './components/Auth/AuthModal';
import { CatIcon, CatPawIcon } from './components/Cat/CatIcon';
import { CatAvatar } from './components/Cat/CatAvatar';

function StudyDayMain() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayString());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const { user } = useAuth();
  const {
    state,
    getDayPlan,
    setDaySubject,
    setDayNotes,
    addDayTask,
    toggleDayTask,
    deleteDayTask,
    editDayTask,
    addDayLink,
    deleteDayLink,
    addFutureTask,
    toggleFutureTask,
    deleteFutureTask,
    updateFutureTask,
    addFutureTaskLink,
    deleteFutureTaskLink,
    scheduleFutureTaskToCalendar,
    addGlobalLink,
    deleteGlobalLink,
    resetToDefaults,
    exportData,
    importData,
    pawTriggerCount,
    lastCompletedTaskTitle,
  } = useStudyStorage();

  const currentPlan = getDayPlan(selectedDate);

  const handleJumpToToday = () => {
    setSelectedDate(getTodayString());
  };

  const handleScheduleFutureTask = (
    futureTaskId: string,
    targetDate: string,
    options?: { removeFromFuture?: boolean }
  ) => {
    scheduleFutureTaskToCalendar(futureTaskId, targetDate, options);
    setSelectedDate(targetDate);
    setActiveTab('calendar');
  };

  const handleOpenDateInDetail = (date: string) => {
    setSelectedDate(date);
    setActiveTab('calendar');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Efeito Visual de Patinhas de Gato ao Concluir Tarefas */}
      <CatPawEffect
        triggerCount={pawTriggerCount}
        lastCompletedTaskTitle={lastCompletedTaskTitle}
      />

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={exportData}
        onImport={importData}
        onReset={resetToDefaults}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner de Boas-Vindas Discreto para Usuários Não Autenticados */}
        {!user && (
          <div className="mb-6 p-3.5 bg-gradient-to-r from-indigo-50/90 to-pink-50/70 border border-indigo-100/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-white p-0.5 border border-indigo-100 shrink-0 flex items-center justify-center shadow-2xs overflow-hidden">
                <CatAvatar
                  alt="Gatinho StudyDay"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <span>Conecte sua conta para salvar suas tarefas na nuvem</span>
                  <CatPawIcon size={14} color="#ec4899" />
                </p>
                <p className="text-slate-500 text-[11px]">
                  Acesse suas tarefas do celular, notebook ou qualquer aparelho com login de e-mail e senha.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              Criar Conta / Entrar
            </button>
          </div>
        )}

        {/* 1. ABA CALENDÁRIO */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Coluna da Esquerda: Calendário Compacto (4 colunas) */}
            <div className="lg:col-span-4 space-y-3">
              <CalendarGrid
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                dayPlans={state.dayPlans}
              />

              {/* Card com resumo rápido e mascote */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CatIcon priority="calm" size={18} showBadgeDot={false} />
                    <span>Produtividade de Hoje</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Ver Hoje
                  </button>
                </div>
                {(() => {
                  const todayPlan = getDayPlan(getTodayString());
                  const total = todayPlan.tasks.length;
                  const done = todayPlan.tasks.filter((t) => t.completed).length;
                  return (
                    <p className="text-slate-500">
                      {total === 0
                        ? 'Nenhuma tarefa cadastrada para hoje ainda.'
                        : `${done} de ${total} tarefas concluídas hoje (${Math.round(
                            (done / total) * 100
                          )}%). Complete uma para ver a patinha! 🐾`}
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Coluna da Direita: Painel do Dia Selecionado (8 colunas) */}
            <div className="lg:col-span-8">
              <DayView
                date={selectedDate}
                plan={currentPlan}
                onSetSubject={(subject) => setDaySubject(selectedDate, subject)}
                onSetNotes={(notes) => setDayNotes(selectedDate, notes)}
                onAddTask={(title, description, priority) =>
                  addDayTask(selectedDate, title, description, priority)
                }
                onToggleTask={(taskId) => toggleDayTask(selectedDate, taskId)}
                onDeleteTask={(taskId) => deleteDayTask(selectedDate, taskId)}
                onEditTask={(taskId, title, description, priority) =>
                  editDayTask(selectedDate, taskId, title, description, priority)
                }
                onAddLink={(title, url) => addDayLink(selectedDate, title, url)}
                onDeleteLink={(linkId) => deleteDayLink(selectedDate, linkId)}
                onJumpToToday={handleJumpToToday}
              />
            </div>
          </div>
        )}

        {/* 2. ABA SEMANA ATUAL */}
        {activeTab === 'week' && (
          <WeekView
            dayPlans={state.dayPlans}
            onToggleTask={toggleDayTask}
            onDeleteTask={deleteDayTask}
            onAddTask={(date, title, desc, priority) => addDayTask(date, title, desc, priority)}
            onEditTask={(date, taskId, title, desc, priority) =>
              editDayTask(date, taskId, title, desc, priority)
            }
            onSelectDateForDetail={handleOpenDateInDetail}
          />
        )}

        {/* 3. ABA CRONÔMETRO POMODORO */}
        {activeTab === 'pomodoro' && <PomodoroView />}

        {/* 4. ABA METAS & RECURSOS */}
        {activeTab === 'future' && (
          <FutureTasksView
            futureTasks={state.futureTasks}
            globalLinks={state.globalLinks}
            onAddFutureTask={addFutureTask}
            onToggleFutureTask={toggleFutureTask}
            onDeleteFutureTask={deleteFutureTask}
            onUpdateFutureTask={updateFutureTask}
            onAddFutureTaskLink={addFutureTaskLink}
            onDeleteFutureTaskLink={deleteFutureTaskLink}
            onScheduleFutureTask={handleScheduleFutureTask}
            onAddGlobalLink={addGlobalLink}
            onDeleteGlobalLink={deleteGlobalLink}
          />
        )}
      </main>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        canDismiss={true}
      />

      {/* Rodapé Clean com Patinhas de Gato */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span>StudyDay · Organização com foco, gatinhos e sem atritos.</span>
            <CatPawIcon size={12} color="#f472b6" />
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>{user ? `Logado como ${user.email}` : 'Dados no banco de dados'}</span>
            <span aria-hidden="true">·</span>
            <span>Pomodoro 40/5m</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudyDayMain />
    </AuthProvider>
  );
}
