"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import AccountTab from "./components/AccountTab";
import KYCTab from "./components/KYCTab";
import PaymentsTab from "./components/PaymentsTab";
import BonusesTab from "./components/BonusesTab";
import RGTab from "./components/RGTab";
import LoginHistoryTab from "./components/LoginHistoryTab";
import type { Player } from "@/types/player";
import { PLAYER_STATUS_LABELS, PLAYER_STATUS_COLORS, TICKET_STATUS_COLORS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";

const TABS = [
  { key: "account", label: "Cuenta" },
  { key: "kyc", label: "KYC" },
  { key: "payments", label: "Pagos" },
  { key: "bonuses", label: "Bonos" },
  { key: "rg", label: "Juego Responsable" },
  { key: "login", label: "Accesos" },
  { key: "tickets", label: "Tickets" },
];

export default function PlayerPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const playerId = Number(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchPlayer();
  }, [user, loading]);

  async function fetchPlayer() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (!res.ok) {
        router.push("/players");
        return;
      }
      const data = await res.json();
      setPlayer(data);
    } finally {
      setLoadingPlayer(false);
    }
  }

  async function addNote(e: React.FormEvent): Promise<boolean> {
    e.preventDefault();
    if (!newNote.trim()) return false;
    setAddingNote(true);
    setNoteError("");
    try {
      await apiFetch(`/players/${playerId}/notes`, {
        method: "POST",
        accessToken,
        body: { content: newNote },
      });
      setNewNote("");
      fetchPlayer();
      return true;
    } catch (err) {
      setNoteError(err instanceof ApiError ? err.message : "Error al añadir la nota");
      return false;
    } finally {
      setAddingNote(false);
    }
  }

  if (loading || loadingPlayer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <button
            onClick={() => router.push("/players")}
            className="text-muted-foreground hover:text-foreground mb-1 text-sm transition-colors"
          >
            ← Volver a jugadores
          </button>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                {player.firstName} {player.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {player.email} · #{player.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {player.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              <span
                className={`rounded px-3 py-1 text-sm font-medium ${PLAYER_STATUS_COLORS[player.status]}`}
              >
                {PLAYER_STATUS_LABELS[player.status]}
              </span>
            </div>
          </div>
          {(() => {
            const activeExclusion = player.rgLimits.find(
              (l) => l.type === "SELF_EXCLUSION" && l.status === "ACTIVE",
            );
            const hasAlerts = activeExclusion || player.riskLevel === "HIGH" || player.isPEP;

            if (!hasAlerts) return null;

            return (
              <div className="bg-destructive/10 border-destructive/30 flex items-center gap-3 rounded-lg border px-4 py-2">
                {activeExclusion && (
                  <span className="text-destructive text-sm font-medium">
                    🚫 Autoexclusión activa
                    {activeExclusion.excludedUntil
                      ? ` hasta ${new Date(activeExclusion.excludedUntil).toLocaleDateString("es-ES")}`
                      : ""}
                  </span>
                )}
                {player.riskLevel === "HIGH" && (
                  <span className="text-destructive text-sm font-medium">⚠️ Riesgo alto</span>
                )}
                {player.isPEP && (
                  <span className="text-destructive text-sm font-medium">🏛️ PEP</span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Contenido principal con tabs */}
          <div className="space-y-4 lg:col-span-4">
            <div className="border-border/50 flex gap-1 overflow-x-auto border-b">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === "account" && (
                <AccountTab
                  player={player}
                  accessToken={accessToken}
                  user={user}
                  onUpdate={fetchPlayer}
                />
              )}

              {activeTab === "kyc" && (
                <KYCTab playerId={player.id} accessToken={accessToken} user={user} />
              )}

              {activeTab === "payments" && (
                <PaymentsTab
                  playerId={player.id}
                  accessToken={accessToken}
                  user={user}
                  onUpdate={fetchPlayer}
                />
              )}

              {activeTab === "bonuses" && (
                <BonusesTab
                  playerId={player.id}
                  accessToken={accessToken}
                  user={user}
                  onUpdate={fetchPlayer}
                />
              )}

              {activeTab === "rg" && <RGTab playerId={player.id} accessToken={accessToken} />}

              {activeTab === "login" && (
                <LoginHistoryTab playerId={player.id} accessToken={accessToken} />
              )}

              {activeTab === "tickets" && (
                <div className="space-y-3">
                  {player.tickets.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground text-sm">
                          No hay tickets vinculados a este jugador.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    player.tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                      >
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{ticket.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {ticket.department} ·{" "}
                              {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}
                          >
                            {ticket.status}
                          </span>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de notas siempre visible */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-sm">Notas internas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showNoteForm ? (
                  <form
                    onSubmit={async (e) => {
                      const ok = await addNote(e);
                      if (ok) setShowNoteForm(false);
                    }}
                    className="space-y-2"
                  >
                    <textarea
                      placeholder="Añadir nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                      rows={2}
                      autoFocus
                      className="bg-input border-border text-foreground w-full resize-none rounded-md border px-2 py-2 text-sm"
                    />
                    {noteError && <p className="text-destructive text-xs">{noteError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="flex-1" disabled={addingNote}>
                        {addingNote ? "..." : "Guardar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNoteForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNoteForm(true)}
                  >
                    + Añadir nota
                  </Button>
                )}

                <div className="max-h-[500px] space-y-2 overflow-y-auto">
                  {player.notes.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No hay notas todavía.</p>
                  ) : (
                    player.notes.map((note) => (
                      <div key={note.id} className="bg-muted/20 space-y-1 rounded p-2">
                        <p className="text-xs">{note.content}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {note.author.email} ·{" "}
                          {new Date(note.createdAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
