import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { SessionData as AppUser } from '../types';

// Eigen velden toevoegen aan express-session's SessionData i.p.v. req.session
// zelf te overschrijven met 'any' (dat botste met express-session's eigen typing).
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    email?: string;
    currentProjectId?: number | null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- vereist patroon om Express.Request uit te breiden
  namespace Express {
    interface Request {
      user?: AppUser;
      page?: { id: number; project_id: number };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  
  const db = getDb();
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.session.userId) as { id: number; email: string } | undefined;
  
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

/**
 * Controleert dat de pagina in de URL (:pageId) bestaat en bij een project
 * van de ingelogde gebruiker hoort. Zet req.page met het gevonden project_id
 * zodat routes daarna niet opnieuw hoeven te joinen.
 */
export function requirePageAccess(req: Request, res: Response, next: NextFunction) {
  const pageId = parseInt(req.params.pageId, 10);

  if (!pageId || isNaN(pageId)) {
    return res.status(400).json({ error: 'Pagina ID vereist' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }

  const db = getDb();
  const page = db.prepare(`
    SELECT pg.id, pg.project_id
    FROM pages pg
    JOIN projects p ON p.id = pg.project_id
    WHERE pg.id = ? AND p.user_id = ?
  `).get(pageId, req.user.userId) as { id: number; project_id: number } | undefined;

  if (!page) {
    return res.status(404).json({ error: 'Pagina niet gevonden' });
  }

  req.page = page;
  next();
}
