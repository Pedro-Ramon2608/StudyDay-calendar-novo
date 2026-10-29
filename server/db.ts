import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AppStorageState, DayPlan, FutureTask, UsefulLink, User } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'studyday.db');
const db = new Database(dbPath);

// Habilita chaves estrangeiras e modo WAL para alta performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criação das tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS day_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    tasks_json TEXT NOT NULL DEFAULT '[]',
    links_json TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS future_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'calm',
    scheduled_date TEXT,
    links_json TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS global_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Seed da conta de teste padrão caso não exista
const testUserEmail = 'teste@gmail.com';
const existingTestUser = db.prepare('SELECT id FROM users WHERE email = ?').get(testUserEmail) as { id: string } | undefined;

if (!existingTestUser) {
  const testUserId = 'user-demo-1';
  const hashedPw = hashPassword('1234teste');
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(testUserId, 'Estudante StudyDay', testUserEmail, hashedPw, Date.now());

  // Dados iniciais com gatinhos para a conta de teste
  const today = new Date().toISOString().slice(0, 10);
  const sampleTasks = [
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
  ];

  const sampleLinks = [
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
  ];

  db.prepare(`
    INSERT INTO day_plans (id, user_id, date, subject, notes, tasks_json, links_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `dp-${testUserId}-${today}`,
    testUserId,
    today,
    'Arquitetura de Estudos & Pomodoro',
    'Focar em sessões de 40 minutos com descansos de 5 minutos.',
    JSON.stringify(sampleTasks),
    JSON.stringify(sampleLinks),
    Date.now()
  );

  // Metas futuras de exemplo
  const sampleFutureTasks = [
    {
      id: 'ft-1',
      title: 'Fazer curso de Docker e Containers',
      description: 'Aprender a criar Dockerfile, volumes e docker-compose.',
      completed: 0,
      priority: 'urgent',
      links: [{ id: 'link-f1', title: 'Guia Oficial Docker', url: 'https://docs.docker.com' }],
      createdAt: Date.now() - 40000000,
    },
    {
      id: 'ft-2',
      title: 'Entender Árvores Binárias de Busca (BST)',
      description: 'Praticar percursos in-order e resolver exercícios no LeetCode.',
      completed: 0,
      priority: 'alert',
      links: [{ id: 'link-f2', title: 'LeetCode Tree Tag', url: 'https://leetcode.com/tag/tree/' }],
      createdAt: Date.now() - 30000000,
    },
    {
      id: 'ft-3',
      title: 'Aprofundar em Web Performance e Core Web Vitals',
      description: 'Dominar métricas LCP, CLS e INP.',
      completed: 0,
      priority: 'calm',
      links: [{ id: 'link-f3', title: 'web.dev Performance', url: 'https://web.dev/learn/performance/' }],
      createdAt: Date.now() - 20000000,
    },
  ];

  for (const ft of sampleFutureTasks) {
    db.prepare(`
      INSERT INTO future_tasks (id, user_id, title, description, completed, priority, links_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ft.id, testUserId, ft.title, ft.description, ft.completed, ft.priority, JSON.stringify(ft.links), ft.createdAt);
  }

  // Links globais de exemplo
  const sampleGlobalLinks = [
    { id: 'gl-1', title: 'LeetCode', url: 'https://leetcode.com' },
    { id: 'gl-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
    { id: 'gl-3', title: 'Roadmap.sh', url: 'https://roadmap.sh' },
    { id: 'gl-4', title: 'GitHub', url: 'https://github.com' },
  ];

  for (const gl of sampleGlobalLinks) {
    db.prepare(`
      INSERT INTO global_links (id, user_id, title, url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(gl.id, testUserId, gl.title, gl.url, Date.now());
  }
}

// Helpers de autenticação
export function findUserByEmail(email: string): (User & { password_hash: string }) | undefined {
  const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email) as
    | (User & { password_hash: string })
    | undefined;
  return row;
}

export function findUserById(id: string): User | undefined {
  const row = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as User | undefined;
  return row;
}

export function createUser(name: string, email: string, passwordHash: string): User {
  const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, email, passwordHash, Date.now());

  return { id, name, email };
}

export function createSession(userId: string): string {
  const token = generateToken();
  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at)
    VALUES (?, ?, ?)
  `).run(token, userId, Date.now());
  return token;
}

export function getUserByToken(token: string): User | null {
  const row = db.prepare(`
    SELECT u.id, u.name, u.email 
    FROM users u 
    INNER JOIN sessions s ON s.user_id = u.id 
    WHERE s.token = ?
  `).get(token) as User | undefined;
  return row || null;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Helpers do estado do usuário
export function getUserStudyState(userId: string): AppStorageState {
  // Day plans
  const dayPlanRows = db.prepare(`
    SELECT date, subject, notes, tasks_json, links_json
    FROM day_plans
    WHERE user_id = ?
  `).all(userId) as Array<{
    date: string;
    subject: string;
    notes: string;
    tasks_json: string;
    links_json: string;
  }>;

  const dayPlans: Record<string, DayPlan> = {};
  for (const row of dayPlanRows) {
    try {
      dayPlans[row.date] = {
        date: row.date,
        subject: row.subject,
        notes: row.notes,
        tasks: JSON.parse(row.tasks_json || '[]'),
        links: JSON.parse(row.links_json || '[]'),
      };
    } catch {
      dayPlans[row.date] = {
        date: row.date,
        subject: row.subject,
        notes: row.notes,
        tasks: [],
        links: [],
      };
    }
  }

  // Future tasks
  const futureRows = db.prepare(`
    SELECT id, title, description, completed, priority, scheduled_date, links_json, created_at
    FROM future_tasks
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Array<{
    id: string;
    title: string;
    description: string | null;
    completed: number;
    priority: string;
    scheduled_date: string | null;
    links_json: string;
    created_at: number;
  }>;

  const futureTasks: FutureTask[] = futureRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    completed: Boolean(row.completed),
    priority: (row.priority as any) || 'calm',
    scheduledDate: row.scheduled_date || undefined,
    links: JSON.parse(row.links_json || '[]'),
    createdAt: row.created_at,
  }));

  // Global links
  const linkRows = db.prepare(`
    SELECT id, title, url
    FROM global_links
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Array<{
    id: string;
    title: string;
    url: string;
  }>;

  const globalLinks: UsefulLink[] = linkRows.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
  }));

  return {
    dayPlans,
    futureTasks,
    globalLinks,
  };
}

export function saveUserStudyState(userId: string, state: AppStorageState): void {
  const transaction = db.transaction(() => {
    // Upsert day plans
    for (const [date, plan] of Object.entries(state.dayPlans || {})) {
      const planId = `dp-${userId}-${date}`;
      db.prepare(`
        INSERT INTO day_plans (id, user_id, date, subject, notes, tasks_json, links_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET
          subject = excluded.subject,
          notes = excluded.notes,
          tasks_json = excluded.tasks_json,
          links_json = excluded.links_json,
          updated_at = excluded.updated_at
      `).run(
        planId,
        userId,
        date,
        plan.subject || '',
        plan.notes || '',
        JSON.stringify(plan.tasks || []),
        JSON.stringify(plan.links || []),
        Date.now()
      );
    }

    // Replace future tasks
    db.prepare('DELETE FROM future_tasks WHERE user_id = ?').run(userId);
    const insertFuture = db.prepare(`
      INSERT INTO future_tasks (id, user_id, title, description, completed, priority, scheduled_date, links_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ft of state.futureTasks || []) {
      insertFuture.run(
        ft.id,
        userId,
        ft.title,
        ft.description || null,
        ft.completed ? 1 : 0,
        ft.priority || 'calm',
        ft.scheduledDate || null,
        JSON.stringify(ft.links || []),
        ft.createdAt || Date.now()
      );
    }

    // Replace global links
    db.prepare('DELETE FROM global_links WHERE user_id = ?').run(userId);
    const insertLink = db.prepare(`
      INSERT INTO global_links (id, user_id, title, url, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const gl of state.globalLinks || []) {
      insertLink.run(gl.id, userId, gl.title, gl.url, Date.now());
    }
  });

  transaction();
}
