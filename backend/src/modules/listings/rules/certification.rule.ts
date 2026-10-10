import type { ClaimRule } from './types';

export const certificationRule: ClaimRule = {
  rule: 2,
  description: 'Claimer must hold the certification the shift requires',
  check: ({ shift, claimerCertifications }) => {
    const required = shift.requiredCertification;
    if (!required || claimerCertifications.includes(required)) return [];
    return [{ rule: 2, message: `Requires ${required} certification, which you do not have` }];
  },
};
