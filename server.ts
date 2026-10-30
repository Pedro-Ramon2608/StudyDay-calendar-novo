import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  findUserByEmail,
  hashPassword,
  createUser,
  createSession,
  getUserByToken,
  deleteSession,
  getUserStudyState,
  saveUserStudyState,
} from './server/db';
import { User } from './src/types';

// Detecta se PostgreSQL está configurado via variáveis de ambiente
const isUsingPostgres = Boolean(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.INTERNAL_DATABASE_URL
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
  }

  const token = authHeader.slice(7).trim();
  try {
    const user = await getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Erro na validação do token:', err);
    return res.status(500).json({ error: 'Erro ao validar sessão.' });
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Endpoint de status do sistema e banco de dados
  app.get('/api/system/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: isUsingPostgres ? 'postgresql_cloud' : 'sqlite_local',
      persistent: isUsingPostgres,
      timestamp: Date.now(),
    });
  });

  // === ROTAS DE AUTENTICAÇÃO ===

  // Cadastro de novo usuário
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name).trim();

      const existing = await findUserByEmail(cleanEmail);
      if (existing) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      const passwordHash = hashPassword(String(password));
      const user = await createUser(cleanName, cleanEmail, passwordHash);
      const token = await createSession(user.id);

      return res.status(201).json({ user, token });
    } catch (err) {
      console.error('Erro no registro:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
  });

  // Login com e-mail e senha
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Informe e-mail e senha.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const user = await findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos. Verifique os dados ou crie uma nova conta.' });
      }

      const passwordHash = hashPassword(String(password));
      if (user.password_hash !== passwordHash) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const token = await createSession(user.id);
      return res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro ao autenticar.' });
    }
  });

  // Perfil do usuário atual
  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  // Logout
  app.post('/api/auth/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.token) {
        await deleteSession(req.token);
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('Erro no logout:', err);
      return res.status(500).json({ error: 'Erro ao deslogar.' });
    }
  });

  // === ROTAS DE DADOS DE ESTUDOS ===

  // Obter estado de estudos do usuário logado
  app.get('/api/study/state', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const state = await getUserStudyState(userId);
      return res.json(state);
    } catch (err) {
      console.error('Erro ao ler estado do estudo:', err);
      return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
  });

  // Salvar estado de estudos do usuário logado
  app.put('/api/study/state', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const newState = req.body;
      await saveUserStudyState(userId, newState);
      return res.json({ success: true });
    } catch (err) {
      console.error('Erro ao salvar estado:', err);
      return res.status(500).json({ error: 'Erro ao salvar dados.' });
    }
  });

  // === VITE / STATIC MIDDLEWARES ===
  app.use('/public', express.static(path.resolve(__dirname, 'public')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use('/public', express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StudyDay server listening at http://0.0.0.0:${PORT} (${isUsingPostgres ? 'PostgreSQL' : 'SQLite'})`);
  });
}

startServer();
