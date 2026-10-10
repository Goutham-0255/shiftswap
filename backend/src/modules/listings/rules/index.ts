import { certificationRule } from './certification.rule';
import { minimumRestRule } from './minimumRest.rule';
import { noOverlapRule } from './noOverlap.rule';
import { notOwnShiftRule } from './notOwnShift.rule';
import { weeklyHoursRule } from './weeklyHours.rule';
import type { ClaimContext, ClaimRule, Violation } from './types';

// Rules 2 to 5: the labour rules, re-checked again when a manager approves.
export const LABOUR_RULES: ClaimRule[] = [certificationRule, noOverlapRule, minimumRestRule, weeklyHoursRule];

// Full claim check. If the claimer owns the shift, only rule 1 is reported (per the spec).
// Otherwise every violated rule is reported, not just the first.
export function evaluateClaim(context: ClaimContext): Violation[] {
  const ownShift = notOwnShiftRule.check(context);
  if (ownShift.length > 0) return ownShift;
  return evaluateLabourRules(context);
}

export function evaluateLabourRules(context: ClaimContext): Violation[] {
  return LABOUR_RULES.flatMap((rule) => rule.check(context));
}

export type { ClaimContext, Violation } from './types';
