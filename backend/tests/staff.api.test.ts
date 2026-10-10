import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';
import { seedIfEmpty } from '../src/db/seed';

const app = createApp();

beforeEach(async () => {
  await prisma.historyEntry.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.staff.deleteMany();
  await seedIfEmpty();
});

describe('adding staff', () => {
  it('lets a manager add a staff member with the next id', async () => {
    const res = await request(app)
      .post('/api/staff')
      .set('X-Actor-Id', 'M1')
      .send({ name: 'Kiran', certifications: ['icu'] });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ id: 'S9', name: 'Kiran', role: 'STAFF', certifications: ['ICU'] });

    // The new person can act straight away, e.g. see open listings.
    const open = await request(app).get('/api/listings?status=OPEN').set('X-Actor-Id', 'S9');
    expect(open.status).toBe(200);
  });

  it('refuses staff (403) and an empty name (400)', async () => {
    const asStaff = await request(app).post('/api/staff').set('X-Actor-Id', 'S1').send({ name: 'X' });
    expect(asStaff.status).toBe(403);
    const empty = await request(app).post('/api/staff').set('X-Actor-Id', 'M1').send({ name: '  ' });
    expect(empty.status).toBe(400);
  });
});
