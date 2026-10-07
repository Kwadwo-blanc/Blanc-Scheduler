import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { LearningMaterial } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const { taskId, projectId } = req.query;

  let query = 'SELECT * FROM learning_materials WHERE 1=1';
  const params: any[] = [];

  if (taskId) {
    query += ' AND task_id = ?';
    params.push(taskId);
  }
  if (projectId) {
    query += ' AND project_id = ?';
    params.push(projectId);
  }

  query += ' ORDER BY created_at DESC';
  const materials = db.all<LearningMaterial>(query, ...params);

  res.json({ materials });
});

router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const { task_id, project_id, title, resource_type = 'doc', url, metadata = {} } = req.body;
  const userId = req.user!.id;

  if (!title) {
    res.status(400).json({ error: 'Material title is required' });
    return;
  }

  const id = uuidv4();
  const db = getDB();

  db.run(
    `INSERT INTO learning_materials (id, task_id, project_id, uploader_id, title, resource_type, url, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    task_id ?? null,
    project_id ?? null,
    userId,
    title,
    resource_type,
    url ?? null,
    JSON.stringify(metadata)
  );

  const created = db.get<LearningMaterial>('SELECT * FROM learning_materials WHERE id = ?', id);
  res.status(201).json({ material: created });
});

export default router;
