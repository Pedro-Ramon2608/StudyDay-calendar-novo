import { useState, useEffect, useCallback, useRef } from 'react';
import { AppStorageState, DayPlan, FutureTask, UsefulLink, Task, TaskPriority } from '../types';
import { getTodayString, formatDateString, normalizeUrl } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

const LEGACY_STORAGE_KEY = 'studyday_app_storage_v2';

function getStorageKey(userId?: string) {
  return userId ? `studyday_storage_user_${userId}` : 'studyday_storage_guest';
}

function getInitialGuestData(): AppStorageState {
  const today = getTodayString();
  return {
    dayPlans: {
      [today]: {
        date: today,
        subject: 'Bem-vindo ao StudyDay! 🐱',
        notes: 'Crie uma conta para sincronizar suas tarefas na nuvem ou use o modo convidado neste navegador.',
        tasks: [
          {
            id: 'demo-task-1',
            title: 'Experimentar o StudyDay (Modo Convidado)',
            description: 'Você pode adicionar tarefas, usar o Pomodoro de 40 minutos e marcar itens como concluídos.',
            completed: false,
            priority: 'calm',
            createdAt: Date.now() - 1000000,
          },
        ],
        links: [
          {
            id: 'demo-link-1',
            title: 'Dica: Crie uma conta no botão Entrar / Conta',
            url: 'https://github.com',
          },
        ],
      },
    },
    futureTasks: [
      {
        id: 'demo-ft-1',
        title: 'Criar minha conta gratuita no StudyDay',
        description: 'Assim suas tarefas ficam salvas no banco de dados e sincronizadas em qualquer dispositivo!',
        completed: false,
        priority: 'urgent',
        links: [],
        createdAt: Date.now() - 500000,
      },
    ],
    globalLinks: [
      { id: 'demo-gl-1', title: 'Roadmap de Estudos', url: 'https://roadmap.sh' },
    ],
  };
}

function loadLocalData(userId?: string): AppStorageState {
  const key = getStorageKey(userId);
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as AppStorageState;
      if (parsed && typeof parsed === 'object' && parsed.dayPlans && Array.isArray(parsed.futureTasks)) {
        return parsed;
      }
    }

    // Se for guest e não tiver dados, tenta migrar o legado se existir
    if (!userId) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy) as AppStorageState;
        if (parsedLegacy && typeof parsedLegacy === 'object' && parsedLegacy.dayPlans) {
          return parsedLegacy;
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao ler cache local:', e);
  }
  return userId ? { dayPlans: {}, futureTasks: [], globalLinks: [] } : getInitialGuestData();
}

export function useStudyStorage() {
  const { user, token } = useAuth();

  const [state, setState] = useState<AppStorageState>(() => loadLocalData(user?.id));
  const [lastCompletedTaskTitle, setLastCompletedTaskTitle] = useState<string>('');
  const [pawTriggerCount, setPawTriggerCount] = useState<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<string | undefined>(user?.id);

  // Quando o usuário muda (login / logout / troca de conta)
  useEffect(() => {
    const prevUserId = currentUserIdRef.current;
    currentUserIdRef.current = user?.id;

    if (prevUserId !== user?.id) {
      // Carrega dados da conta nova ou do guest
      const initialUserCache = loadLocalData(user?.id);
      setState(initialUserCache);
    }

    // Se logado, busca os dados mais recentes do servidor
    if (token && user?.id) {
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
              const key = getStorageKey(user?.id);
              localStorage.setItem(key, JSON.stringify(serverState));
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar dados do servidor:', err);
        }
      }

      fetchServerState();
      return () => {
        isMounted = false;
      };
    }
  }, [token, user?.id]);

  // Salva no localStorage e no servidor quando o estado muda
  useEffect(() => {
    const key = getStorageKey(user?.id);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar no cache local:', e);
    }

    // Se estiver logado, sincroniza com o banco de dados (PostgreSQL/SQLite)
    if (token && user?.id) {
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
          console.warn('Erro ao salvar no banco de dados:', err);
        }
      }, 400);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, token, user?.id]);

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
    const initial = getInitialGuestData();
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
