import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { User } from '../types/index.js';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';

const router = Router();

router.post('/register', (req, res: Response): void => {
  const { email, password, full_name, role = 'student', timezone = 'UTC' } = req.body;

  if (!email || !password || !full_name) {
    res.status(400).json({ error: 'Email, password, and full name are required' });
    return;
  }

  const db = getDB();
  const existing = db.get<User>('SELECT id FROM users WHERE email = ?', email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);

  db.transaction(() => {
    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, timezone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      email.toLowerCase(),
      password_hash,
      full_name,
      role,
      timezone
    );

    // Create default personal workspace
    const wsId = uuidv4();
    db.run(
      `INSERT INTO workspaces (id, name, slug, owner_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      wsId,
      `${full_name}'s Workspace`,
      `ws-${id.slice(0, 8)}`,
      id,
      'Personal continuity and study workspace'
    );

    db.run(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role)
       VALUES (?, ?, ?, 'owner')`,
      uuidv4(),
      wsId,
      id
    );
  });

  const newUser = db.get<User>('SELECT id, email, full_name, role, timezone, avatar_url FROM users WHERE id = ?', id)!;
  const token = generateToken(newUser);

  res.status(201).json({
    token,
    user: newUser
  });
});

router.post('/login', (req, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDB();
  const user = db.get<User>('SELECT * FROM users WHERE email = ?', email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({
    token,
    user: safeUser
  });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const user = db.get<User>(
    'SELECT id, email, full_name, role, timezone, avatar_url, preferences FROM users WHERE id = ?',
    req.user!.id
  );

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

router.post('/seed', (req, res: Response): void => {
  try {
    seedDatabase();
    res.json({ message: 'Database seeded or already present' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
