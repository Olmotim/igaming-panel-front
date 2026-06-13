"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import Navbar from "@/components/Navbar";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  department: string;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: { id: number; email: string };
  assignedTo: { id: number; email: string } | null;
  player: { id: number; name: string; email: string } | null;
  comments: Comment[];
}



const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-destructive/20 text-destructive",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  PENDING_INFO: "bg-orange-500/20 text-orange-400",
  RESOLVED: "bg-green-500/20 text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  PENDING_INFO: "Esperando info",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const DEPARTMENTS = ["CS", "RISK", "COMPLIANCE", "PAYMENTS", "RG", "SPORTSBOOK", "AML", "SECOND_LINE", "DOCUMENTS"];

export default function TicketPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    fetchTicket();
  }, [user, loading]);

  async function fetchTicket() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) { router.push("/tickets"); return; }
      const data = await res.json();
      setTicket(data);
    } finally {
      setLoadingTicket(false);
    }
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status }),
      });
      fetchTicket();
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ content: newComment }),
      });
      setNewComment("");
      fetchTicket();
    } finally {
      setAddingComment(false);
    }
  }

  if (loading || loadingTicket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <button onClick={() => router.push("/tickets")} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            ← Volver a tickets
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">#{ticket.id}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{ticket.title}</h2>
              <p className="text-sm text-muted-foreground">
                {ticket.department} · Creado por {ticket.createdBy.email} · {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Añadir comentario</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addComment} className="flex gap-2">
                  <Input
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={addingComment}>
                    {addingComment ? "..." : "Añadir"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
  <CardHeader className="cursor-pointer" onClick={() => setShowReply(!showReply)}>
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">Respuesta al cliente</CardTitle>
      <span className="text-muted-foreground text-sm">{showReply ? "▲" : "▼"}</span>
    </div>
  </CardHeader>
  {showReply && (
    <CardContent className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Para</p>
        <Input
          value={ticket.player ? ticket.player.email : ""}
          readOnly
          className="bg-muted/30 text-muted-foreground"
          placeholder="Sin jugador vinculado"
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Asunto</p>
        <Input placeholder="Asunto del email..." />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Mensaje</p>
        <textarea
          placeholder="Redacta aquí la respuesta para el cliente..."
          rows={5}
          className="w-full text-sm px-3 py-2 rounded-md bg-input border border-border text-foreground resize-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground italic">Funcionalidad de envío próximamente disponible</p>
        <Button disabled variant="outline" size="sm">Enviar respuesta</Button>
      </div>
    </CardContent>
  )}
</Card>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Comentarios ({ticket.comments.length})
              </h3>
              {ticket.comments.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">No hay comentarios todavía.</p>
                  </CardContent>
                </Card>
              ) : (
                ticket.comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="py-4 space-y-1">
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.author.email} · {new Date(comment.createdAt).toLocaleDateString("es-ES")} {new Date(comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Estado</p>
                  <Select
                    value={ticket.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="w-full"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="text-muted-foreground">Departamento</p>
                  <p className="font-medium">{ticket.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prioridad</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Creado por</p>
                  <p className="font-medium">{ticket.createdBy.email}</p>
                </div>
                {ticket.assignedTo && (
                  <div>
                    <p className="text-muted-foreground">Asignado a</p>
                    <p className="font-medium">{ticket.assignedTo.email}</p>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div>
                    <p className="text-muted-foreground">Resuelto</p>
                    <p className="font-medium">{new Date(ticket.resolvedAt).toLocaleDateString("es-ES")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {ticket.player && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Jugador vinculado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-medium">{ticket.player.name}</p>
                  <p className="text-muted-foreground">{ticket.player.email}</p>
                  <button
                    onClick={() => router.push(`/players/${ticket.player!.id}`)}
                    className="text-primary text-xs underline underline-offset-4"
                  >
                    Ver ficha del jugador →
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}