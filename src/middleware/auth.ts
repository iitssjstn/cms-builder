import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { SessionData } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: SessionData;
      session: any;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.session.userId);
  
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Sessie ongeldig' });
  }
  
  req.user = {
    userId: user.id,
    email: user.email,
    currentProjectId: req.session.currentProjectId || null
  };
  
  next();
}

export function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = parseInt(req.params.projectId || req.body.projectId || req.query.projectId, 10);
  
  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({ error: 'Project ID vereist' });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  
  const db = getDb();
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, req.user.userId);
  
  if (!project) {
    return res.status(404).json({ error: 'Project niet gevonden' });
  }
  
  req.session.currentProjectId = projectId;
  next();
}
