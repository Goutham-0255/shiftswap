export interface ShiftInfo {
  id: string;
  start: string; // "YYYY-MM-DDTHH:MM"
  end: string;
  requiredCertification: string | null;
  assignedToId: string;
}

// Everything a rule needs to decide, loaded once by the service.
// Rules never touch the database, which keeps them pure and easy to test.
export interface ClaimContext {
  claimerId: string;
  claimerCertifications: string[];
  shift: ShiftInfo; // the shift being claimed (S)
  claimerShifts: ShiftInfo[]; // shifts currently assigned to the claimer
}

export interface Violation {
  rule: 1 | 2 | 3 | 4 | 5;
  message: string;
  conflictingShiftId?: string;
}

// Strategy pattern: every labour rule has the same shape, so the engine can run
// them all without knowing what each one checks. A new rule is one new file.
export interface ClaimRule {
  rule: Violation['rule'];
  description: string;
  check(context: ClaimContext): Violation[];
}
