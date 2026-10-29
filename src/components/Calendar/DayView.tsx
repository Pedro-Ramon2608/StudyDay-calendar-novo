import React, { useState, useEffect } from 'react';
import { DayPlan, Task, TaskPriority } from '../../types';
import { formatFriendlyDate, getTodayString } from '../../utils/dateUtils';
import { ProgressBar } from '../Common/ProgressBar';
import { LinkManager } from '../Common/LinkManager';
import { CatPriorityBadge } from '../Cat/CatPriorityBadge';
import { CatPrioritySelector } from '../Cat/CatPrioritySelector';
import { CatPawIcon } from '../Cat/CatIcon';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  BookOpen,
  CalendarDays,
  ListTodo,
  Check,
  Edit2,
  Sparkles,
  X,
  AlignLeft,
} from 'lucide-react';

interface DayViewProps {
  date: string;
  plan: DayPlan;
  onSetSubject: (subject: string) => void;
  onSetNotes: (notes: string) => void;
  onAddTask: (title: string, description?: string, priority?: TaskPriority) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string, newTitle: string, newDescription?: string, priority?: TaskPriority) => void;
  onAddLink: (title: string, url: string) => void;
  onDeleteLink: (linkId: string) => void;
  onJumpToToday?: () => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  plan,
  onSetSubject,
  onSetNotes,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onAddLink,
  onDeleteLink,
  onJumpToToday,
}) => {
  // Inputs de nova tarefa
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('calm');
  const [showAddTaskDetails, setShowAddTaskDetails] = useState(false);

  // Tema e Descrição do Dia
  const [subjectInput, setSubjectInput] = useState(plan.subject || '');
  const [descriptionInput, setDescriptionInput] = useState(plan.notes || '');

  // Estado de edição de tarefa existente
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingPriority, setEditingPriority] = useState<TaskPriority>('calm');

  // Sincroniza inputs quando a data selecionada mudar
  useEffect(() => {
    setSubjectInput(plan.subject || '');
    setDescriptionInput(plan.notes || '');
    setEditingTaskId(null);
    setShowAddTaskDetails(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('calm');
  }, [date, plan.subject, plan.notes]);

  const handleSubjectBlur = () => {
    if (subjectInput !== plan.subject) {
      onSetSubject(subjectInput.trim());
    }
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleDescriptionBlur = () => {
    if (descriptionInput !== (plan.notes || '')) {
      onSetNotes(descriptionInput.trim());
    }
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), newTaskDescription.trim() || undefined, newTaskPriority);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('calm');
    setShowAddTaskDetails(false);
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description || '');
    setEditingPriority(task.priority || 'calm');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTitle('');
    setEditingDescription('');
    setEditingPriority('calm');
  };

  const saveEditTask = (taskId: string) => {
    if (editingTitle.trim()) {
      onEditTask(
        taskId,
        editingTitle.trim(),
        editingDescription.trim() || undefined,
        editingPriority
      );
    }
    cancelEditTask();
  };

  const totalTasks = plan.tasks.length;
  const completedTasks = plan.tasks.filter((t) => t.completed).length;
  const isToday = date === getTodayString();
  const allDone = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
      {/* Header do Dia */}
      <div className="border-b border-slate-100 pb-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rotina do Dia
              </span>
              <CatPawIcon size={13} color="#f472b6" />
              {isToday && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Hoje <CatPawIcon size={10} color="#6366f1" />
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{formatFriendlyDate(date)}</span>
              {allDone && <CatPawIcon size={18} color="#10b981" />}
            </h1>
          </div>

          {!isToday && onJumpToToday && (
            <button
              type="button"
              onClick={onJumpToToday}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Ir para Hoje</span>
              <CatPawIcon size={12} color="#6366f1" />
            </button>
          )}
        </div>
      </div>

      {/* Matéria / Tema Principal do Dia */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Matéria ou Tema Principal</span>
          <CatPawIcon size={12} color="#f472b6" />
        </label>
        <div className="relative">
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value)}
            onBlur={handleSubjectBlur}
            onKeyDown={handleSubjectKeyDown}
            placeholder="Ex.: POO e Polimorfismo, Cálculo II, Algoritmos..."
            className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Área Dedicada para a Descrição e Objetivos do Dia */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Descrição & Objetivos do Dia</span>
            <CatPawIcon size={12} color="#f472b6" />
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Salvo no banco de dados</span>
            <CatPawIcon size={10} color="#a5b4fc" />
          </span>
        </div>
        <textarea
          rows={2}
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Descreva o que você pretende aprender ou revisar hoje, metas específicas, dúvidas ou anotações importantes..."
          className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y leading-relaxed"
        />
      </div>

      {/* Checklist de Tarefas com Gatinhos de Prioridade */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <ListTodo className="w-3.5 h-3.5 text-slate-400" />
            <span>Checklist de Tarefas</span>
            <CatPawIcon size={13} color="#f472b6" />
            <span className="text-slate-400 font-mono tabular-nums">({completedTasks}/{totalTasks})</span>
          </div>

          {allDone && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Todas as tarefas concluídas!</span>
              <CatPawIcon size={13} color="#10b981" />
            </span>
          )}
        </div>

        {/* Barra de Progresso */}
        <ProgressBar total={totalTasks} completed={completedTasks} />

        {/* Formulário para Nova Tarefa */}
        <form onSubmit={handleAddTaskSubmit} className="space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Adicionar tarefa para este dia... (Pressione Enter)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowAddTaskDetails(!showAddTaskDetails)}
              className={`px-3 py-2 text-xs border rounded-xl transition-colors font-medium shrink-0 flex items-center gap-1.5 ${
                showAddTaskDetails || newTaskDescription
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Prioridade do gatinho e detalhes"
            >
              <CatPawIcon size={14} color="#6366f1" />
              <span>Prioridade</span>
            </button>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium rounded-xl inline-flex items-center gap-1 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>

          {/* Painel opcional com Prioridade do Gatinho e Descrição da Tarefa */}
          {showAddTaskDetails && (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <CatPrioritySelector
                value={newTaskPriority}
                onChange={setNewTaskPriority}
                size="md"
              />

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Descrição ou detalhes da tarefa (opcional):
                </label>
                <textarea
                  rows={2}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Ex.: Resolver exercícios ímpares da pág. 45, assistir até minuto 20..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </form>

        {/* Lista de Tarefas do Dia */}
        <div className="space-y-2 pt-1">
          {plan.tasks.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-1.5">
                <CatPawIcon size={18} color="#94a3b8" />
              </div>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <span>Nenhuma tarefa cadastrada para {isToday ? 'hoje' : 'este dia'}.</span>
                <CatPawIcon size={12} color="#ec4899" />
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Digite acima para listar o que você precisa estudar ou praticar.
              </p>
            </div>
          ) : (
            plan.tasks.map((task) => {
              const isEditing = editingTaskId === task.id;

              if (isEditing) {
                // Modo de Edição Completa da Tarefa
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl border border-indigo-300 bg-indigo-50/40 space-y-3 shadow-xs animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        Editar Tarefa
                      </span>
                      <button
                        type="button"
                        onClick={cancelEditTask}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Título da Tarefa *
                      </label>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Descrição / Detalhes (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="Adicione detalhes, páginas, instruções..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                      />
                    </div>

                    {/* Seletor de Prioridade do Gatinho */}
                    <CatPrioritySelector
                      value={editingPriority}
                      onChange={setEditingPriority}
                      size="sm"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEditTask}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditTask(task.id)}
                        disabled={!editingTitle.trim()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                );
              }

              // Visualização Padrão da Tarefa
              return (
                <div
                  key={task.id}
                  className={`group flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-slate-50/70 border-slate-200/60 text-slate-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 flex items-center justify-center p-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors shrink-0"
                    aria-label={task.completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        onClick={() => onToggleTask(task.id)}
                        className={`text-xs sm:text-sm cursor-pointer select-none font-medium ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Badge de Prioridade do Gatinho */}
                      <CatPriorityBadge
                        priority={task.completed ? 'done' : task.priority || 'calm'}
                        size="xs"
                        onClick={() => startEditTask(task)}
                      />
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs leading-relaxed break-words ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar tarefa e prioridade"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Links do Dia (Reutilizando LinkManager) */}
      <div className="border-t border-slate-100 pt-4">
        <LinkManager
          links={plan.links}
          onAddLink={(title, url) => onAddLink(title, url)}
          onDeleteLink={(linkId) => onDeleteLink(linkId)}
          title="Links & Materiais Deste Dia"
          placeholderTitle="Ex.: Videoaula 04, PDF do Capítulo 2, Docs Oficial"
          emptyMessage="Nenhum link ou vídeo anexado para a aula de hoje."
        />
      </div>
    </div>
  );
};
