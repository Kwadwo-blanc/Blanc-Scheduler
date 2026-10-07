import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { SchedulingEngine } from '../engine/schedulingEngine.js';

const router = Router();
router.use(requireAuth);

// GET /api/scheduler/day?workspaceId=...&date=YYYY-MM-DD
router.get('/day', (req: AuthenticatedRequest, res: Response): void => {
  const workspaceId = (req.query.workspaceId as string) || '';
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const scheduler = SchedulingEngine.getInstance();
  const dayView = scheduler.getDayView(workspaceId, dateStr);

  res.json({ dayView });
});

// GET /api/scheduler/week?workspaceId=...&startDate=YYYY-MM-DD
router.get('/week', (req: AuthenticatedRequest, res: Response): void => {
  const workspaceId = (req.query.workspaceId as string) || '';
  const startDateStr = (req.query.startDate as string) || new Date().toISOString().split('T')[0];

  const scheduler = SchedulingEngine.getInstance();
  const weekView = scheduler.getWeekView(workspaceId, startDateStr);

  res.json({ weekView });
});

// GET /api/scheduler/agenda?workspaceId=...
router.get('/agenda', (req: AuthenticatedRequest, res: Response): void => {
  const workspaceId = (req.query.workspaceId as string) || '';
  const scheduler = SchedulingEngine.getInstance();
  const agenda = scheduler.getAgendaView(workspaceId);

  res.json({ agenda });
});

// GET /api/scheduler/dependencies/:taskId
router.get('/dependencies/:taskId', (req: AuthenticatedRequest, res: Response): void => {
  const scheduler = SchedulingEngine.getInstance();
  const check = scheduler.checkDependencies(req.params.taskId as string);

  res.json(check);
});

export default router;
