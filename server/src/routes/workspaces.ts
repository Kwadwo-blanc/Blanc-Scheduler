import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { Workspace } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const userId = req.user!.id;

  const workspaces = db.all<Workspace>(
    `SELECT w.*, wm.role as user_role
     FROM workspaces w
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     ORDER BY w.created_at ASC`,
    userId
  );

  res.json({ workspaces });
});

router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const { name, description } = req.body;
  const userId = req.user!.id;

  if (!name) {
    res.status(400).json({ error: 'Workspace name is required' });
    return;
  }

  const id = uuidv4();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id.slice(0, 6)}`;
  const db = getDB();

  db.transaction(() => {
    db.run(
      `INSERT INTO workspaces (id, name, slug, owner_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      name,
      slug,
      userId,
      description ?? null
    );

    db.run(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role)
       VALUES (?, ?, ?, 'owner')`,
      uuidv4(),
      id,
      userId
    );
  });

  const created = db.get<Workspace>('SELECT * FROM workspaces WHERE id = ?', id);
  res.status(201).json({ workspace: created });
});

router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const workspace = db.get<Workspace>('SELECT * FROM workspaces WHERE id = ?', req.params.id);

  if (!workspace) {
    res.status(404).json({ error: 'Workspace not found' });
    return;
  }

  const members = db.all(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, u.role as user_title, wm.role as workspace_role
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ?`,
    workspace.id
  );

  res.json({ workspace, members });
});

export default router;
