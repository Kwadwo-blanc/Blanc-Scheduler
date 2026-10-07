import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { WorkContinuityEngine } from '../engine/continuityEngine.js';
import { getDB } from '../db/index.js';

const router = Router();
router.use(requireAuth);

// GET /api/continuity/resume-points ("Continue Where You Left Off" data feed)
router.get('/resume-points', (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const workspaceId = req.query.workspaceId as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

  const continuityEngine = WorkContinuityEngine.getInstance();
  const items = continuityEngine.getContinueWhereYouLeftOff(userId, workspaceId, limit);

  res.json({ resumePoints: items });
});

// POST /api/continuity/sessions/start
router.post('/sessions/start', (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const { taskId } = req.body;

  if (!taskId) {
    res.status(400).json({ error: 'taskId is required' });
    return;
  }

  const continuityEngine = WorkContinuityEngine.getInstance();
  const session = continuityEngine.startSession(taskId, userId);
  const db = getDB();
  const task = db.get('SELECT * FROM tasks WHERE id = ?', taskId);
  const resumePoint = db.get('SELECT * FROM resume_points WHERE task_id = ?', taskId);

  res.status(201).json({ session, task, resumePoint });
});

// POST /api/continuity/sessions/:id/pause
router.post('/sessions/:id/pause', (req: AuthenticatedRequest, res: Response): void => {
  const sessionId = req.params.id as string;
  const { stoppingContext, manualNextAction } = req.body;

  const continuityEngine = WorkContinuityEngine.getInstance();
  try {
    const result = continuityEngine.pauseSession(sessionId, stoppingContext, manualNextAction);
    const db = getDB();
    const task = db.get('SELECT * FROM tasks WHERE id = ?', result.session.task_id);

    res.json({
      session: result.session,
      resumePoint: result.resumePoint,
      task
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/continuity/override
router.post('/override', (req: AuthenticatedRequest, res: Response): void => {
  const { taskId, checkpointTitle, stoppingContext, nextRecommendedAction } = req.body;

  if (!taskId || !checkpointTitle) {
    res.status(400).json({ error: 'taskId and checkpointTitle are required' });
    return;
  }

  const continuityEngine = WorkContinuityEngine.getInstance();
  const resumePoint = continuityEngine.overrideResumePoint(
    taskId,
    checkpointTitle,
    stoppingContext,
    nextRecommendedAction
  );

  res.json({ resumePoint });
});

// GET /api/continuity/sessions
router.get('/sessions', (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const db = getDB();
  const sessions = db.all(
    `SELECT cs.*, t.title as task_title 
     FROM continuity_sessions cs
     JOIN tasks t ON cs.task_id = t.id
     WHERE cs.user_id = ?
     ORDER BY cs.started_at DESC
     LIMIT 20`,
    userId
  );

  res.json({ sessions });
});

export default router;
