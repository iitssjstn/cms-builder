import express, { Request, Response } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import connectSqlite3 from 'connect-sqlite3';
import { config } from './config';
import { getDb, getOrCreateSecret } from './db';
import { securityMiddleware, cspNonceMiddleware } from './middleware/security';
import { globalRateLimit } from './middleware/rateLimit';
import { csrfProtection, csrfErrorHandler } from './middleware/csrf';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import pageRoutes from './routes/pages';
import blockRoutes from './routes/blocks';
import mediaRoutes from './routes/media';
import navigationRoutes from './routes/navigation';
import settingsRoutes from './routes/settings';
import previewRoutes from './routes/preview';

const app = express();
const SQLiteStore = connectSqlite3(session);

// Trust proxy voor secure cookies achter proxy
app.set('trust proxy', 1);

// Security headers
app.use(securityMiddleware);
app.use(cspNonceMiddleware);

// Health checks (bewust vóór session/csrf: een liveness/readiness-check moet
// niet kunnen falen enkel omdat de sessie-database traag of niet klaar is)
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

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parsing (vereist door csurf's cookie-modus hieronder: zonder
// cookie-parser is req.cookies altijd undefined en faalt elke request met
// "misconfigured csrf")
app.use(cookieParser());

// Global rate limiting
app.use(globalRateLimit);

// Session
const sessionStore = new SQLiteStore({
  db: 'sessions',
  dir: './data'
});

const sessionSecret = getOrCreateSecret('session_secret');

app.use(session({
  name: config.sessionName,
  secret: sessionSecret,
  store: sessionStore as unknown as session.Store,
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
app.use(csrfProtection as express.RequestHandler);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', pageRoutes);
app.use('/api/pages', blockRoutes);
app.use('/api/projects', mediaRoutes);
app.use('/api/projects', navigationRoutes);
app.use('/api/projects', settingsRoutes);
app.use('/preview', previewRoutes);

// Static files
app.use(express.static('public'));

// SPA fallback voor admin
app.get('/', (req: Request, res: Response) => {
  res.sendFile('admin/index.html', { root: 'public' });
});

app.get('/admin/*', (req: Request, res: Response) => {
  res.sendFile('admin/index.html', { root: 'public' });
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Niet gevonden' });
});

// Error handler
app.use(csrfErrorHandler);
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Interne serverfout' });
});

export default app;