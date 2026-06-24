import type { Department } from "./department";

export type Role = "AGENT" | "SUPERVISOR" | "ADMIN";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  department: Department | null;
}

export interface AdminUserRecord extends AuthUser {
  createdAt: string;
}
