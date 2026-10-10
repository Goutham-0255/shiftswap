import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';
import { seedIfEmpty } from '../src/db/seed';

const app = createApp();
const as = (actorId: string) => ({ 'X-Actor-Id': actorId });

// Fresh seed data before every test.
beforeEach(async () => {
  await prisma.historyEntry.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.staff.deleteMany();
  await seedIfEmpty();
});

const post = (actorId: string, shiftId: string) =>
  request(app).post('/api/listings').set(as(actorId)).send({ shiftId });
const act = (actorId: string, listingId: number, action: string) =>
  request(app).post(`/api/listings/${listingId}/${action}`).set(as(actorId));

describe('listing workflow', () => {
  it('post → claim → approve reassigns the shift and logs history', async () => {
    const posted = await post('S2', 'SH001'); // Ben's Monday morning shift
    expect(posted.status).toBe(201);
    const id = posted.body.data.id;

    expect((await act('S7', id, 'claim')).body.data.status).toBe('CLAIMED');
    const approved = await act('M1', id, 'approve');
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('APPROVED');

    const shift = await prisma.shift.findUnique({ where: { id: 'SH001' } });
    expect(shift?.assignedToId).toBe('S7');

    const history = (await request(app).get('/api/history')).body.data;
    expect(history.map((h: { action: string }) => h.action)).toEqual(['APPROVE', 'CLAIM', 'POST']);
  });

  it('refuses a claim with every broken rule and records the refusal', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    const res = await act('S5', id, 'claim'); // Sana already works the same Monday shift

    expect(res.status).toBe(422);
    expect(res.body.error.details.map((v: { rule: number }) => v.rule)).toEqual([3, 5]);
    expect(res.body.error.details[0].conflictingShiftId).toBe('SH002');

    const [last] = (await request(app).get('/api/history')).body.data;
    expect(last).toMatchObject({ action: 'CLAIM', outcome: 'REFUSED' });
  });

  it('claiming your own shift reports only rule 1', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    const res = await act('S2', id, 'claim');
    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([expect.objectContaining({ rule: 1 })]);
  });

  it('a listing that is no longer open is "no longer available" and nothing else', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    await act('S7', id, 'claim');
    const res = await act('S5', id, 'claim'); // S5 would also break rules 3 and 5
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('This listing is no longer available');
    expect(res.body.error.details).toBeUndefined();
  });

  it('a shift can have only one open or claimed listing', async () => {
    await post('S2', 'SH001');
    expect((await post('S2', 'SH001')).status).toBe(409);
  });

  it('only the owner can post, only the poster can withdraw', async () => {
    expect((await post('S7', 'SH001')).status).toBe(403);
    const id = (await post('S2', 'SH001')).body.data.id;
    expect((await act('S7', id, 'withdraw')).status).toBe(403);
    expect((await act('S2', id, 'withdraw')).body.data.status).toBe('WITHDRAWN');
  });

  it('unclaim and reject put the listing back to OPEN', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    await act('S7', id, 'claim');
    expect((await act('S7', id, 'unclaim')).body.data.status).toBe('OPEN');
    await act('S7', id, 'claim');
    expect((await act('M1', id, 'reject')).body.data.status).toBe('OPEN');
  });

  it('managers cannot claim, staff cannot approve', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    expect((await act('M1', id, 'claim')).status).toBe(403);
    await act('S7', id, 'claim');
    expect((await act('S7', id, 'approve')).status).toBe(403);
  });

  it('approval re-checks the rules against current assignments and keeps the claim', async () => {
    const id = (await post('S2', 'SH001')).body.data.id; // Mon 07:00-15:00
    await act('S7', id, 'claim');
    // Meanwhile Uma is given an overlapping shift (e.g. by another approved swap).
    await prisma.shift.update({ where: { id: 'SH002' }, data: { assignedToId: 'S7' } });

    const res = await act('M1', id, 'approve');
    expect(res.status).toBe(422);
    expect(res.body.error.details[0]).toMatchObject({ rule: 3, conflictingShiftId: 'SH002' });
    const listing = await prisma.listing.findUnique({ where: { id } });
    expect(listing?.status).toBe('CLAIMED');
  });

  it('two simultaneous claims: exactly one wins', async () => {
    const id = (await post('S2', 'SH001')).body.data.id;
    const [a, b] = await Promise.all([act('S7', id, 'claim'), act('S6', id, 'claim')]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
  });

  it('open listings show whether the viewer can claim and why not', async () => {
    await post('S2', 'SH001');
    const forUma = (await request(app).get('/api/listings?status=OPEN').set(as('S7'))).body.data;
    const forSana = (await request(app).get('/api/listings?status=OPEN').set(as('S5'))).body.data;
    expect(forUma[0]).toMatchObject({ canClaim: true, reasons: [] });
    expect(forSana[0].canClaim).toBe(false);
    expect(forSana[0].reasons.map((r: { rule: number }) => r.rule)).toEqual([3, 5]);
  });

  it('requires choosing who you are', async () => {
    expect((await request(app).get('/api/listings')).status).toBe(401);
    expect((await request(app).get('/api/listings').set(as('NOPE'))).status).toBe(401);
  });

  it('rejects invalid input separately with 400', async () => {
    expect((await request(app).post('/api/listings').set(as('S2')).send({})).status).toBe(400);
    expect((await act('S2', 0, 'claim')).status).toBe(400);
  });
});
