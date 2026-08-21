import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { config } from './config';
import { getDb } from './db';
import { securityMiddleware, cspNonceMiddleware } from './middleware/security';
import { globalRateLimit, authRateLimit } from './middleware/rateLimit';
import { csrfProtection, csrfErrorHandler } from './middleware/csrf';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';

const app = express();
const SQLiteStore = connectSqlite3(session);

// Trust proxy voor secure cookies achter proxy
app.set('trust proxy', 1);

// Security headers
app.use(securityMiddleware);
app.use(cspNonceMiddleware);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting
app.use(globalRateLimit);

// Session
const sessionStore = new SQLiteStore({
  db: 'sessions',
  dir: './data'
});

app.use(session({
  name: config.sessionName,
  secret: 'secret-is-in-database-not-env', // Placeholder, wordt overschreven door session store
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.forceSecureCookie,
    sameSite: 'lax',
    maxAge: config.sessionMaxAge
  }
}));

// CSRF protection (na session)
app.use(csrfProtection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Health checks
app.get('/healthz', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/readyz', (req: Request, res: Response) => {
  try {
    getDb().prepare('SELECT 1').get();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

// Static files
app.use(express.static('public'));

// SPA fallback voor admin
app.get('/admin/*', (req: Request, res: Response) => {
  res.sendFile('admin/index.html', { root: 'public' });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Niet gevonden' });
});

// Error handler
app.use(csrfErrorHandler);
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Interne serverfout' });
});

export default app;
