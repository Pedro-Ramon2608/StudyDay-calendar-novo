import React, { useState } from 'react';
import { DayPlan, Task, TaskPriority } from '../../types';
import { formatDateString, formatShortDate, getTodayString } from '../../utils/dateUtils';
import { CatPriorityBadge } from '../Cat/CatPriorityBadge';
import { CatPrioritySelector } from '../Cat/CatPrioritySelector';
import { CatIcon, CatPawIcon } from '../Cat/CatIcon';
import { ProgressBar } from '../Common/ProgressBar';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  X,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface WeekViewProps {
  dayPlans: Record<string, DayPlan>;
  onToggleTask: (date: string, taskId: string) => void;
  onDeleteTask: (date: string, taskId: string) => void;
  onAddTask: (date: string, title: string, description?: string, priority?: TaskPriority) => void;
  onEditTask: (date: string, taskId: string, title: string, description?: string, priority?: TaskPriority) => void;
  onSelectDateForDetail: (date: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  dayPlans,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onEditTask,
  onSelectDateForDetail,
}) => {
  const today = getTodayString();

  // Guarda o primeiro dia da semana visualizada (Segunda-feira)
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay(); // 0 Dom, 1 Seg, ..., 6 Sab
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Estado para adicionar tarefa inline em um dia específico
  const [addingTaskForDate, setAddingTaskForDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('calm');

  // Estado para edição de tarefa existente
  const [editingTask, setEditingTask] = useState<{
    date: string;
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
  } | null>(null);

  // Navegação entre semanas
  const handlePrevWeek = () => {
    const prev = new Date(weekStartDate);
    prev.setDate(prev.getDate() - 7);
    setWeekStartDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStartDate);
    next.setDate(next.getDate() + 7);
    setWeekStartDate(next);
  };

  const handleCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeekStartDate(monday);
  };

  // Gera os 7 dias da semana (Segunda a Domingo)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateString(d);
    const plan = dayPlans[dateStr] || {
      date: dateStr,
      subject: '',
      notes: '',
      tasks: [],
      links: [],
    };
    return {
      dateObj: d,
      dateStr,
      dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      dayNameLong: d.toLocaleDateString('pt-BR', { weekday: 'long' }),
      formattedDayMonth: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      isToday: dateStr === today,
      plan,
    };
  });

  // Métricas da semana
  const totalWeekTasks = weekDays.reduce((acc, d) => acc + d.plan.tasks.length, 0);
  const completedWeekTasks = weekDays.reduce(
    (acc, d) => acc + d.plan.tasks.filter((t) => t.completed).length,
    0
  );
  const weekPercentage = totalWeekTasks === 0 ? 0 : Math.round((completedWeekTasks / totalWeekTasks) * 100);

  const startOfWeekStr = formatShortDate(weekDays[0].dateStr);
  const endOfWeekStr = formatShortDate(weekDays[6].dateStr);

  const handleCreateTaskSubmit = (dateStr: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(dateStr, newTaskTitle.trim(), newTaskDesc.trim() || undefined, newTaskPriority);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('calm');
    setAddingTaskForDate(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    onEditTask(
      editingTask.date,
      editingTask.taskId,
      editingTask.title.trim(),
      editingTask.description.trim() || undefined,
      editingTask.priority
    );
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header da Semana */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarRange className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Tarefas da Semana</span>
              <CatPawIcon size={18} color="#ec4899" />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualização consolidada de segunda a domingo · <span className="font-mono text-slate-700 font-medium">{startOfWeekStr} a {endOfWeekStr}</span>
          </p>
        </div>

        {/* Controles de Semana */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleCurrentWeek}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors"
          >
            Semana Atual
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label="Semana anterior"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <button
              type="button"
              onClick={handleNextWeek}
              aria-label="Próxima semana"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Progresso Geral da Semana */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Progresso Geral da Semana
            </span>
            <span className="font-mono tabular-nums font-bold text-indigo-700">
              {completedWeekTasks} de {totalWeekTasks} concluídas ({weekPercentage}%)
            </span>
          </div>
          <ProgressBar total={totalWeekTasks} completed={completedWeekTasks} size="md" />
        </div>

        {totalWeekTasks > 0 && completedWeekTasks === totalWeekTasks && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-semibold shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Semana 100% cumprida! Parabéns! 🐾</span>
          </div>
        )}
      </div>

      {/* Grade dos 7 Dias da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {weekDays.map((day) => {
          const tasksCount = day.plan.tasks.length;
          const completedCount = day.plan.tasks.filter((t) => t.completed).length;
          const isAdding = addingTaskForDate === day.dateStr;

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col bg-white rounded-2xl border transition-all ${
                day.isToday
                  ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Cabeçalho do Dia */}
              <div
                className={`p-3 border-b rounded-t-2xl flex items-center justify-between gap-2 ${
                  day.isToday ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50/80 border-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {day.formattedDayMonth}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-mono text-slate-400 font-medium">
                    {completedCount}/{tasksCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTaskForDate(isAdding ? null : day.dateStr);
                      setNewTaskPriority('calm');
                    }}
                    title="Adicionar tarefa para este dia"
                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tema Principal do Dia (se houver) */}
              {day.plan.subject && (
                <div className="px-3 py-1.5 bg-slate-50/50 border-b border-slate-100 text-[11px] font-medium text-slate-700 truncate">
                  <span className="text-slate-400 mr-1">Tema:</span>
                  {day.plan.subject}
                </div>
              )}

              {/* Formulário Inline de Adicionar Tarefa */}
              {isAdding && (
                <form
                  onSubmit={(e) => handleCreateTaskSubmit(day.dateStr, e)}
                  className="p-2.5 bg-indigo-50/40 border-b border-indigo-200 text-xs space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900">Nova Tarefa</span>
                    <button
                      type="button"
                      onClick={() => setAddingTaskForDate(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Título da tarefa..."
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                    required
                  />

                  <textarea
                    rows={1}
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Descrição (opcional)..."
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />

                  <CatPrioritySelector
                    value={newTaskPriority}
                    onChange={setNewTaskPriority}
                    size="sm"
                  />

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddingTaskForDate(null)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="px-2.5 py-1 text-[11px] bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Tarefas do Dia */}
              <div className="p-2.5 space-y-2 flex-1 min-h-[140px]">
                {day.plan.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                    <CatPawIcon size={16} color="#cbd5e1" />
                    <span className="text-[11px] text-slate-400 italic mt-1">Sem tarefas</span>
                  </div>
                ) : (
                  day.plan.tasks.map((task) => {
                    const isEditingThis =
                      editingTask?.date === day.dateStr && editingTask?.taskId === task.id;

                    if (isEditingThis) {
                      return (
                        <form
                          key={task.id}
                          onSubmit={handleSaveEdit}
                          className="p-2 bg-indigo-50/70 border border-indigo-300 rounded-lg text-xs space-y-2"
                        >
                          <input
                            type="text"
                            value={editingTask.title}
                            onChange={(e) =>
                              setEditingTask({ ...editingTask, title: e.target.value })
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                            required
                          />
                          <textarea
                            rows={1}
                            value={editingTask.description}
                            onChange={(e) =>
                              setEditingTask({ ...editingTask, description: e.target.value })
                            }
                            placeholder="Descrição..."
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                          <CatPrioritySelector
                            value={editingTask.priority}
                            onChange={(p) => setEditingTask({ ...editingTask, priority: p })}
                            size="sm"
                          />
                          <div className="flex justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingTask(null)}
                              className="px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200 rounded"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-0.5 text-[10px] bg-indigo-600 text-white rounded font-medium"
                            >
                              Salvar
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={task.id}
                        className={`group p-2 rounded-xl border text-xs transition-all ${
                          task.completed
                            ? 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleTask(day.dateStr, task.id)}
                            className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 focus:outline-none"
                            aria-label="Concluir tarefa"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 hover:text-indigo-500" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <span
                              onClick={() => onToggleTask(day.dateStr, task.id)}
                              className={`cursor-pointer block break-words font-medium text-[11px] leading-snug ${
                                task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                            </span>

                            {task.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                {task.description}
                              </p>
                            )}

                            {/* Badge do Gatinho */}
                            <div className="pt-0.5">
                              <CatPriorityBadge
                                priority={task.completed ? 'done' : task.priority || 'calm'}
                                size="xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTask({
                                  date: day.dateStr,
                                  taskId: task.id,
                                  title: task.title,
                                  description: task.description || '',
                                  priority: task.priority || 'calm',
                                })
                              }
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(day.dateStr, task.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botão de abrir detalhes no calendário */}
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => onSelectDateForDetail(day.dateStr)}
                  className="w-full text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 py-1 rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Abrir Dia</span>
                  <CatPawIcon size={10} color="#6366f1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
