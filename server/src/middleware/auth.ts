import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/index.js';
import { User, WorkspaceRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'continuum_super_secure_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
}

export function generateToken(user: { id: string; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
}

export function requireWorkspaceRole(allowedRoles: WorkspaceRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    const workspaceId = req.params.workspaceId || req.body.workspace_id || req.query.workspaceId;

    if (!userId || !workspaceId) {
      res.status(400).json({ error: 'Workspace ID and authenticated user required' });
      return;
    }

    const db = getDB();
    const membership = db.get<{ role: WorkspaceRole }>(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      workspaceId,
      userId
    );

    if (!membership || !allowedRoles.includes(membership.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient workspace permissions' });
      return;
    }

    next();
  };
}
