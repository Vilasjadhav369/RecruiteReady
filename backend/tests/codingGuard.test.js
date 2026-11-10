import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { isCodingEnabled } from '../src/config/features.js';

describe('Coding Module Feature Guard Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('evaluates isCodingEnabled correctly under different environment settings', () => {
    // 1. Explicitly enabled
    process.env.CODING_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    expect(isCodingEnabled()).toBe(true);

    process.env.CODING_ENABLED = '1';
    expect(isCodingEnabled()).toBe(true);

    // 2. Explicitly disabled
    process.env.CODING_ENABLED = 'false';
    process.env.NODE_ENV = 'development';
    expect(isCodingEnabled()).toBe(false);

    process.env.CODING_ENABLED = '0';
    expect(isCodingEnabled()).toBe(false);

    // 3. Default in production is false
    delete process.env.CODING_ENABLED;
    process.env.NODE_ENV = 'production';
    expect(isCodingEnabled()).toBe(false);

    // 4. Default in development/test is true
    delete process.env.CODING_ENABLED;
    process.env.NODE_ENV = 'development';
    expect(isCodingEnabled()).toBe(true);
  });

  it('rejects /api/coding/* with 404 { success: false, message: "Not available" } when CODING_ENABLED=false', async () => {
    process.env.CODING_ENABLED = 'false';

    const res = await request(app).get('/api/coding/problems');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Not available',
    });

    const resSub = await request(app).get('/api/coding/submissions');
    expect(resSub.status).toBe(404);
    expect(resSub.body).toEqual({
      success: false,
      message: 'Not available',
    });
  });

  it('rejects /api/coding/* with 404 in production by default when CODING_ENABLED is unset', async () => {
    delete process.env.CODING_ENABLED;
    process.env.NODE_ENV = 'production';

    const res = await request(app).get('/api/coding/problems');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Not available',
    });
  });

  it('does not block /api/coding/* with 404 guard when CODING_ENABLED=true', async () => {
    process.env.CODING_ENABLED = 'true';

    // Since this endpoint requires auth protect middleware, unauthenticated request should return 401 instead of 404
    const res = await request(app).get('/api/coding/problems');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not authorized|no token/i);
  });
});
