import type { AuthUser, Role } from "@/types/user";
import type { Department } from "@/types/department";

const ROLE_RANK: Record<Role, number> = { AGENT: 0, SUPERVISOR: 1, ADMIN: 2 };

export function hasMinRole(user: AuthUser | null, min: Role): boolean {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[min];
}

export function inDepartment(user: AuthUser | null, allowed: Department | Department[]): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return user.department != null && list.includes(user.department);
}

export function canChangePlayerStatus(user: AuthUser | null): boolean {
  return inDepartment(user, ["RISK", "SUPPORT"]) && hasMinRole(user, "SUPERVISOR");
}

export function canChangePlayerRisk(user: AuthUser | null): boolean {
  return inDepartment(user, "RISK") && hasMinRole(user, "SUPERVISOR");
}

export function canAccessKyc(user: AuthUser | null): boolean {
  return inDepartment(user, "KYC");
}

export function canDecideKyc(user: AuthUser | null): boolean {
  return inDepartment(user, "KYC") && hasMinRole(user, "SUPERVISOR");
}

export function canCreatePayment(user: AuthUser | null): boolean {
  return inDepartment(user, "PAYMENTS");
}

export function canApprovePayment(user: AuthUser | null): boolean {
  return inDepartment(user, "PAYMENTS") && hasMinRole(user, "SUPERVISOR");
}

export function canCreateBonus(user: AuthUser | null): boolean {
  return inDepartment(user, ["PAYMENTS", "SUPPORT"]);
}

export function canApproveBonus(user: AuthUser | null): boolean {
  return inDepartment(user, ["PAYMENTS", "SUPPORT"]) && hasMinRole(user, "SUPERVISOR");
}
