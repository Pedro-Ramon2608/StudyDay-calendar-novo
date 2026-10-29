import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DayPlan } from '../../types';
import { getTodayString, formatDateString } from '../../utils/dateUtils';
import { CatPawIcon } from '../Cat/CatIcon';

interface CalendarGridProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayPlans: Record<string, DayPlan>;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  selectedDate,
  onSelectDate,
  dayPlans,
}) => {
  const today = getTodayString();

  // Guarda o mês e ano visualizados atualmente no grid
  const [currentViewDate, setCurrentViewDate] = React.useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  });

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(today);
  };

  // Cálculos do calendário do mês
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Dias da semana em português
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Formatação do cabeçalho do mês
  const monthName = currentViewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const monthCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Gera a lista de dias do grid
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 shadow-xs">
      {/* Top Header: Mês/Ano e Controles Compactos */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 capitalize tracking-tight flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{monthCapitalized}</span>
            <span className="text-slate-400 font-normal font-mono text-xs">{year}</span>
            <CatPawIcon size={12} color="#f472b6" />
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center border border-slate-200 rounded overflow-hidden bg-white">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-200" />
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dias da Semana Compactos */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1">
        {weekDays.map((d, index) => (
          <div key={d} className={`py-0.5 ${index === 0 || index === 6 ? 'text-slate-400' : 'text-slate-500'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de Dias Compacto */}
      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((blank) => (
          <div key={`blank-${blank}`} className="h-7 sm:h-8" />
        ))}

        {daysArray.map((dayNum) => {
          const dateObj = new Date(year, month, dayNum);
          const dateStr = formatDateString(dateObj);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;

          const plan = dayPlans[dateStr];
          const hasTasks = !!(plan && plan.tasks && plan.tasks.length > 0);
          const allCompleted = hasTasks && plan.tasks.every((t) => t.completed);
          const totalTasks = plan?.tasks?.length || 0;
          const completedTasks = plan?.tasks?.filter((t) => t.completed).length || 0;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`relative h-7 sm:h-8 flex flex-col items-center justify-between p-0.5 sm:p-1 rounded-md border transition-all text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold shadow-xs'
                  : isToday
                  ? 'border-indigo-300 bg-white hover:bg-slate-50 font-semibold text-slate-900'
                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50/80 text-slate-700'
              }`}
            >
              <div className="w-full flex items-center justify-center leading-none">
                <span
                  className={`text-[11px] leading-tight ${
                    isToday && !isSelected
                      ? 'w-4 h-4 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]'
                      : ''
                  }`}
                >
                  {dayNum}
                </span>
              </div>

              {/* Indicador de Status das Tarefas com Patinha no dia concluído */}
              <div className="w-full flex items-center justify-center leading-none">
                {hasTasks ? (
                  allCompleted ? (
                    <CatPawIcon
                      size={10}
                      color="#10b981"
                      className="inline-block"
                    />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                      title={`${completedTasks}/${totalTasks} tarefas`}
                    />
                  )
                ) : (
                  <span className="w-1.5 h-1.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda visual compacta com patinhas */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            <span>Com tarefas</span>
          </div>
          <div className="flex items-center gap-1">
            <CatPawIcon size={10} color="#10b981" />
            <span>Concluídas</span>
          </div>
        </div>

        <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
          <span>Clique no dia para abrir</span>
          <CatPawIcon size={9} color="#cbd5e1" />
        </span>
      </div>
    </div>
  );
};
