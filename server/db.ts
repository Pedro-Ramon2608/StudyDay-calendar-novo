import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { AppStorageState, DayPlan, FutureTask, UsefulLink, User } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Interface comum para o repositório de dados
interface IDatabaseAdapter {
  init(): Promise<void>;
  findUserByEmail(email: string): Promise<(User & { password_hash: string }) | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  createUser(name: string, email: string, passwordHash: string): Promise<User>;
  createSession(userId: string): Promise<string>;
  getUserByToken(token: string): Promise<User | null>;
  deleteSession(token: string): Promise<void>;
  getUserStudyState(userId: string): Promise<AppStorageState>;
  saveUserStudyState(userId: string, state: AppStorageState): Promise<void>;
  isPostgres: boolean;
}

// -------------------------------------------------------------
// ADAPTER 1: SQLITE (Execução Local / Padrão)
// -------------------------------------------------------------
class SQLiteAdapter implements IDatabaseAdapter {
  private db: Database.Database;
  public isPostgres = false;

  constructor() {
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.resolve(dataDir, 'studyday.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async init(): Promise<void> {
    this.db.exec(`
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

    // Seed do usuário demo
    const testEmail = 'teste@gmail.com';
    const existing = this.db.prepare('SELECT id FROM users WHERE email = ?').get(testEmail);
    if (!existing) {
      const testUserId = 'user-demo-1';
      const hashedPw = hashPassword('1234teste');
      this.db.prepare(`
        INSERT INTO users (id, name, email, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(testUserId, 'Estudante StudyDay', testEmail, hashedPw, Date.now());

      this.seedSampleDataForUser(testUserId);
    }
  }

  private seedSampleDataForUser(userId: string) {
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
      { id: 'link-1', title: 'Documentação Oficial do React Hooks', url: 'https://react.dev/reference/react' },
      { id: 'link-2', title: 'TypeScript Handbook - Generics & Interfaces', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
    ];

    this.db.prepare(`
      INSERT INTO day_plans (id, user_id, date, subject, notes, tasks_json, links_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `dp-${userId}-${today}`,
      userId,
      today,
      'Arquitetura de Estudos & Pomodoro',
      'Focar em sessões de 40 minutos com descansos de 5 minutos.',
      JSON.stringify(sampleTasks),
      JSON.stringify(sampleLinks),
      Date.now()
    );

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
      this.db.prepare(`
        INSERT INTO future_tasks (id, user_id, title, description, completed, priority, links_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(ft.id, userId, ft.title, ft.description, ft.completed, ft.priority, JSON.stringify(ft.links), ft.createdAt);
    }

    const sampleGlobalLinks = [
      { id: 'gl-1', title: 'LeetCode', url: 'https://leetcode.com' },
      { id: 'gl-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
      { id: 'gl-3', title: 'Roadmap.sh', url: 'https://roadmap.sh' },
      { id: 'gl-4', title: 'GitHub', url: 'https://github.com' },
    ];

    for (const gl of sampleGlobalLinks) {
      this.db.prepare(`
        INSERT INTO global_links (id, user_id, title, url, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(gl.id, userId, gl.title, gl.url, Date.now());
    }
  }

  async findUserByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
    const row = this.db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email) as
      | (User & { password_hash: string })
      | undefined;
    return row;
  }

  async findUserById(id: string): Promise<User | undefined> {
    const row = this.db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as User | undefined;
    return row;
  }

  async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, email, passwordHash, Date.now());
    return { id, name, email };
  }

  async createSession(userId: string): Promise<string> {
    const token = generateToken();
    this.db.prepare(`
      INSERT INTO sessions (token, user_id, created_at)
      VALUES (?, ?, ?)
    `).run(token, userId, Date.now());
    return token;
  }

  async getUserByToken(token: string): Promise<User | null> {
    const row = this.db.prepare(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      INNER JOIN sessions s ON s.user_id = u.id 
      WHERE s.token = ?
    `).get(token) as User | undefined;
    return row || null;
  }

  async deleteSession(token: string): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  async getUserStudyState(userId: string): Promise<AppStorageState> {
    const dayPlanRows = this.db.prepare(`
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

    const futureRows = this.db.prepare(`
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

    const linkRows = this.db.prepare(`
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

    return { dayPlans, futureTasks, globalLinks };
  }

  async saveUserStudyState(userId: string, state: AppStorageState): Promise<void> {
    const transaction = this.db.transaction(() => {
      for (const [date, plan] of Object.entries(state.dayPlans || {})) {
        const planId = `dp-${userId}-${date}`;
        this.db.prepare(`
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

      this.db.prepare('DELETE FROM future_tasks WHERE user_id = ?').run(userId);
      const insertFuture = this.db.prepare(`
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

      this.db.prepare('DELETE FROM global_links WHERE user_id = ?').run(userId);
      const insertLink = this.db.prepare(`
        INSERT INTO global_links (id, user_id, title, url, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const gl of state.globalLinks || []) {
        insertLink.run(gl.id, userId, gl.title, gl.url, Date.now());
      }
    });

    transaction();
  }
}

// -------------------------------------------------------------
// ADAPTER 2: POSTGRESQL (Para Render / Supabase / Neon na Nuvem)
// Persistente mesmo com Spin Down gratuito!
// -------------------------------------------------------------
class PostgresAdapter implements IDatabaseAdapter {
  private pool: pg.Pool;
  public isPostgres = true;

  constructor(connectionString: string) {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    this.pool = new pg.Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS day_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        tasks_json TEXT NOT NULL DEFAULT '[]',
        links_json TEXT NOT NULL DEFAULT '[]',
        updated_at BIGINT NOT NULL,
        UNIQUE(user_id, date)
      );

      CREATE TABLE IF NOT EXISTS future_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        completed INT NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'calm',
        scheduled_date TEXT,
        links_json TEXT NOT NULL DEFAULT '[]',
        created_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS global_links (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);

    // Seed do usuário de teste caso não exista
    const testEmail = 'teste@gmail.com';
    const checkRes = await this.pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [testEmail]);
    if (checkRes.rows.length === 0) {
      const testUserId = 'user-demo-1';
      const hashedPw = hashPassword('1234teste');
      await this.pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [testUserId, 'Estudante StudyDay', testEmail, hashedPw, Date.now()]
      );

      // Seed de dia e tarefas de exemplo
      const today = new Date().toISOString().slice(0, 10);
      const sampleTasks = [
        {
          id: 'task-1',
          title: 'Estruturar tipos estritos e backend SQLite/Postgres',
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
        { id: 'link-1', title: 'Documentação Oficial do React Hooks', url: 'https://react.dev/reference/react' },
        { id: 'link-2', title: 'TypeScript Handbook - Generics & Interfaces', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
      ];

      await this.pool.query(
        `INSERT INTO day_plans (id, user_id, date, subject, notes, tasks_json, links_json, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, date) DO NOTHING`,
        [
          `dp-${testUserId}-${today}`,
          testUserId,
          today,
          'Arquitetura de Estudos & Pomodoro',
          'Focar em sessões de 40 minutos com descansos de 5 minutos.',
          JSON.stringify(sampleTasks),
          JSON.stringify(sampleLinks),
          Date.now(),
        ]
      );
    }
  }

  async findUserByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
    const res = await this.pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    return res.rows[0];
  }

  async findUserById(id: string): Promise<User | undefined> {
    const res = await this.pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return res.rows[0];
  }

  async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const id = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    await this.pool.query(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name.trim(), email.trim().toLowerCase(), passwordHash, Date.now()]
    );
    return { id, name: name.trim(), email: email.trim().toLowerCase() };
  }

  async createSession(userId: string): Promise<string> {
    const token = generateToken();
    await this.pool.query(
      `INSERT INTO sessions (token, user_id, created_at)
       VALUES ($1, $2, $3)`,
      [token, userId, Date.now()]
    );
    return token;
  }

  async getUserByToken(token: string): Promise<User | null> {
    const res = await this.pool.query(
      `SELECT u.id, u.name, u.email 
       FROM users u 
       INNER JOIN sessions s ON s.user_id = u.id 
       WHERE s.token = $1`,
      [token]
    );
    return res.rows[0] || null;
  }

  async deleteSession(token: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  async getUserStudyState(userId: string): Promise<AppStorageState> {
    const dayPlanRes = await this.pool.query(
      'SELECT date, subject, notes, tasks_json, links_json FROM day_plans WHERE user_id = $1',
      [userId]
    );

    const dayPlans: Record<string, DayPlan> = {};
    for (const row of dayPlanRes.rows) {
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

    const futureRes = await this.pool.query(
      `SELECT id, title, description, completed, priority, scheduled_date, links_json, created_at
       FROM future_tasks
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const futureTasks: FutureTask[] = futureRes.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      completed: Boolean(row.completed),
      priority: (row.priority as any) || 'calm',
      scheduledDate: row.scheduled_date || undefined,
      links: JSON.parse(row.links_json || '[]'),
      createdAt: Number(row.created_at),
    }));

    const linkRes = await this.pool.query(
      `SELECT id, title, url
       FROM global_links
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const globalLinks: UsefulLink[] = linkRes.rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
    }));

    return { dayPlans, futureTasks, globalLinks };
  }

  async saveUserStudyState(userId: string, state: AppStorageState): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert day plans
      for (const [date, plan] of Object.entries(state.dayPlans || {})) {
        const planId = `dp-${userId}-${date}`;
        await client.query(
          `INSERT INTO day_plans (id, user_id, date, subject, notes, tasks_json, links_json, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id, date) DO UPDATE SET
             subject = EXCLUDED.subject,
             notes = EXCLUDED.notes,
             tasks_json = EXCLUDED.tasks_json,
             links_json = EXCLUDED.links_json,
             updated_at = EXCLUDED.updated_at`,
          [
            planId,
            userId,
            date,
            plan.subject || '',
            plan.notes || '',
            JSON.stringify(plan.tasks || []),
            JSON.stringify(plan.links || []),
            Date.now(),
          ]
        );
      }

      // Replace future tasks
      await client.query('DELETE FROM future_tasks WHERE user_id = $1', [userId]);
      for (const ft of state.futureTasks || []) {
        await client.query(
          `INSERT INTO future_tasks (id, user_id, title, description, completed, priority, scheduled_date, links_json, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            ft.id,
            userId,
            ft.title,
            ft.description || null,
            ft.completed ? 1 : 0,
            ft.priority || 'calm',
            ft.scheduledDate || null,
            JSON.stringify(ft.links || []),
            ft.createdAt || Date.now(),
          ]
        );
      }

      // Replace global links
      await client.query('DELETE FROM global_links WHERE user_id = $1', [userId]);
      for (const gl of state.globalLinks || []) {
        await client.query(
          `INSERT INTO global_links (id, user_id, title, url, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [gl.id, userId, gl.title, gl.url, Date.now()]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

// Seleção do Adapter conforme variáveis de ambiente
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.INTERNAL_DATABASE_URL;

let adapter: IDatabaseAdapter;

if (databaseUrl) {
  console.log('📦 Inicializando banco de dados na nuvem (PostgreSQL com persistência permanente)...');
  adapter = new PostgresAdapter(databaseUrl);
} else {
  console.log('📁 Inicializando banco de dados local SQLite (data/studyday.db)...');
  adapter = new SQLiteAdapter();
}

// Inicializa tabelas
export const dbInitPromise = adapter.init().catch((err) => {
  console.error('Falha ao inicializar o banco de dados:', err);
});

export const isUsingPostgres = Boolean(databaseUrl);

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
  await dbInitPromise;
  return adapter.findUserByEmail(email);
}

export async function findUserById(id: string): Promise<User | undefined> {
  await dbInitPromise;
  return adapter.findUserById(id);
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<User> {
  await dbInitPromise;
  return adapter.createUser(name, email, passwordHash);
}

export async function createSession(userId: string): Promise<string> {
  await dbInitPromise;
  return adapter.createSession(userId);
}

export async function getUserByToken(token: string): Promise<User | null> {
  await dbInitPromise;
  return adapter.getUserByToken(token);
}

export async function deleteSession(token: string): Promise<void> {
  await dbInitPromise;
  return adapter.deleteSession(token);
}

export async function getUserStudyState(userId: string): Promise<AppStorageState> {
  await dbInitPromise;
  return adapter.getUserStudyState(userId);
}

export async function saveUserStudyState(userId: string, state: AppStorageState): Promise<void> {
  await dbInitPromise;
  return adapter.saveUserStudyState(userId, state);
}
