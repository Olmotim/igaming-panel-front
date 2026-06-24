"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import Navbar from "@/components/Navbar";
import type { Ticket, TicketStatus } from "@/types/ticket";
import {
  TICKET_PRIORITY_COLORS as PRIORITY_COLORS,
  TICKET_STATUS_COLORS as STATUS_COLORS,
  TICKET_STATUS_LABELS as STATUS_LABELS,
} from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";

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
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchTicket();
  }, [user, loading]);

  async function fetchTicket() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        router.push("/tickets");
        return;
      }
      const data = await res.json();
      setTicket(data);
    } finally {
      setLoadingTicket(false);
    }
  }

  async function updateStatus(status: TicketStatus) {
    setUpdatingStatus(true);
    setError("");
    try {
      await apiFetch(`/tickets/${ticketId}/status`, {
        method: "PUT",
        accessToken,
        body: { status },
      });
      fetchTicket();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAddingComment(true);
    setError("");
    try {
      await apiFetch(`/tickets/${ticketId}/comments`, {
        method: "POST",
        accessToken,
        body: { content: newComment },
      });
      setNewComment("");
      fetchTicket();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al añadir el comentario");
    } finally {
      setAddingComment(false);
    }
  }

  if (loading || loadingTicket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (accessDenied || notFound) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-8">
          <Card>
            <CardContent className="space-y-3 py-10 text-center">
              <p className="text-destructive font-medium">
                {accessDenied ? "No tienes acceso a este ticket" : "Ticket no encontrado"}
              </p>
              {accessDenied && (
                <p className="text-muted-foreground text-sm">
                  Pertenece a un departamento distinto al tuyo y no eres su creador ni la persona
                  asignada.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={() => router.push("/tickets")}>
                Volver a tickets
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <button
            onClick={() => router.push("/tickets")}
            className="text-muted-foreground hover:text-foreground mb-2 text-sm transition-colors"
          >
            ← Volver a tickets
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">#{ticket.id}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <h2 className="font-heading text-2xl font-bold">{ticket.title}</h2>
              <p className="text-muted-foreground text-sm">
                {ticket.department} · Creado por {ticket.createdBy.email} ·{" "}
                {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {ticket.description}
                </p>
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
                    <p className="text-muted-foreground text-xs">Para</p>
                    <Input
                      value={ticket.player ? ticket.player.email : ""}
                      readOnly
                      className="bg-muted/30 text-muted-foreground"
                      placeholder="Sin jugador vinculado"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Asunto</p>
                    <Input placeholder="Asunto del email..." />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Mensaje</p>
                    <textarea
                      placeholder="Redacta aquí la respuesta para el cliente..."
                      rows={5}
                      className="bg-input border-border text-foreground w-full resize-none rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs italic">
                      Funcionalidad de envío próximamente disponible
                    </p>
                    <Button disabled variant="outline" size="sm">
                      Enviar respuesta
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
            <div className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Comentarios ({ticket.comments.length})
              </h3>
              {ticket.comments.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground text-sm">No hay comentarios todavía.</p>
                  </CardContent>
                </Card>
              ) : (
                ticket.comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="space-y-1 py-4">
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-muted-foreground text-xs">
                        {comment.author.email} ·{" "}
                        {new Date(comment.createdAt).toLocaleDateString("es-ES")}{" "}
                        {new Date(comment.createdAt).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                    onChange={(e) => updateStatus(e.target.value as TicketStatus)}
                    className="w-full"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="text-muted-foreground">Departamento</p>
                  <p className="font-medium">{ticket.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prioridad</p>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}
                  >
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
                    <p className="font-medium">
                      {new Date(ticket.resolvedAt).toLocaleDateString("es-ES")}
                    </p>
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
                  <p className="font-medium">
                    {ticket.player.firstName} {ticket.player.lastName}
                  </p>
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
