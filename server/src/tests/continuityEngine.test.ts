import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService, getDB } from '../db/index.js';
import { WorkContinuityEngine } from '../engine/continuityEngine.js';
import { v4 as uuidv4 } from 'uuid';

describe('WorkContinuityEngine', () => {
  let continuityEngine: WorkContinuityEngine;

  beforeEach(() => {
    // Reset database with an in-memory instance
    DatabaseService.resetInstance(':memory:');
    continuityEngine = WorkContinuityEngine.getInstance();

    const db = getDB();
    // Insert test user and workspace
    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role) 
       VALUES ('test_user', 'alex@test.com', 'hash', 'Alex Rivers', 'student')`
    );
    db.run(
      `INSERT INTO workspaces (id, name, slug, owner_id) 
       VALUES ('ws_test', 'Academics', 'academics', 'test_user')`
    );
  });

  it('correctly calculates 60% completion and recommends Exercise 7 when exercises 1-6 are completed', () => {
    const db = getDB();
    const taskId = 'task_student_python';

    db.run(
      `INSERT INTO tasks (id, workspace_id, creator_id, assignee_id, title, status, scheduled_start, scheduled_end)
       VALUES (?, 'ws_test', 'test_user', 'test_user', 'Study Python Functions', 'in_progress', '2026-10-07T19:00:00Z', '2026-10-07T21:00:00Z')`,
      taskId
    );

    // Create 10 exercises
    for (let i = 1; i <= 10; i++) {
      const status = i <= 6 ? 'completed' : (i === 7 ? 'in_progress' : 'pending');
      db.run(
        `INSERT INTO task_work_units (id, task_id, sequence_order, title, unit_type, status, estimated_minutes)
         VALUES (?, ?, ?, ?, 'exercise', ?, 12)`,
        `unit_${i}`,
        taskId,
        i,
        `Exercise ${i}: Topic ${i}`,
        status
      );
    }

    // Sync continuity
    const resumePoint = continuityEngine.syncTaskContinuity(taskId, 'Stopped after Exercise 6. Ready for recursion.');

    expect(resumePoint).toBeDefined();
    expect(resumePoint.checkpoint_title).toContain('Exercise 7');
    expect(resumePoint.stopping_context).toBe('Stopped after Exercise 6. Ready for recursion.');

    const updatedTask = db.get<{ progress_pct: number; status: string }>('SELECT progress_pct, status FROM tasks WHERE id = ?', taskId);
    expect(updatedTask?.progress_pct).toBe(60);
    expect(updatedTask?.status).toBe('in_progress');
  });

  it('automatically advances checkpoint and recalculates progress when a sub-unit is completed', () => {
    const db = getDB();
    const taskId = 'task_auth_system';

    db.run(
      `INSERT INTO tasks (id, workspace_id, creator_id, assignee_id, title, status, scheduled_start, scheduled_end)
       VALUES (?, 'ws_test', 'test_user', 'test_user', 'Build Auth System', 'in_progress', '2026-10-07T10:00:00Z', '2026-10-07T14:00:00Z')`,
      taskId
    );

    db.run(`INSERT INTO task_work_units (id, task_id, sequence_order, title, status) VALUES ('unit_1', ?, 1, 'Database Schema', 'completed')`, taskId);
    db.run(`INSERT INTO task_work_units (id, task_id, sequence_order, title, status) VALUES ('unit_2', ?, 2, 'Password Hashing', 'in_progress')`, taskId);
    db.run(`INSERT INTO task_work_units (id, task_id, sequence_order, title, status) VALUES ('unit_3', ?, 3, 'JWT Middleware', 'pending')`, taskId);
    db.run(`INSERT INTO task_work_units (id, task_id, sequence_order, title, status) VALUES ('unit_4', ?, 4, 'Refresh Tokens', 'pending')`, taskId);

    continuityEngine.syncTaskContinuity(taskId);

    // Now complete Password Hashing (unit_2)
    const newResumePoint = continuityEngine.completeWorkUnit(taskId, 'unit_2');

    expect(newResumePoint.checkpoint_title).toContain('JWT Middleware');

    const task = db.get<{ progress_pct: number }>('SELECT progress_pct FROM tasks WHERE id = ?', taskId);
    expect(task?.progress_pct).toBe(50); // 2 out of 4 units = 50%
  });

  it('allows manual override of the resume point by user', () => {
    const db = getDB();
    const taskId = 'task_manual_override';

    db.run(
      `INSERT INTO tasks (id, workspace_id, creator_id, assignee_id, title, status, scheduled_start, scheduled_end)
       VALUES (?, 'ws_test', 'test_user', 'test_user', 'Research Paper', 'in_progress', '2026-10-07T12:00:00Z', '2026-10-07T14:00:00Z')`,
      taskId
    );

    continuityEngine.syncTaskContinuity(taskId);

    const overridden = continuityEngine.overrideResumePoint(
      taskId,
      'Resume from Section 3.2: Methodology Proof',
      'Need to double check equation 4 before writing Section 3.3',
      'Verify equation 4 bounds'
    );

    expect(overridden.checkpoint_title).toBe('Resume from Section 3.2: Methodology Proof');
    expect(overridden.stopping_context).toBe('Need to double check equation 4 before writing Section 3.3');
    expect(overridden.next_recommended_action).toBe('Verify equation 4 bounds');
  });

  it('records continuity sessions with start and pause timers', () => {
    const db = getDB();
    const taskId = 'task_timer_test';

    db.run(
      `INSERT INTO tasks (id, workspace_id, creator_id, assignee_id, title, status, scheduled_start, scheduled_end)
       VALUES (?, 'ws_test', 'test_user', 'test_user', 'Coding Session', 'scheduled', '2026-10-07T14:00:00Z', '2026-10-07T16:00:00Z')`,
      taskId
    );

    const session = continuityEngine.startSession(taskId, 'test_user');
    expect(session.id).toBeDefined();

    const taskAfterStart = db.get<{ status: string }>('SELECT status FROM tasks WHERE id = ?', taskId);
    expect(taskAfterStart?.status).toBe('in_progress');

    const paused = continuityEngine.pauseSession(session.id, 'Stepping out for team meeting');
    expect(paused.session.notes).toBe('Stepping out for team meeting');

    const taskAfterPause = db.get<{ status: string }>('SELECT status FROM tasks WHERE id = ?', taskId);
    expect(taskAfterPause?.status).toBe('paused');
  });
});
