import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(createApp()).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('not found');
  });
});
