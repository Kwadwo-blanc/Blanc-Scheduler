import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { Project, Task } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const workspaceId = req.query.workspaceId as string;

  let query = 'SELECT * FROM projects WHERE 1=1';
  const params: any[] = [];

  if (workspaceId) {
    query += ' AND workspace_id = ?';
    params.push(workspaceId);
  }

  query += ' ORDER BY created_at DESC';
  const projects = db.all<Project>(query, ...params);

  res.json({ projects });
});

router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const { workspace_id, name, description, color = '#6366f1', target_end_date } = req.body;
  const userId = req.user!.id;

  if (!workspace_id || !name) {
    res.status(400).json({ error: 'workspace_id and name are required' });
    return;
  }

  const id = uuidv4();
  const db = getDB();

  db.transaction(() => {
    db.run(
      `INSERT INTO projects (id, workspace_id, name, description, color, target_end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      id,
      workspace_id,
      name,
      description ?? null,
      color,
      target_end_date ?? null
    );

    db.run(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES (?, ?, ?, 'owner')`,
      uuidv4(),
      id,
      userId
    );
  });

  const created = db.get<Project>('SELECT * FROM projects WHERE id = ?', id);
  res.status(201).json({ project: created });
});

router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const project = db.get<Project>('SELECT * FROM projects WHERE id = ?', req.params.id);

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const tasks = db.all<Task>(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY scheduled_start ASC',
    project.id
  );

  const materials = db.all(
    'SELECT * FROM learning_materials WHERE project_id = ?',
    project.id
  );

  res.json({ project, tasks, materials });
});

export default router;
