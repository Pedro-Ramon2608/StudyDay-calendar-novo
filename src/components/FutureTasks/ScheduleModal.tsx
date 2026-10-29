import React, { useState } from 'react';
import { FutureTask } from '../../types';
import { Calendar, Check, X, ArrowRight } from 'lucide-react';
import { getTodayString, formatDateString, formatFriendlyDate } from '../../utils/dateUtils';

interface ScheduleModalProps {
  task: FutureTask;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetDate: string, removeFromFuture: boolean) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const today = getTodayString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateString(tomorrow);

  const [selectedDate, setSelectedDate] = useState(task.scheduledDate || today);
  const [removeFromFuture, setRemoveFromFuture] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    onConfirm(selectedDate, removeFromFuture);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 id="modal-title" className="font-semibold text-base">
              Agendar para o Calendário
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Meta selecionada
          </p>
          <p className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
            {task.title}
          </p>
          {task.links && task.links.length > 0 && (
            <p className="text-[11px] text-slate-500 pt-1">
              Os {task.links.length} link(s) anexados a esta meta também serão copiados para o dia de estudo.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Escolha a data de estudo:
            </label>

            {/* Atalhos rápidos para Hoje e Amanhã */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  selectedDate === today
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  selectedDate === tomorrowStr
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Amanhã
              </button>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              required
            />

            {selectedDate && (
              <p className="text-xs text-slate-500">
                Data selecionada: <span className="font-medium text-slate-700">{formatFriendlyDate(selectedDate)}</span>
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={removeFromFuture}
              onChange={(e) => setRemoveFromFuture(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Remover do backlog após agendar (mover em vez de duplicar)</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Confirmar no Calendário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
