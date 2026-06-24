import type { Department } from "./department";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "PENDING_INFO" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TicketComment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  department: Department;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: { id: number; email: string };
  assignedTo: { id: number; email: string } | null;
  player: { id: number; firstName: string; lastName: string; email: string } | null;
  comments: TicketComment[];
}

export type TicketSummary = Omit<Ticket, "description" | "comments">;
