export type AuthenticatorAssuranceLevel = string | null;

export type AdminMfaStep =
  | "denied"
  | "enroll"
  | "challenge"
  | "authorized";

type ResolveAdminMfaStepInput = {
  hasAdminRole: boolean;
  currentLevel: AuthenticatorAssuranceLevel;
  verifiedTotpFactorId: string | null;
};

export function resolveAdminMfaStep({
  hasAdminRole,
  currentLevel,
  verifiedTotpFactorId,
}: ResolveAdminMfaStepInput): AdminMfaStep {
  if (!hasAdminRole) return "denied";
  if (currentLevel === "aal2") return "authorized";
  return verifiedTotpFactorId ? "challenge" : "enroll";
}
