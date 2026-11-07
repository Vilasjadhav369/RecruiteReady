import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('App Initialization (Hermetic Unit Test)', () => {
  it('should export an Express application instance', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.listen).toBe('function');
  });

  it('should respond to /api/health with status 200 without connecting to MongoDB', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'RecruitReady API is running');
    expect(res.body).toHaveProperty('database');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/non-existent-route-404');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
  });
});
