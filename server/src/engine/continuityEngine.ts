import { getDB } from '../db/index.js';
import { Task, TaskWorkUnit, ResumePoint, ContinuitySession } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface ContinuityOverview {
  task: Task;
  resumePoint: ResumePoint;
  activeWorkUnit?: TaskWorkUnit;
  completedUnitsCount: number;
  totalUnitsCount: number;
  lastSession?: ContinuitySession;
}

export class WorkContinuityEngine {
  private static instance: WorkContinuityEngine | null = null;

  public static getInstance(): WorkContinuityEngine {
    if (!WorkContinuityEngine.instance) {
      WorkContinuityEngine.instance = new WorkContinuityEngine();
    }
    return WorkContinuityEngine.instance;
  }

  /**
   * Recalculates progress percentage and computes the optimal Resume Point.
   */
  public computeResumePoint(taskId: string): { progressPct: number; resumePoint: Partial<ResumePoint> } {
    const db = getDB();

    const task = db.get<Task>('SELECT * FROM tasks WHERE id = ?', taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const units = db.all<TaskWorkUnit>(
      'SELECT * FROM task_work_units WHERE task_id = ? ORDER BY sequence_order ASC',
      taskId
    );

    if (units.length === 0) {
      // Freeform task without granular work units
      const isCompleted = task.status === 'completed';
      const progress = isCompleted ? 100 : task.progress_pct;
      return {
        progressPct: progress,
        resumePoint: {
          task_id: taskId,
          checkpoint_title: isCompleted ? 'Task Completed' : (task.status === 'in_progress' ? 'In Progress' : 'Ready to Start'),
          next_recommended_action: isCompleted ? 'All items complete' : 'Begin task execution',
          is_ai_inferred: false
        }
      };
    }

    const completedUnits = units.filter(u => u.status === 'completed');
    const inProgressUnit = units.find(u => u.status === 'in_progress');
    const pendingUnits = units.filter(u => u.status === 'pending');

    const progressPct = Math.round((completedUnits.length / units.length) * 100);

    let activeUnit: TaskWorkUnit | undefined = inProgressUnit;
    let checkpointTitle = '';
    let nextAction = '';

    if (completedUnits.length === units.length) {
      checkpointTitle = 'All units completed';
      nextAction = 'Review results and mark task complete';
    } else if (inProgressUnit) {
      activeUnit = inProgressUnit;
      checkpointTitle = `Resume from ${inProgressUnit.title}`;
      nextAction = `Continue working on ${inProgressUnit.title}`;
    } else if (pendingUnits.length > 0) {
      const nextPending = pendingUnits[0];
      activeUnit = nextPending;
      checkpointTitle = `Next: ${nextPending.title}`;
      nextAction = `Start working on ${nextPending.title}`;
    } else {
      checkpointTitle = 'Ready for review';
      nextAction = 'Check remaining requirements';
    }

    return {
      progressPct,
      resumePoint: {
        task_id: taskId,
        active_unit_id: activeUnit ? activeUnit.id : undefined,
        checkpoint_title: checkpointTitle,
        next_recommended_action: nextAction,
        is_ai_inferred: false
      }
    };
  }

  /**
   * Updates task status, calculates progress, and stores the updated Resume Point.
   */
  public syncTaskContinuity(taskId: string, userStoppingNote?: string): ResumePoint {
    const db = getDB();
    const { progressPct, resumePoint } = this.computeResumePoint(taskId);

    return db.transaction(() => {
      // Update task progress and potentially status
      const currentTask = db.get<Task>('SELECT status FROM tasks WHERE id = ?', taskId);
      let newStatus = currentTask?.status;
      if (progressPct === 100) {
        newStatus = 'completed';
      } else if (progressPct > 0 && currentTask?.status === 'not_started') {
        newStatus = 'in_progress';
      }

      db.run(
        'UPDATE tasks SET progress_pct = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        progressPct,
        newStatus,
        taskId
      );

      // Upsert resume_points
      const existing = db.get<ResumePoint>('SELECT id FROM resume_points WHERE task_id = ?', taskId);
      const note = userStoppingNote ?? (existing ? existing.stopping_context : undefined);

      if (existing) {
        db.run(
          `UPDATE resume_points 
           SET active_unit_id = ?, 
               checkpoint_title = ?, 
               stopping_context = COALESCE(?, stopping_context), 
               next_recommended_action = ?, 
               is_ai_inferred = 0, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE task_id = ?`,
          resumePoint.active_unit_id ?? null,
          resumePoint.checkpoint_title,
          note ?? null,
          resumePoint.next_recommended_action,
          taskId
        );
      } else {
        db.run(
          `INSERT INTO resume_points (id, task_id, active_unit_id, checkpoint_title, stopping_context, next_recommended_action, is_ai_inferred)
           VALUES (?, ?, ?, ?, ?, ?, 0)`,
          uuidv4(),
          taskId,
          resumePoint.active_unit_id ?? null,
          resumePoint.checkpoint_title,
          note ?? null,
          resumePoint.next_recommended_action
        );
      }

      return db.get<ResumePoint>('SELECT * FROM resume_points WHERE task_id = ?', taskId)!;
    });
  }

  /**
   * Complete a single work unit (e.g. Exercise 1-6 completed)
   * Automatically advances the active unit to the next sequence item.
   */
  public completeWorkUnit(taskId: string, unitId: string): ResumePoint {
    const db = getDB();

    return db.transaction(() => {
      db.run(
        "UPDATE task_work_units SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND task_id = ?",
        unitId,
        taskId
      );

      // Find the next pending unit to mark in_progress
      const completedUnit = db.get<TaskWorkUnit>('SELECT sequence_order FROM task_work_units WHERE id = ?', unitId);
      if (completedUnit) {
        const nextUnit = db.get<TaskWorkUnit>(
          "SELECT id FROM task_work_units WHERE task_id = ? AND sequence_order > ? AND status = 'pending' ORDER BY sequence_order ASC LIMIT 1",
          taskId,
          completedUnit.sequence_order
        );
        if (nextUnit) {
          db.run("UPDATE task_work_units SET status = 'in_progress' WHERE id = ?", nextUnit.id);
        }
      }

      return this.syncTaskContinuity(taskId);
    });
  }

  /**
   * Start or resume an active continuity session with a live timer
   */
  public startSession(taskId: string, userId: string): ContinuitySession {
    const db = getDB();

    return db.transaction(() => {
      // Ensure task status is in_progress
      db.run("UPDATE tasks SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?", taskId);

      const resumePoint = db.get<ResumePoint>('SELECT * FROM resume_points WHERE task_id = ?', taskId);
      const startCheckpoint = resumePoint ? resumePoint.checkpoint_title : 'Starting Task';

      const sessionId = uuidv4();
      db.run(
        `INSERT INTO continuity_sessions (id, task_id, user_id, started_at, start_checkpoint)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        sessionId,
        taskId,
        userId,
        startCheckpoint
      );

      return db.get<ContinuitySession>('SELECT * FROM continuity_sessions WHERE id = ?', sessionId)!;
    });
  }

  /**
   * Pause an active continuity session, record time spent, and capture stopping checkpoint
   */
  public pauseSession(sessionId: string, stoppingContext?: string, manualNextAction?: string): { session: ContinuitySession; resumePoint: ResumePoint } {
    const db = getDB();

    return db.transaction(() => {
      const session = db.get<ContinuitySession>('SELECT * FROM continuity_sessions WHERE id = ?', sessionId);
      if (!session) {
        throw new Error(`Continuity session ${sessionId} not found`);
      }

      const startedTime = new Date(session.started_at).getTime();
      const now = Date.now();
      const durationSeconds = Math.max(0, Math.floor((now - startedTime) / 1000));

      // Fetch task and sync continuity
      const taskId = session.task_id;
      db.run("UPDATE tasks SET status = 'paused', updated_at = CURRENT_TIMESTAMP WHERE id = ?", taskId);

      const syncResult = this.computeResumePoint(taskId);
      const finalCheckpoint = syncResult.resumePoint.checkpoint_title || 'Paused Session';

      db.run(
        `UPDATE continuity_sessions 
         SET paused_at = CURRENT_TIMESTAMP, 
             ended_at = CURRENT_TIMESTAMP,
             duration_seconds = ?, 
             end_checkpoint = ?, 
             notes = ? 
         WHERE id = ?`,
        durationSeconds,
        finalCheckpoint,
        stoppingContext ?? null,
        sessionId
      );

      // Update actual_minutes on task
      const addedMinutes = Math.round(durationSeconds / 60);
      db.run('UPDATE tasks SET actual_minutes = actual_minutes + ? WHERE id = ?', addedMinutes, taskId);

      // Update resume point
      const resumePoint = this.syncTaskContinuity(taskId, stoppingContext);

      if (manualNextAction) {
        db.run(
          'UPDATE resume_points SET next_recommended_action = ? WHERE task_id = ?',
          manualNextAction,
          taskId
        );
      }

      const updatedSession = db.get<ContinuitySession>('SELECT * FROM continuity_sessions WHERE id = ?', sessionId)!;
      const updatedResumePoint = db.get<ResumePoint>('SELECT * FROM resume_points WHERE task_id = ?', taskId)!;

      return {
        session: updatedSession,
        resumePoint: updatedResumePoint
      };
    });
  }

  /**
   * Retrieves the top resume points for "Continue Where You Left Off" section
   */
  public getContinueWhereYouLeftOff(userId: string, workspaceId?: string, limit = 6): ContinuityOverview[] {
    const db = getDB();

    let query = `
      SELECT t.*, rp.id as rp_id, rp.checkpoint_title, rp.stopping_context, rp.next_recommended_action, 
             rp.active_unit_id, rp.is_ai_inferred, rp.updated_at as rp_updated_at
      FROM tasks t
      JOIN resume_points rp ON t.id = rp.task_id
      WHERE (t.assignee_id = ? OR t.creator_id = ?)
        AND t.status IN ('in_progress', 'paused', 'scheduled')
        AND t.progress_pct < 100
    `;

    const params: any[] = [userId, userId];

    if (workspaceId) {
      query += ' AND t.workspace_id = ?';
      params.push(workspaceId);
    }

    query += ' ORDER BY rp.updated_at DESC, t.scheduled_start ASC LIMIT ?';
    params.push(limit);

    const rows = db.all<any>(query, ...params);

    return rows.map(row => {
      const task: Task = {
        id: row.id,
        workspace_id: row.workspace_id,
        project_id: row.project_id,
        creator_id: row.creator_id,
        assignee_id: row.assignee_id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        category: row.category,
        scheduled_start: row.scheduled_start,
        scheduled_end: row.scheduled_end,
        estimated_minutes: row.estimated_minutes,
        actual_minutes: row.actual_minutes,
        recurrence_rule: row.recurrence_rule,
        progress_pct: row.progress_pct,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const resumePoint: ResumePoint = {
        id: row.rp_id,
        task_id: row.id,
        active_unit_id: row.active_unit_id,
        checkpoint_title: row.checkpoint_title,
        stopping_context: row.stopping_context,
        next_recommended_action: row.next_recommended_action,
        is_ai_inferred: Boolean(row.is_ai_inferred),
        updated_at: row.rp_updated_at
      };

      let activeWorkUnit: TaskWorkUnit | undefined;
      if (row.active_unit_id) {
        activeWorkUnit = db.get<TaskWorkUnit>('SELECT * FROM task_work_units WHERE id = ?', row.active_unit_id);
      }

      const counts = db.get<{ completed: number; total: number }>(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
         FROM task_work_units WHERE task_id = ?`,
        row.id
      ) || { completed: 0, total: 0 };

      const lastSession = db.get<ContinuitySession>(
        'SELECT * FROM continuity_sessions WHERE task_id = ? ORDER BY started_at DESC LIMIT 1',
        row.id
      );

      return {
        task,
        resumePoint,
        activeWorkUnit,
        completedUnitsCount: counts.completed || 0,
        totalUnitsCount: counts.total || 0,
        lastSession
      };
    });
  }

  /**
   * Manual override of the Resume Point by user
   */
  public overrideResumePoint(taskId: string, checkpointTitle: string, stoppingContext?: string, nextAction?: string): ResumePoint {
    const db = getDB();

    db.run(
      `UPDATE resume_points 
       SET checkpoint_title = ?, 
           stopping_context = ?, 
           next_recommended_action = COALESCE(?, next_recommended_action),
           is_ai_inferred = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE task_id = ?`,
      checkpointTitle,
      stoppingContext ?? null,
      nextAction ?? null,
      taskId
    );

    return db.get<ResumePoint>('SELECT * FROM resume_points WHERE task_id = ?', taskId)!;
  }
}
