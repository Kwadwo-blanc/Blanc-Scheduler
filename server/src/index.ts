import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import continuityRouter from './routes/continuity.js';
import schedulerRouter from './routes/scheduler.js';
import materialsRouter from './routes/materials.js';
import chatRouter from './routes/chat.js';
import aiRouter from './routes/ai.js';
import analyticsRouter from './routes/analytics.js';
import { RealtimeServer } from './realtime/index.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Continuum Work Continuity & Scheduler API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/continuity', continuityRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);
const realtime = new RealtimeServer(server);

// Seed database on startup
try {
  seedDatabase();
} catch (err) {
  console.error('Seed check warning:', err);
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Continuum Server is running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Realtime Bus initialized on ws://localhost:${PORT}/ws`);
  });
}

export { app, server, realtime };
