import { describe, expect, it } from 'vitest';
import { durationHours, toMinutes, weekStartOf } from '../src/lib/time';
import { evaluateClaim, evaluateLabourRules, type ClaimContext } from '../src/modules/listings/rules';
import type { ShiftInfo } from '../src/modules/listings/rules/types';

// 2026-03-02 is a Monday.
const shift = (id: string, start: string, end: string, requiredCertification: string | null = null): ShiftInfo => ({
  id,
  start,
  end,
  requiredCertification,
  assignedToId: 'OWNER',
});

const context = (s: ShiftInfo, claimerShifts: ShiftInfo[] = [], certifications: string[] = []): ClaimContext => ({
  claimerId: 'C',
  claimerCertifications: certifications,
  shift: s,
  claimerShifts: claimerShifts.map((x) => ({ ...x, assignedToId: 'C' })),
});

const rulesOf = (ctx: ClaimContext) => evaluateClaim(ctx).map((v) => v.rule);

describe('time helpers', () => {
  it('handles shifts that cross midnight', () => {
    expect(durationHours('2026-03-02T23:00', '2026-03-03T07:00')).toBe(8);
  });

  it('puts Sunday night in the week that started the previous Monday', () => {
    expect(weekStartOf(toMinutes('2026-03-08T23:00'))).toBe(toMinutes('2026-03-02T00:00'));
    expect(weekStartOf(toMinutes('2026-03-09T00:00'))).toBe(toMinutes('2026-03-09T00:00'));
  });
});

describe('claim rules', () => {
  it('passes when nothing is broken', () => {
    expect(evaluateClaim(context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00')))).toEqual([]);
  });

  it('rule 1: claiming your own shift reports only rule 1', () => {
    const ctx = context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00', 'ICU'));
    ctx.claimerId = 'OWNER';
    expect(rulesOf(ctx)).toEqual([1]);
  });

  it('rule 2: missing certification', () => {
    const ctx = context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00', 'ICU'), [], ['PEDS']);
    expect(rulesOf(ctx)).toEqual([2]);
    expect(rulesOf({ ...ctx, claimerCertifications: ['ICU'] })).toEqual([]);
  });

  it('rule 3: overlap names the conflicting shift', () => {
    const ctx = context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00'), [
      shift('X', '2026-03-04T14:00', '2026-03-04T22:00'),
    ]);
    expect(evaluateClaim(ctx)).toEqual([expect.objectContaining({ rule: 3, conflictingShiftId: 'X' })]);
  });

  it('rule 3: back-to-back shifts do not overlap (but break rule 4)', () => {
    const ctx = context(shift('S', '2026-03-04T15:00', '2026-03-04T23:00'), [
      shift('X', '2026-03-04T07:00', '2026-03-04T15:00'),
    ]);
    expect(rulesOf(ctx)).toEqual([4]);
  });

  it('rule 4: exactly 11h rest is allowed, 10h59 is not', () => {
    const before = shift('X', '2026-03-03T07:00', '2026-03-03T15:00');
    expect(rulesOf(context(shift('S', '2026-03-04T02:00', '2026-03-04T10:00'), [before]))).toEqual([]);
    expect(rulesOf(context(shift('S', '2026-03-04T01:59', '2026-03-04T09:59'), [before]))).toEqual([4]);
  });

  it('rule 4: also checks shifts that come after the claimed one', () => {
    const after = shift('X', '2026-03-04T07:00', '2026-03-04T15:00');
    expect(evaluateClaim(context(shift('S', '2026-03-03T15:00', '2026-03-03T23:00'), [after]))).toEqual([
      expect.objectContaining({ rule: 4, conflictingShiftId: 'X' }),
    ]);
  });

  const mondayToThursday = ['02', '03', '04', '05'].map((d) => shift(`D${d}`, `2026-03-${d}T07:00`, `2026-03-${d}T15:00`));

  it('rule 5: exactly 40h in the week is allowed', () => {
    const friday = shift('S', '2026-03-06T07:00', '2026-03-06T15:00');
    expect(rulesOf(context(friday, mondayToThursday))).toEqual([]);
  });

  it('rule 5: a Sunday night shift counts in the week it starts', () => {
    const fridayAlready = shift('F', '2026-03-06T07:00', '2026-03-06T15:00');
    const sundayNight = shift('S', '2026-03-08T23:00', '2026-03-09T07:00');
    expect(rulesOf(context(sundayNight, mondayToThursday))).toEqual([]); // 32 + 8 = 40
    expect(rulesOf(context(sundayNight, [...mondayToThursday, fridayAlready]))).toEqual([5]); // 48
  });

  it('reports every violated rule together, not just the first', () => {
    const ctx = context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00', 'ICU'), [
      shift('X', '2026-03-04T10:00', '2026-03-04T18:00'),
      shift('Y', '2026-03-03T20:00', '2026-03-04T01:00'),
    ]);
    expect(rulesOf(ctx)).toEqual([2, 3, 4]);
  });

  it('approval re-check skips rule 1 and runs rules 2 to 5', () => {
    const ctx = context(shift('S', '2026-03-04T07:00', '2026-03-04T15:00', 'ICU'));
    expect(evaluateLabourRules(ctx).map((v) => v.rule)).toEqual([2]);
  });
});
