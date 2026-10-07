import { getDB } from './index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function seedDatabase() {
  const db = getDB();

  // Check if users already exist
  const existingUsers = db.get<{ count: number }>('SELECT count(*) as count FROM users');
  if (existingUsers && existingUsers.count > 0) {
    console.log('Database already contains records. Skipping initial seed.');
    return;
  }

  console.log('🌱 Seeding Continuum database with realistic scenarios...');

  db.transaction(() => {
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    // 1. Users
    const alexId = 'usr_alex_student';
    const samId = 'usr_sam_developer';
    const sarahId = 'usr_sarah_lead';

    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      alexId,
      'alex.student@continuum.dev',
      passwordHash,
      'Alex Rivers',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'student',
      'America/New_York'
    );

    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      samId,
      'dev.sam@continuum.dev',
      passwordHash,
      'Sam Chen',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'developer',
      'America/Los_Angeles'
    );

    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, role, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      sarahId,
      'sarah.lead@continuum.dev',
      passwordHash,
      'Sarah Miller',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      'team_lead',
      'Europe/London'
    );

    // 2. Workspaces
    const wsAcademicId = 'ws_academic_study';
    const wsEngineeringId = 'ws_apex_engineering';

    db.run(
      `INSERT INTO workspaces (id, name, slug, owner_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      wsAcademicId,
      'Computer Science & Research',
      'academic-study',
      alexId,
      'Undergraduate CS coursework, research papers, exam preparation'
    );

    db.run(
      `INSERT INTO workspaces (id, name, slug, owner_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      wsEngineeringId,
      'Apex Engineering Labs',
      'apex-engineering',
      sarahId,
      'Distributed systems architecture, microservices, sprint management'
    );

    // Workspace Members
    db.run(`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)`, uuidv4(), wsAcademicId, alexId, 'owner');
    db.run(`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)`, uuidv4(), wsEngineeringId, sarahId, 'owner');
    db.run(`INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES (?, ?, ?, ?)`, uuidv4(), wsEngineeringId, samId, 'editor');

    // 3. Projects
    const prjPythonId = 'prj_cs301_python';
    const prjAuthId = 'prj_auth_gateway';

    db.run(
      `INSERT INTO projects (id, workspace_id, name, description, color, status, target_end_date, progress_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      prjPythonId,
      wsAcademicId,
      'CS301: Python Mastery & Algorithms',
      'Mastery of functions, recursion, decorators, and data structures',
      '#3b82f6',
      'active',
      '2026-11-15T23:59:59Z',
      60.0
    );

    db.run(
      `INSERT INTO projects (id, workspace_id, name, description, color, status, target_end_date, progress_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      prjAuthId,
      wsEngineeringId,
      'Authentication & Identity Gateway',
      'OAuth2, JWT authentication service with token rotation and rate limiting',
      '#10b981',
      'active',
      '2026-10-30T23:59:59Z',
      50.0
    );

    // 4. Tasks & Work Units (Student scenario from prompt: Monday 7-9 PM Study Python Functions)
    const taskPythonId = 'tsk_python_functions';
    db.run(
      `INSERT INTO tasks (id, workspace_id, project_id, creator_id, assignee_id, title, description, priority, status, category, scheduled_start, scheduled_end, estimated_minutes, actual_minutes, progress_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      taskPythonId,
      wsAcademicId,
      prjPythonId,
      alexId,
      alexId,
      'Study Python Functions & Recursion',
      'Read Chapter 4 and complete exercises 1 through 10 on recursive calls and closures.',
      'high',
      'in_progress',
      'study',
      '2026-10-07T19:00:00Z',
      '2026-10-07T21:00:00Z',
      120,
      75,
      60.0
    );

    const exercises = [
      { num: 1, title: 'Exercise 1: Basic Function Signatures & Arguments', status: 'completed' },
      { num: 2, title: 'Exercise 2: Keyword Arguments & Defaults', status: 'completed' },
      { num: 3, title: 'Exercise 3: *args and **kwargs Packing/Unpacking', status: 'completed' },
      { num: 4, title: 'Exercise 4: Lambda Functions & Anonymous Callables', status: 'completed' },
      { num: 5, title: 'Exercise 5: Scope Resolution (LEGB Rule)', status: 'completed' },
      { num: 6, title: 'Exercise 6: Closures & Lexical Environments', status: 'completed' },
      { num: 7, title: 'Exercise 7: Recursive Fibonacci with Base Cases', status: 'in_progress' },
      { num: 8, title: 'Exercise 8: Memoization Strategies & LRU Cache', status: 'pending' },
      { num: 9, title: 'Exercise 9: Tail Recursion & Stack Depth Bounds', status: 'pending' },
      { num: 10, title: 'Exercise 10: Tower of Hanoi Recursive Solver', status: 'pending' }
    ];

    let activeUnitId: string | null = null;
    exercises.forEach((ex, idx) => {
      const uId = `unit_py_${ex.num}`;
      if (ex.status === 'in_progress') activeUnitId = uId;
      db.run(
        `INSERT INTO task_work_units (id, task_id, sequence_order, title, unit_type, status, estimated_minutes, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        uId,
        taskPythonId,
        idx + 1,
        ex.title,
        'exercise',
        ex.status,
        12,
        ex.status === 'completed' ? '2026-10-07T20:15:00Z' : null
      );
    });

    // Resume point for Task 1 (Alex)
    db.run(
      `INSERT INTO resume_points (id, task_id, active_unit_id, checkpoint_title, stopping_context, next_recommended_action, is_ai_inferred)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      taskPythonId,
      activeUnitId,
      'Resume from Exercise 7: Recursive Fibonacci with Base Cases',
      'Completed exercises 1 through 6. Started Exercise 7; need to define proper stopping condition n <= 1.',
      'Exercise 7: Implement recursive base case and verify zero/negative input validation.',
      0
    );

    // Continuity Session Log for Task 1
    db.run(
      `INSERT INTO continuity_sessions (id, task_id, user_id, started_at, paused_at, duration_seconds, start_checkpoint, end_checkpoint, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      taskPythonId,
      alexId,
      '2026-10-07T19:00:00Z',
      '2026-10-07T20:15:00Z',
      4500,
      'Exercise 1: Basic Function Signatures',
      'Exercise 7: Recursive Fibonacci',
      'Made swift progress through exercises 1-6. Stopped due to lecture session.'
    );

    // Developer Task (Sam: Build Authentication System)
    const taskAuthId = 'tsk_build_auth';
    db.run(
      `INSERT INTO tasks (id, workspace_id, project_id, creator_id, assignee_id, title, description, priority, status, category, scheduled_start, scheduled_end, estimated_minutes, actual_minutes, progress_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      taskAuthId,
      wsEngineeringId,
      prjAuthId,
      sarahId,
      samId,
      'Build Authentication & Identity System',
      'Complete end-to-end token generation, verification, and revocation middleware.',
      'urgent',
      'in_progress',
      'development',
      '2026-10-07T14:00:00Z',
      '2026-10-07T18:00:00Z',
      240,
      120,
      50.0
    );

    const authUnits = [
      { title: 'Database schema & migration for Users & Tokens', status: 'completed' },
      { title: 'User registration endpoint with input sanitization', status: 'completed' },
      { title: 'Password hashing with Argon2id / bcrypt', status: 'completed' },
      { title: 'Login API with timing-safe comparison', status: 'completed' },
      { title: 'JWT authentication middleware & claims verification', status: 'in_progress' },
      { title: 'Refresh tokens rotation with Redis / SQLite blacklist', status: 'pending' },
      { title: 'Logout functionality & token revocation', status: 'pending' },
      { title: 'Authentication middleware unit & integration tests', status: 'pending' }
    ];

    let authActiveUnitId: string | null = null;
    authUnits.forEach((u, idx) => {
      const uId = `unit_auth_${idx + 1}`;
      if (u.status === 'in_progress') authActiveUnitId = uId;
      db.run(
        `INSERT INTO task_work_units (id, task_id, sequence_order, title, unit_type, status, estimated_minutes, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        uId,
        taskAuthId,
        idx + 1,
        u.title,
        'code_module',
        u.status,
        30,
        u.status === 'completed' ? '2026-10-07T16:00:00Z' : null
      );
    });

    db.run(
      `INSERT INTO resume_points (id, task_id, active_unit_id, checkpoint_title, stopping_context, next_recommended_action, is_ai_inferred)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      taskAuthId,
      authActiveUnitId,
      'Resume Point: JWT authentication middleware',
      'Database schema and login endpoints completed. Need to wire Bearer token extraction in Express request context.',
      'Implement Bearer token verification in auth middleware and test expired token handling.',
      0
    );

    // 5. Digital Learning Materials
    db.run(
      `INSERT INTO learning_materials (id, task_id, project_id, uploader_id, title, resource_type, url, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      taskPythonId,
      prjPythonId,
      alexId,
      'Fluent Python: Chapter 4 Functions as First-Class Objects.pdf',
      'pdf',
      'https://learning.oreilly.com/library/view/fluent-python/9781491946237/',
      JSON.stringify({ chapters: [4, 5], pages: '135-180', topic: 'Functions & Recursion' })
    );

    db.run(
      `INSERT INTO learning_materials (id, task_id, project_id, uploader_id, title, resource_type, url, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      taskAuthId,
      prjAuthId,
      sarahId,
      'RFC 7519: JSON Web Token (JWT) Standard Specification',
      'doc',
      'https://datatracker.ietf.org/doc/html/rfc7519',
      JSON.stringify({ standards: ['RFC 7519', 'RFC 6749'], topic: 'Token security' })
    );

    // 6. Chat Channels & Messages
    const chnGeneralId = 'chn_eng_general';
    db.run(
      `INSERT INTO chat_channels (id, workspace_id, name, channel_type)
       VALUES (?, ?, ?, ?)`,
      chnGeneralId,
      wsEngineeringId,
      'general-sprint',
      'general'
    );

    db.run(
      `INSERT INTO chat_messages (id, channel_id, sender_id, content)
       VALUES (?, ?, ?, ?)`,
      uuidv4(),
      chnGeneralId,
      sarahId,
      'Team: Remember to log your stopping checkpoints before leaving today so everyone can pick up sprint tasks seamlessly!'
    );

    db.run(
      `INSERT INTO chat_messages (id, channel_id, sender_id, content)
       VALUES (?, ?, ?, ?)`,
      uuidv4(),
      chnGeneralId,
      samId,
      'Logged! I stopped right at JWT authentication middleware. Picking up refresh tokens first thing in the morning.'
    );

    // 7. Notifications
    db.run(
      `INSERT INTO notifications (id, user_id, type, title, message, action_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      uuidv4(),
      alexId,
      'reminder',
      'Resume Python Functions Study',
      'You left off at Exercise 7: Recursive Fibonacci. Scheduled session starts soon.',
      '/tasks/tsk_python_functions'
    );

    console.log('✅ Continuum database seeded successfully!');
  });
}
