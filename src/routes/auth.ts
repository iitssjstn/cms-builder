import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { hashPassword, verifyPassword } from '../utils/password';
import { setupSchema, loginSchema } from '../utils/validation';
import { authRateLimit } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Check setup status
router.get('/setup/status', (req: Request, res: Response) => {
  const db = getDb();
  const setup = db.prepare('SELECT completed FROM setup_status WHERE id = 1').get() as { completed: number } | undefined;
  res.json({ setupCompleted: setup?.completed === 1 });
});

// Initial admin setup
router.post('/setup', authRateLimit, async (req: Request, res: Response) => {
  const db = getDb();
  
  const setup = db.prepare('SELECT completed FROM setup_status WHERE id = 1').get() as { completed: number } | undefined;
  if (setup?.completed === 1) {
    return res.status(400).json({ error: 'Setup al voltooid' });
  }
  
  const parseResult = setupSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }
  
  const { email, password } = parseResult.data;
  
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'E-mailadres bestaat al' });
  }
  
  const passwordHash = await hashPassword(password);
  
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash);
  
  db.prepare('UPDATE setup_status SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = 1').run();
  
  req.session.userId = result.lastInsertRowid as number;
  req.session.email = email;
  
  res.json({ success: true, message: 'Admin account aangemaakt' });
});

// Login
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }
  
  const { email, password } = parseResult.data;
  const db = getDb();
  
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as { id: number; email: string; password_hash: string } | undefined;
  
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Ongeldige inloggegevens' });
  }
  
  req.session.userId = user.id;
  req.session.email = user.email;
  
  res.json({ success: true, user: { id: user.id, email: user.email } });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Uitloggen mislukt' });
    }
    res.clearCookie('wb_session');
    res.json({ success: true });
  });
});

// Current user
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// CSRF token endpoint
router.get('/csrf-token', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

export default router;
