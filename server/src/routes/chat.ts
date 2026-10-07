import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db/index.js';
import { ChatChannel, ChatMessage } from '../types/index.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/channels', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const workspaceId = req.query.workspaceId as string;

  let query = 'SELECT * FROM chat_channels WHERE 1=1';
  const params: any[] = [];

  if (workspaceId) {
    query += ' AND workspace_id = ?';
    params.push(workspaceId);
  }

  const channels = db.all<ChatChannel>(query, ...params);
  res.json({ channels });
});

router.get('/channels/:id/messages', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const channelId = req.params.id;

  const messages = db.all<ChatMessage>(
    `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
     FROM chat_messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.channel_id = ?
     ORDER BY m.created_at ASC
     LIMIT 100`,
    channelId
  );

  res.json({ messages });
});

router.post('/channels/:id/messages', (req: AuthenticatedRequest, res: Response): void => {
  const db = getDB();
  const channelId = req.params.id;
  const userId = req.user!.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Message content cannot be empty' });
    return;
  }

  const msgId = uuidv4();
  db.run(
    `INSERT INTO chat_messages (id, channel_id, sender_id, content)
     VALUES (?, ?, ?, ?)`,
    msgId,
    channelId,
    userId,
    content.trim()
  );

  const message = db.get<ChatMessage>(
    `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
     FROM chat_messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = ?`,
    msgId
  );

  res.status(201).json({ message });
});

export default router;
