import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { DatabaseService } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';

describe('Continuum API Integration Tests', () => {
  let authToken = '';

  beforeAll(() => {
    seedDatabase();
  });

  it('authenticates demo user Alex Rivers', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex.student@continuum.dev',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alex.student@continuum.dev');
    authToken = res.body.token;
  });

  it('fetches "Continue Where You Left Off" resume points', async () => {
    const res = await request(app)
      .get('/api/continuity/resume-points')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resumePoints)).toBe(true);
    expect(res.body.resumePoints.length).toBeGreaterThan(0);

    const top = res.body.resumePoints[0];
    expect(top.task.title).toContain('Python');
    expect(top.resumePoint.checkpoint_title).toContain('Exercise 7');
  });

  it('retrieves calendar day view', async () => {
    const res = await request(app)
      .get('/api/scheduler/day?date=2026-10-07')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dayView).toBeDefined();
    expect(res.body.dayView.hourlySlots.length).toBe(24);
  });

  it('returns grounded AI continuity advice', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Where did I stop yesterday on Python?'
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toContain('Exercise 7');
  });
});
