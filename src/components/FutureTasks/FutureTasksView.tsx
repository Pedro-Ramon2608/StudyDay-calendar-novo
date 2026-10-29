import React, { useState } from 'react';
import { FutureTask, UsefulLink, TaskPriority } from '../../types';
import { LinkManager } from '../Common/LinkManager';
import { ScheduleModal } from './ScheduleModal';
import { formatFriendlyDate, normalizeUrl } from '../../utils/dateUtils';
import { CatPriorityBadge } from '../Cat/CatPriorityBadge';
import { CatPrioritySelector } from '../Cat/CatPrioritySelector';
import { CatPawIcon } from '../Cat/CatIcon';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Search,
  BookmarkCheck,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface FutureTasksViewProps {
  futureTasks: FutureTask[];
  globalLinks: UsefulLink[];
  onAddFutureTask: (data: {
    title: string;
    description?: string;
    scheduledDate?: string;
    priority?: TaskPriority;
    links?: UsefulLink[];
  }) => void;
  onToggleFutureTask: (id: string) => void;
  onDeleteFutureTask: (id: string) => void;
  onUpdateFutureTask: (id: string, partial: Partial<FutureTask>) => void;
  onAddFutureTaskLink: (taskId: string, title: string, url: string) => void;
  onDeleteFutureTaskLink: (taskId: string, linkId: string) => void;
  onScheduleFutureTask: (
    futureTaskId: string,
    targetDate: string,
    options?: { removeFromFuture?: boolean }
  ) => void;
  onAddGlobalLink: (title: string, url: string) => void;
  onDeleteGlobalLink: (id: string) => void;
}

export const FutureTasksView: React.FC<FutureTasksViewProps> = ({
  futureTasks,
  globalLinks,
  onAddFutureTask,
  onToggleFutureTask,
  onDeleteFutureTask,
  onUpdateFutureTask,
  onAddFutureTaskLink,
  onDeleteFutureTaskLink,
  onScheduleFutureTask,
  onAddGlobalLink,
  onDeleteGlobalLink,
}) => {
  // Estado para adicionar nova meta
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('calm');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Estado para editar meta existente
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingPriority, setEditingPriority] = useState<TaskPriority>('calm');

  // Filtros e busca
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Agendamento
  const [schedulingTask, setSchedulingTask] = useState<FutureTask | null>(null);

  // Expandir links por item
  const [expandedTaskLinks, setExpandedTaskLinks] = useState<Record<string, boolean>>({});

  // Input para adicionar link direto a uma meta existente
  const [addingLinkToTaskId, setAddingLinkToTaskId] = useState<string | null>(null);
  const [inlineLinkTitle, setInlineLinkTitle] = useState('');
  const [inlineLinkUrl, setInlineLinkUrl] = useState('');

  const toggleLinksExpanded = (taskId: string) => {
    setExpandedTaskLinks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const links: UsefulLink[] = [];
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      links.push({
        id: `fl-${Date.now()}`,
        title: newLinkTitle.trim(),
        url: normalizeUrl(newLinkUrl),
      });
    }

    onAddFutureTask({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      links,
    });

    setNewTitle('');
    setNewDescription('');
    setNewPriority('calm');
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddingTask(false);
  };

  const handleInlineAddLink = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLinkTitle.trim() || !inlineLinkUrl.trim()) return;
    onAddFutureTaskLink(taskId, inlineLinkTitle.trim(), inlineLinkUrl.trim());
    setInlineLinkTitle('');
    setInlineLinkUrl('');
    setAddingLinkToTaskId(null);
    setExpandedTaskLinks((prev) => ({ ...prev, [taskId]: true }));
  };

  // Filtragem
  const filteredTasks = futureTasks.filter((task) => {
    if (filter === 'pending' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchLink = task.links?.some(
        (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchLink) return false;
    }
    return true;
  });

  const pendingCount = futureTasks.filter((t) => !t.completed).length;
  const completedCount = futureTasks.filter((t) => t.completed).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
      {/* Coluna Principal: Backlog de Metas e Estudos Futuros (8 colunas) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Painel do Backlog */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
          {/* Cabeçalho */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Metas & Backlog de Estudos</span>
                  <CatPawIcon size={16} color="#6366f1" />
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Metas no seu horizonte: registre tópicos que deseja dominar e agende-os para o calendário quando estiver pronto.
              </p>
            </div>

            {!isAddingTask && (
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Meta Futura</span>
              </button>
            )}
          </div>

          {/* Formulário de Adicionar Meta */}
          {isAddingTask && (
            <form
              onSubmit={handleCreateTask}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 animate-in fade-in duration-150"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cadastrar Meta de Estudo
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  O que você planeja estudar? *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Fazer curso de Docker, Entender Árvores Binárias (BST), Aprender GraphQL"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  Descrição ou Objetivos (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex.: Assistir aos módulos de docker-compose e fazer laboratório prático com 2 serviços..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Seletor de Prioridade do Gatinho */}
              <CatPrioritySelector
                value={newPriority}
                onChange={setNewPriority}
                size="md"
              />

              {/* Anexar primeiro link (opcional) */}
              <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2">
                <span className="block text-xs font-medium text-slate-600">
                  Link do Curso / Material de Apoio (opcional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Título (ex.: Curso Udemy Docker)"
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          )}

          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs self-start">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({futureTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  filter === 'pending'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Em Aberto ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
                  filter === 'completed'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Concluídas ({completedCount})
              </button>
            </div>

            {/* Campo de Busca */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar metas ou links..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Lista de Metas Futuras */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <CatPawIcon size={22} color="#94a3b8" />
                </div>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <span>
                    {futureTasks.length === 0
                      ? 'Seu backlog está livre!'
                      : 'Nenhuma meta encontrada para este filtro.'}
                  </span>
                  <CatPawIcon size={14} color="#f472b6" />
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Adicione tópicos que você deseja aprender nos próximos meses para não esquecer referências e cursos.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const hasLinks = task.links && task.links.length > 0;
                const isExpanded = expandedTaskLinks[task.id];
                const isAddingLink = addingLinkToTaskId === task.id;
                const isEditing = editingTaskId === task.id;

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-indigo-300 bg-indigo-50/40 space-y-3 shadow-xs animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          Editar Meta Futura
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditingTitle('');
                            setEditingDescription('');
                          }}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Título da Meta *
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
                          Descrição / Objetivos (opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Adicione detalhes adicionais ou tópicos de estudo..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
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
                          onClick={() => {
                            setEditingTaskId(null);
                            setEditingTitle('');
                            setEditingDescription('');
                          }}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editingTitle.trim()) {
                              onUpdateFutureTask(task.id, {
                                title: editingTitle.trim(),
                                description: editingDescription.trim() || undefined,
                                priority: editingPriority,
                              });
                            }
                            setEditingTaskId(null);
                            setEditingTitle('');
                            setEditingDescription('');
                          }}
                          disabled={!editingTitle.trim()}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      task.completed
                        ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox de Conclusão */}
                      <button
                        type="button"
                        onClick={() => onToggleFutureTask(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors shrink-0"
                        aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                        )}
                      </button>

                      {/* Conteúdo da Meta */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            onClick={() => onToggleFutureTask(task.id)}
                            className={`text-sm sm:text-base font-semibold cursor-pointer ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Badge de Prioridade do Gatinho */}
                          <CatPriorityBadge
                            priority={task.completed ? 'done' : task.priority || 'calm'}
                            size="xs"
                          />

                          {task.scheduledDate && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3" />
                              Agendado: {formatFriendlyDate(task.scheduledDate)}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Metadados e Ações Rápidas */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                          {/* Botão de Agendar para o Calendário */}
                          <button
                            type="button"
                            onClick={() => setSchedulingTask(task)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Agendar no Calendário</span>
                          </button>

                          {/* Toggle Links */}
                          <button
                            type="button"
                            onClick={() => toggleLinksExpanded(task.id)}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {hasLinks
                                ? `${task.links.length} link(s) anexados`
                                : 'Anexar links'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Ações: Editar e Excluir Meta */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTaskId(task.id);
                            setEditingTitle(task.title);
                            setEditingDescription(task.description || '');
                            setEditingPriority(task.priority || 'calm');
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar meta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteFutureTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir meta do backlog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Área Expandida de Links Anexados à Meta */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 pl-8 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Cursos e Referências Desta Meta
                          </span>
                          {!isAddingLink && (
                            <button
                              type="button"
                              onClick={() => setAddingLinkToTaskId(task.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Adicionar link
                            </button>
                          )}
                        </div>

                        {/* Formulário inline para novo link na meta */}
                        {isAddingLink && (
                          <form
                            onSubmit={(e) => handleInlineAddLink(task.id, e)}
                            className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={inlineLinkTitle}
                                onChange={(e) => setInlineLinkTitle(e.target.value)}
                                placeholder="Título (ex.: Playlist YouTube)"
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={inlineLinkUrl}
                                onChange={(e) => setInlineLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-[11px]"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setAddingLinkToTaskId(null)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded text-[11px]"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-indigo-600 text-white rounded font-medium text-[11px]"
                              >
                                Anexar Link
                              </button>
                            </div>
                          </form>
                        )}

                        {hasLinks ? (
                          <div className="space-y-1.5">
                            {task.links.map((link) => (
                              <div
                                key={link.id}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs hover:bg-white transition-colors"
                              >
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 truncate"
                                  title={link.url}
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate font-medium">{link.title}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => onDeleteFutureTaskLink(task.id, link.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Remover link"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          !isAddingLink && (
                            <p className="text-xs text-slate-400 italic">
                              Nenhum link anexado a esta meta ainda.
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Coluna Lateral: Mural de Links e Cursos Rápidos (4 colunas) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Mural de Links & Cursos</span>
                <CatPawIcon size={14} color="#f472b6" />
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Atalhos rápidos para as plataformas e referências que você mais frequenta na sua rotina de estudos.
            </p>
          </div>

          <LinkManager
            links={globalLinks}
            onAddLink={onAddGlobalLink}
            onDeleteLink={onDeleteGlobalLink}
            title="Atalhos Gerais"
            placeholderTitle="Ex.: LeetCode, Portal Aluno, Alura, GitHub"
            placeholderUrl="https://..."
            emptyMessage="Nenhum atalho salvo. Adicione suas ferramentas favoritas!"
          />
        </div>

        {/* Mascote Card com imagem do gatinho */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-pink-50/40 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-xs p-1 border border-indigo-100 shrink-0 overflow-hidden">
              <img
                src="/public/assets/aistudio/WhatsApp_Image_2026-10-28_at_23.00.58_152122ae.jpeg"
                alt="Mascote StudyDay"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 flex items-center gap-1">
                <span>Dica dos Gatinhos</span>
                <CatPawIcon size={14} color="#f472b6" />
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Defina prioridades com gatinhos vermelhos para o que for urgente e deixe o azul para tarefas leves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      {schedulingTask && (
        <ScheduleModal
          task={schedulingTask}
          isOpen={true}
          onClose={() => setSchedulingTask(null)}
          onConfirm={(targetDate, removeFromFuture) => {
            onScheduleFutureTask(schedulingTask.id, targetDate, { removeFromFuture });
          }}
        />
      )}
    </div>
  );
};
