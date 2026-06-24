import type { Department } from "@/types/department";
import type { PlayerStatus, RiskLevel } from "@/types/player";
import type { TicketPriority, TicketStatus } from "@/types/ticket";

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  PENDING_VERIFICATION: "Pendiente de verificación",
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  SELF_EXCLUDED: "Autoexcluido",
};

export const PLAYER_STATUS_COLORS: Record<PlayerStatus, string> = {
  PENDING_VERIFICATION: "bg-primary/20 text-primary",
  ACTIVE: "bg-success/20 text-success",
  SUSPENDED: "bg-destructive/20 text-destructive",
  SELF_EXCLUDED: "bg-destructive/20 text-destructive",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-success/20 text-success",
  MEDIUM: "bg-warning/20 text-warning",
  HIGH: "bg-destructive/20 text-destructive",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  PENDING_INFO: "Esperando info",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "bg-primary/20 text-primary",
  IN_PROGRESS: "bg-warning/20 text-warning",
  PENDING_INFO: "bg-warning/20 text-warning",
  RESOLVED: "bg-success/20 text-success",
  CLOSED: "bg-muted text-muted-foreground",
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-primary/20 text-primary",
  HIGH: "bg-warning/20 text-warning",
  URGENT: "bg-destructive/20 text-destructive",
};

export const DEPARTMENTS: Department[] = ["KYC", "PAYMENTS", "RISK", "SUPPORT", "OPERATIONS"];
