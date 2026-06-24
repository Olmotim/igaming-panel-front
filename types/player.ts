import type { Department } from "./department";
import type { TicketPriority, TicketStatus } from "./ticket";

export type PlayerStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "SELF_EXCLUDED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PlayerNote {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
}

export interface PlayerRgLimit {
  id: number;
  type: string;
  status: string;
  excludedUntil: string | null;
}

export interface PlayerTicketSummary {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  department: Department;
  createdAt: string;
}

export interface Player {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  language: string | null;
  status: PlayerStatus;
  lastLogin: string | null;
  realBalance: number;
  bonusBalance: number;
  canDeposit: boolean;
  canWithdraw: boolean;
  canBet: boolean;
  canReceiveBonus: boolean;
  canLogin: boolean;
  tags: string[];
  riskLevel: RiskLevel;
  isPEP: boolean;
  sofVerified: boolean;
  riskNotes: string | null;
  createdAt: string;
  notes: PlayerNote[];
  tickets: PlayerTicketSummary[];
  rgLimits: PlayerRgLimit[];
}

export interface PlayerListItem extends Pick<
  Player,
  "id" | "email" | "firstName" | "lastName" | "status" | "riskLevel" | "createdAt"
> {
  _count: { notes: number };
  kyc: { idDocStatus: string; poaDocStatus: string; sofDocStatus: string } | null;
  rgLimits: { id: number }[];
}
