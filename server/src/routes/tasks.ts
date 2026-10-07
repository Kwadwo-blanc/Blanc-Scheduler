import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { Task, TaskWorkUnit } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { WorkContinuityEngine } from '../engine/continuityEngine.js';

const router = Router();
router.use(requireAuth);

// GET /api/tasks
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const userId = req.user!.id;
  const { workspaceId, projectId, status, category, priority } = req.query;

  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (workspaceId) {
    query += ' AND workspace_id = ?';
    params.push(workspaceId);
  } else {
    // If no workspace specified, return user's tasks
    query += ' AND (creator_id = ? OR assignee_id = ?)';
    params.push(userId, userId);
  }

  if (projectId) {
    query += ' AND project_id = ?';
    params.push(projectId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY scheduled_start ASC';

  const tasks = db.all<Task>(query, ...params);
  res.json({ tasks });
});

// GET /api/tasks/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const taskId = req.params.id as string;
  const task = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const workUnits = db.all<TaskWorkUnit>(
    'SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC',
    task.id
  );

  const resumePoint = db.get('SELECT * FROM resume_points WHERE task_id = ?', task.id);
  const learningMaterials = db.all('SELECT * FROM learning_materials WHERE task_id = ?', task.id);
  const sessions = db.all('SELECT * FROM continuity_sessions WHERE task_id = ? ORDER BY started_at DESC LIMIT 5', task.id);

  res.json({
    task,
    workUnits,
    resumePoint,
    learningMaterials,
    sessions
  });
});

// POST /api/tasks
router.post('/', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const userId = req.user!.id;
  const {
    workspace_id,
    project_id,
    title,
    description,
    priority = 'medium',
    category = 'study',
    scheduled_start,
    scheduled_end,
    estimated_minutes = 60,
    recurrence_rule,
    work_units = []
  } = req.body;

  if (!workspace_id || !title || !scheduled_start || !scheduled_end) {
    res.status(400).json({ error: 'workspace_id, title, scheduled_start, and scheduled_end are required' });
    return;
  }

  const taskId = uuidv4();

  db.transaction(() => {
    db.run(
      `INSERT INTO tasks (id, workspace_id, project_id, creator_id, assignee_id, title, description, priority, category, scheduled_start, scheduled_end, estimated_minutes, recurrence_rule, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      taskId,
      workspace_id,
      project_id ?? null,
      userId,
      userId,
      title,
      description ?? null,
      priority,
      category,
      scheduled_start,
      scheduled_end,
      estimated_minutes,
      recurrence_rule ?? null
    );

    // Insert work units if provided
    if (Array.isArray(work_units)) {
      work_units.forEach((u: any, idx: number) => {
        const uId = uuidv4();
        db.run(
          `INSERT INTO task_work_units (id, task_id, sequence_order, title, unit_type, status, estimated_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          uId,
          taskId,
          idx + 1,
          u.title,
          u.unit_type || 'subtask',
          idx === 0 ? 'in_progress' : 'pending',
          u.estimated_minutes || 15
        );
      });
    }

    // Initialize resume point
    const continuityEngine = WorkContinuityEngine.getInstance();
    continuityEngine.syncTaskContinuity(taskId);
  });

  const createdTask = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);
  const units = db.all<TaskWorkUnit>('SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC', taskId);
  const resumePoint = db.get('SELECT * FROM resume_points WHERE task_id = ?', taskId);

  res.status(201).json({
    task: createdTask,
    workUnits: units,
    resumePoint
  });
});

// PATCH /api/tasks/:id
router.patch('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const taskId = req.params.id as string;
  const updates = req.body;

  const task = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const allowedFields = ['title', 'description', 'priority', 'status', 'category', 'scheduled_start', 'scheduled_end', 'estimated_minutes', 'progress_pct'];
  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(taskId);
    db.run(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, ...params);
  }

  const continuityEngine = WorkContinuityEngine.getInstance();
  const resumePoint = continuityEngine.syncTaskContinuity(taskId);
  const updatedTask = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);

  res.json({ task: updatedTask, resumePoint });
});

// POST /api/tasks/:id/work-units
router.post('/:id/work-units', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const taskId = req.params.id as string;
  const { title, unit_type = 'subtask', estimated_minutes = 15 } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Work unit title is required' });
    return;
  }

  const lastSeq = db.get<{ maxSeq: number }>(
    'SELECT MAX(sequence_order) as maxSeq FROM task_work_units WHERE task_id = ?',
    taskId
  );
  const nextSeq = (lastSeq?.maxSeq || 0) + 1;
  const unitId = uuidv4();

  db.run(
    `INSERT INTO task_work_units (id, task_id, sequence_order, title, unit_type, status, estimated_minutes)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    unitId,
    taskId,
    nextSeq,
    title,
    unit_type,
    estimated_minutes
  );

  const continuityEngine = WorkContinuityEngine.getInstance();
  const resumePoint = continuityEngine.syncTaskContinuity(taskId);
  const units = db.all<TaskWorkUnit>('SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC', taskId);

  res.status(201).json({ workUnits: units, resumePoint });
});

// PATCH /api/tasks/:id/work-units/:unitId
router.patch('/:id/work-units/:unitId', (req: AuthenticatedRequest, res: Response): void => {
  const taskId = req.params.id as string;
  const unitId = req.params.unitId as string;
  const { status } = req.body;

  const continuityEngine = WorkContinuityEngine.getInstance();

  if (status === 'completed') {
    const resumePoint = continuityEngine.completeWorkUnit(taskId, unitId);
    const db = getDB();
    const task = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);
    const units = db.all<TaskWorkUnit>('SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC', taskId);
    res.json({ task, workUnits: units, resumePoint });
    return;
  }

  const db = getDB();
  db.run(
    'UPDATE task_work_units SET status = ? WHERE id = ? AND task_id = ?',
    status,
    unitId,
    taskId
  );

  const resumePoint = continuityEngine.syncTaskContinuity(taskId);
  const task = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);
  const units = db.all<TaskWorkUnit>('SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC', taskId);

  res.json({ task, workUnits: units, resumePoint });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  db.run('DELETE FROM tasks WHERE id = ?', req.params.id as string);
  res.json({ message: 'Task deleted successfully' });
});

export default router;
