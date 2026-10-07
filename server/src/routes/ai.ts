import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { getDB } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { message, workspaceId, conversationId } = req.body;

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }

  try {
    const reply = await aiService.handleUserMessage(userId, message, workspaceId);

    // Save in ai_messages if conversationId is provided
    const db = getDB();
    if (conversationId) {
      db.run(
        `INSERT INTO ai_messages (id, conversation_id, sender_type, content)
         VALUES (?, ?, 'user', ?)`,
        uuidv4(),
        conversationId,
        message
      );
      db.run(
        `INSERT INTO ai_messages (id, conversation_id, sender_type, content)
         VALUES (?, ?, 'assistant', ?)`,
        uuidv4(),
        conversationId,
        reply
      );
    }

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/breakdown', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { goal, category = 'study', totalMinutes = 120 } = req.body;

  if (!goal) {
    res.status(400).json({ error: 'Task goal is required' });
    return;
  }

  try {
    const units = await aiService.breakdownTaskGoal(goal, category, totalMinutes);
    res.json({ workUnits: units });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/context', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const workspaceId = req.query.workspaceId as string | undefined;

  try {
    const context = await aiService.getGroundingContext(userId, workspaceId);
    res.json({ context });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
