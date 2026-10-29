/**
 * StudyDay - Data Model & Type Definitions
 */

export type TaskPriority = 'urgent' | 'alert' | 'calm' | 'done';

export interface PriorityInfo {
  key: TaskPriority;
  label: string;
  catColor: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  description: string;
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityInfo> = {
  urgent: {
    key: 'urgent',
    label: 'Urgente',
    catColor: '#ef4444', // Vermelho
    badgeBg: 'bg-red-50',
    badgeBorder: 'border-red-200',
    textColor: 'text-red-700',
    description: 'Gatinho Vermelho · Prioridade Máxima',
  },
  alert: {
    key: 'alert',
    label: 'Alerta',
    catColor: '#f97316', // Laranja
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    textColor: 'text-orange-700',
    description: 'Gatinho Laranja · Requer Atenção',
  },
  calm: {
    key: 'calm',
    label: 'Tranquilo',
    catColor: '#3b82f6', // Azul
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Gatinho Azul · No seu tempo',
  },
  done: {
    key: 'done',
    label: 'Concluído',
    catColor: '#10b981', // Verde
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Gatinho Verde · Tarefa Finalizada',
  },
};

// Entidade de Links Úteis (reutilizável)
export interface UsefulLink {
  id: string;
  title: string;
  url: string;
}

// Entidade de Tarefa individual
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: TaskPriority;
  createdAt: number;
}

// Plano do Dia (vinculado a uma data 'YYYY-MM-DD')
export interface DayPlan {
  date: string;
  subject: string;
  notes?: string;
  tasks: Task[];
  links: UsefulLink[];
}

// Tarefas Futuras (Backlog / Metas que ainda não têm data fixa ou estão no horizonte)
export interface FutureTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: TaskPriority;
  scheduledDate?: string;
  links: UsefulLink[];
  createdAt: number;
}

// Usuário da aplicação
export interface User {
  id: string;
  name: string;
  email: string;
}

// Estado global de estudos de um usuário
export interface AppStorageState {
  dayPlans: Record<string, DayPlan>; // chave 'YYYY-MM-DD'
  futureTasks: FutureTask[];
  globalLinks: UsefulLink[];
}

// Configurações do Pomodoro
export interface PomodoroSettings {
  focusMinutes: number; // padrão 40
  breakMinutes: number; // padrão 5
}

// Tipos de Navegação Principal
export type ActiveTab = 'calendar' | 'week' | 'pomodoro' | 'future';
