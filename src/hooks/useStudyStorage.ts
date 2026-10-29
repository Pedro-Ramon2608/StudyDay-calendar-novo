import { useState, useEffect, useCallback, useRef } from 'react';
import { AppStorageState, DayPlan, FutureTask, UsefulLink, Task, TaskPriority } from '../types';
import { getTodayString, formatDateString, normalizeUrl } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'studyday_app_storage_v2';

function getInitialFallbackData(): AppStorageState {
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  return {
    dayPlans: {
      [today]: {
        date: today,
        subject: 'Arquitetura de Estudos & Pomodoro',
        notes: 'Focar em sessões de 40 minutos com descansos de 5 minutos.',
        tasks: [
          {
            id: 'task-1',
            title: 'Estruturar tipos estritos e backend SQLite',
            description: 'Garantir que os dados do usuário sincronizem em qualquer dispositivo.',
            completed: true,
            priority: 'done',
            createdAt: Date.now() - 3600000,
          },
          {
            id: 'task-2',
            title: 'Configurar cronômetro Pomodoro (40m foco / 5m descanso)',
            description: 'Adicionar feedback de som suave e controles de tempo personalizáveis.',
            completed: true,
            priority: 'urgent',
            createdAt: Date.now() - 2500000,
          },
          {
            id: 'task-3',
            title: 'Organizar quadro de tarefas da semana atual',
            description: 'Ver tudo o que precisa ser feito de segunda a domingo de relance.',
            completed: false,
            priority: 'alert',
            createdAt: Date.now() - 1200000,
          },
        ],
        links: [
          {
            id: 'link-1',
            title: 'Documentação Oficial do React Hooks',
            url: 'https://react.dev/reference/react',
          },
          {
            id: 'link-2',
            title: 'TypeScript Handbook - Generics & Interfaces',
            url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
          },
        ],
      },
      [yesterdayStr]: {
        date: yesterdayStr,
        subject: 'Estruturas de Dados e Algoritmos Básicos',
        notes: 'Conceitos de tempo de complexidade O(n) e pilhas.',
        tasks: [
          {
            id: 'task-y1',
            title: 'Revisar Pilhas (Stacks) e Filas (Queues)',
            description: 'Praticar conceitos fundamentais.',
            completed: true,
            priority: 'done',
            createdAt: Date.now() - 90000000,
          },
          {
            id: 'task-y2',
            title: 'Implementar fila circular em TypeScript',
            completed: true,
            priority: 'done',
            createdAt: Date.now() - 85000000,
          },
        ],
        links: [
          {
            id: 'link-y1',
            title: 'Visualgo - Animação de Estruturas de Dados',
            url: 'https://visualgo.net/en',
          },
        ],
      },
    },
    futureTasks: [
      {
        id: 'ft-1',
        title: 'Fazer curso de Docker e Containers',
        description: 'Aprender a criar Dockerfile, gerenciar volumes e compor serviços.',
        completed: false,
        priority: 'urgent',
        links: [
          {
            id: 'link-f1',
            title: 'Guia Inicial Docker Docs',
            url: 'https://docs.docker.com/get-started/',
          },
        ],
        createdAt: Date.now() - 40000000,
      },
      {
        id: 'ft-2',
        title: 'Entender Árvores Binárias de Busca (BST)',
        description: 'Praticar percursos in-order, pre-order e resolver exercícios no LeetCode.',
        completed: false,
        priority: 'alert',
        links: [
          {
            id: 'link-f2',
            title: 'LeetCode - Tree Problems',
            url: 'https://leetcode.com/tag/tree/',
          },
        ],
        createdAt: Date.now() - 30000000,
      },
      {
        id: 'ft-3',
        title: 'Aprofundar em Web Performance e Core Web Vitals',
        description: 'Dominar métricas LCP, CLS, INP e técnicas de compressão.',
        completed: false,
        priority: 'calm',
        links: [
          {
            id: 'link-f3',
            title: 'web.dev - Performance Guide',
            url: 'https://web.dev/learn/performance/',
          },
        ],
        createdAt: Date.now() - 20000000,
      },
    ],
    globalLinks: [
      { id: 'gl-1', title: 'LeetCode', url: 'https://leetcode.com' },
      { id: 'gl-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
      { id: 'gl-3', title: 'Roadmap.sh - Trilhas de Estudo', url: 'https://roadmap.sh' },
      { id: 'gl-4', title: 'GitHub Repositories', url: 'https://github.com' },
    ],
  };
}

export function useStudyStorage() {
  const { user, token } = useAuth();

  const [state, setState] = useState<AppStorageState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppStorageState;
        if (parsed && typeof parsed === 'object' && parsed.dayPlans && Array.isArray(parsed.futureTasks)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do localStorage:', e);
    }
    return getInitialFallbackData();
  });

  const [lastCompletedTaskTitle, setLastCompletedTaskTitle] = useState<string>('');
  const [pawTriggerCount, setPawTriggerCount] = useState<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincroniza dados com o banco de dados remoto quando o usuário logar
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function fetchServerState() {
      try {
        const res = await fetch('/api/study/state', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const serverState = await res.json();
          if (isMounted && serverState && serverState.dayPlans) {
            setState(serverState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do banco de dados:', err);
      }
    }

    fetchServerState();
    return () => {
      isMounted = false;
    };
  }, [token, user?.id]);

  // Salva no banco de dados e no localStorage a cada alteração
  useEffect(() => {
    // Salva no localStorage imediatamente
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }

    // Se estiver autenticado, salva no banco de dados SQLite com pequeno debounce
    if (token) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/study/state', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(state),
          });
        } catch (err) {
          console.warn('Erro ao persistir no banco de dados:', err);
        }
      }, 400);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, token]);

  // Recupera o plano de um dia (ou template vazio)
  const getDayPlan = useCallback(
    (date: string): DayPlan => {
      if (state.dayPlans[date]) {
        return state.dayPlans[date];
      }
      return {
        date,
        subject: '',
        notes: '',
        tasks: [],
        links: [],
      };
    },
    [state.dayPlans]
  );

  // Atualiza campo do plano do dia
  const updateDayPlan = useCallback((date: string, updater: (prev: DayPlan) => DayPlan) => {
    setState((prev) => {
      const currentPlan: DayPlan = prev.dayPlans[date] || {
        date,
        subject: '',
        notes: '',
        tasks: [],
        links: [],
      };
      const updated = updater(currentPlan);
      return {
        ...prev,
        dayPlans: {
          ...prev.dayPlans,
          [date]: updated,
        },
      };
    });
  }, []);

  // Matéria/Tema do dia
  const setDaySubject = useCallback(
    (date: string, subject: string) => {
      updateDayPlan(date, (prev) => ({ ...prev, subject }));
    },
    [updateDayPlan]
  );

  // Notas / Descrição do dia
  const setDayNotes = useCallback(
    (date: string, notes: string) => {
      updateDayPlan(date, (prev) => ({ ...prev, notes }));
    },
    [updateDayPlan]
  );

  // Adicionar tarefa ao dia
  const addDayTask = useCallback(
    (date: string, title: string, description?: string, priority: TaskPriority = 'calm') => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: trimmed,
        description: description?.trim() || undefined,
        completed: false,
        priority,
        createdAt: Date.now(),
      };
      updateDayPlan(date, (prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
    },
    [updateDayPlan]
  );

  // Alternar conclusão de tarefa do dia com gatilho de patinha de gato
  const toggleDayTask = useCallback(
    (date: string, taskId: string) => {
      updateDayPlan(date, (prev) => {
        let taskCompletedNow = false;
        let taskTitle = '';

        const newTasks = prev.tasks.map((t) => {
          if (t.id === taskId) {
            const nextCompleted = !t.completed;
            if (nextCompleted) {
              taskCompletedNow = true;
              taskTitle = t.title;
            }
            return {
              ...t,
              completed: nextCompleted,
              // Se foi concluída, pode adotar gatinho verde 'done'
              priority: nextCompleted ? ('done' as TaskPriority) : t.priority === 'done' ? 'calm' : t.priority,
            };
          }
          return t;
        });

        if (taskCompletedNow) {
          setLastCompletedTaskTitle(taskTitle);
          setPawTriggerCount((c) => c + 1);
        }

        return {
          ...prev,
          tasks: newTasks,
        };
      });
    },
    [updateDayPlan]
  );

  // Remover tarefa do dia
  const deleteDayTask = useCallback(
    (date: string, taskId: string) => {
      updateDayPlan(date, (prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
    },
    [updateDayPlan]
  );

  // Editar tarefa do dia (título, descrição e prioridade)
  const editDayTask = useCallback(
    (date: string, taskId: string, newTitle: string, newDescription?: string, newPriority?: TaskPriority) => {
      const trimmed = newTitle.trim();
      if (!trimmed) return;
      updateDayPlan(date, (prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                title: trimmed,
                description: newDescription !== undefined ? newDescription.trim() || undefined : t.description,
                priority: newPriority !== undefined ? newPriority : t.priority,
              }
            : t
        ),
      }));
    },
    [updateDayPlan]
  );

  // Links do dia
  const addDayLink = useCallback(
    (date: string, title: string, url: string) => {
      const trimmedTitle = title.trim();
      const validUrl = normalizeUrl(url);
      if (!trimmedTitle || !validUrl) return;

      const newLink: UsefulLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: trimmedTitle,
        url: validUrl,
      };

      updateDayPlan(date, (prev) => ({
        ...prev,
        links: [...prev.links, newLink],
      }));
    },
    [updateDayPlan]
  );

  const deleteDayLink = useCallback(
    (date: string, linkId: string) => {
      updateDayPlan(date, (prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== linkId),
      }));
    },
    [updateDayPlan]
  );

  // === TAREFAS FUTURAS ===
  const addFutureTask = useCallback(
    (data: {
      title: string;
      description?: string;
      scheduledDate?: string;
      priority?: TaskPriority;
      links?: UsefulLink[];
    }) => {
      const trimmed = data.title.trim();
      if (!trimmed) return;

      const newTask: FutureTask = {
        id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: trimmed,
        description: data.description?.trim() || undefined,
        completed: false,
        priority: data.priority || 'calm',
        scheduledDate: data.scheduledDate || undefined,
        links: data.links || [],
        createdAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        futureTasks: [newTask, ...prev.futureTasks],
      }));
    },
    []
  );

  const toggleFutureTask = useCallback((id: string) => {
    setState((prev) => {
      let taskCompletedNow = false;
      let taskTitle = '';

      const updated = prev.futureTasks.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            taskCompletedNow = true;
            taskTitle = t.title;
          }
          return {
            ...t,
            completed: nextCompleted,
            priority: nextCompleted ? ('done' as TaskPriority) : t.priority === 'done' ? 'calm' : t.priority,
          };
        }
        return t;
      });

      if (taskCompletedNow) {
        setLastCompletedTaskTitle(taskTitle);
        setPawTriggerCount((c) => c + 1);
      }

      return {
        ...prev,
        futureTasks: updated,
      };
    });
  }, []);

  const deleteFutureTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      futureTasks: prev.futureTasks.filter((t) => t.id !== id),
    }));
  }, []);

  const updateFutureTask = useCallback((id: string, partial: Partial<FutureTask>) => {
    setState((prev) => ({
      ...prev,
      futureTasks: prev.futureTasks.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    }));
  }, []);

  const addFutureTaskLink = useCallback((taskId: string, title: string, url: string) => {
    const trimmedTitle = title.trim();
    const validUrl = normalizeUrl(url);
    if (!trimmedTitle || !validUrl) return;

    const newLink: UsefulLink = {
      id: `fl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      url: validUrl,
    };

    setState((prev) => ({
      ...prev,
      futureTasks: prev.futureTasks.map((t) =>
        t.id === taskId ? { ...t, links: [...(t.links || []), newLink] } : t
      ),
    }));
  }, []);

  const deleteFutureTaskLink = useCallback((taskId: string, linkId: string) => {
    setState((prev) => ({
      ...prev,
      futureTasks: prev.futureTasks.map((t) =>
        t.id === taskId ? { ...t, links: t.links.filter((l) => l.id !== linkId) } : t
      ),
    }));
  }, []);

  // Agendar tarefa futura no calendário
  const scheduleFutureTaskToCalendar = useCallback(
    (futureTaskId: string, targetDate: string, options?: { removeFromFuture?: boolean }) => {
      const futureTask = state.futureTasks.find((t) => t.id === futureTaskId);
      if (!futureTask) return;

      setState((prev) => {
        const targetPlan = prev.dayPlans[targetDate];
        const existingPlan: DayPlan = targetPlan
          ? {
              ...targetPlan,
              subject: targetPlan.subject || futureTask.title,
              tasks: [...targetPlan.tasks],
              links: [...targetPlan.links],
            }
          : {
              date: targetDate,
              subject: futureTask.title,
              notes: '',
              tasks: [],
              links: [],
            };

        const newDayTask: Task = {
          id: `task-sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: futureTask.title,
          description: futureTask.description || undefined,
          completed: false,
          priority: futureTask.priority || 'calm',
          createdAt: Date.now(),
        };

        const existingUrls = new Set(existingPlan.links.map((l) => l.url));
        const newLinksToCopy: UsefulLink[] = (futureTask.links || [])
          .filter((l) => !existingUrls.has(l.url))
          .map((l) => ({
            id: `link-copied-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: l.title,
            url: l.url,
          }));

        const updatedPlan: DayPlan = {
          ...existingPlan,
          subject: existingPlan.subject || futureTask.title,
          tasks: [...existingPlan.tasks, newDayTask],
          links: [...existingPlan.links, ...newLinksToCopy],
        };

        let updatedFutureTasks = prev.futureTasks;
        if (options?.removeFromFuture) {
          updatedFutureTasks = prev.futureTasks.filter((t) => t.id !== futureTaskId);
        } else {
          updatedFutureTasks = prev.futureTasks.map((t) =>
            t.id === futureTaskId ? { ...t, scheduledDate: targetDate } : t
          );
        }

        return {
          ...prev,
          dayPlans: {
            ...prev.dayPlans,
            [targetDate]: updatedPlan,
          },
          futureTasks: updatedFutureTasks,
        };
      });
    },
    [state.futureTasks]
  );

  // === LINKS GLOBAIS ===
  const addGlobalLink = useCallback((title: string, url: string) => {
    const trimmedTitle = title.trim();
    const validUrl = normalizeUrl(url);
    if (!trimmedTitle || !validUrl) return;

    const newLink: UsefulLink = {
      id: `gl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      url: validUrl,
    };

    setState((prev) => ({
      ...prev,
      globalLinks: [newLink, ...prev.globalLinks],
    }));
  }, []);

  const deleteGlobalLink = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      globalLinks: prev.globalLinks.filter((l) => l.id !== id),
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    const initial = getInitialFallbackData();
    setState(initial);
  }, []);

  const exportData = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `studyday_backup_${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [state]);

  const importData = useCallback((imported: AppStorageState) => {
    if (imported && typeof imported === 'object' && imported.dayPlans && Array.isArray(imported.futureTasks)) {
      setState(imported);
      return true;
    }
    return false;
  }, []);

  return {
    state,
    getDayPlan,
    updateDayPlan,
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
  };
}
