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

interface Note {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  department: string;
  createdAt: string;
}

interface Player {
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
  status: string;
  lastLogin: string | null;
  realBalance: number;
  bonusBalance: number;
  canDeposit: boolean;
  canWithdraw: boolean;
  canBet: boolean;
  canReceiveBonus: boolean;
  canLogin: boolean;
  tags: string[];
  riskLevel: string;
  isPEP: boolean;
  sofVerified: boolean;
  riskNotes: string | null;
  createdAt: string;
  notes: Note[];
  tickets: Ticket[];
}

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pendiente de verificación",
  active: "Activo",
  suspended: "Suspendido",
};

const STATUS_COLORS: Record<string, string> = {
  pending_verification: "bg-primary/20 text-primary",
  active: "bg-green-500/20 text-green-400",
  suspended: "bg-destructive/20 text-destructive",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  PENDING_INFO: "bg-orange-500/20 text-orange-400",
  RESOLVED: "bg-green-500/20 text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

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

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote("");
      fetchPlayer();
    } finally {
      setAddingNote(false);
    }
  }

  if (loading || loadingPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <button onClick={() => router.push("/players")} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
            ← Volver a jugadores
          </button>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h2 className="text-2xl font-bold">{player.firstName} {player.lastName}</h2>
              <p className="text-muted-foreground text-sm">{player.email} · #{player.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {player.tags.map(tag => (
                <span key={tag} className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">{tag}</span>
              ))}
              <span className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[player.status]}`}>
                {STATUS_LABELS[player.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Contenido principal con tabs */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex gap-1 border-b border-border/50 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div>
              {activeTab === "account" && (
                <AccountTab player={player} accessToken={accessToken} onUpdate={fetchPlayer} />
              )}

              {activeTab === "kyc" && (
                <KYCTab playerId={player.id} accessToken={accessToken} />
              )}

              {activeTab === "payments" && (
                <PaymentsTab playerId={player.id} accessToken={accessToken} onUpdate={fetchPlayer} />
              )}

              {activeTab === "bonuses" && (
                <BonusesTab playerId={player.id} accessToken={accessToken} onUpdate={fetchPlayer} />
              )}

              {activeTab === "rg" && (
                <RGTab playerId={player.id} accessToken={accessToken} />
              )}

              {activeTab === "login" && (
                <LoginHistoryTab playerId={player.id} accessToken={accessToken} />
              )}

              {activeTab === "tickets" && (
                <div className="space-y-3">
                  {player.tickets.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground text-sm">No hay tickets vinculados a este jugador.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    player.tickets.map((ticket) => (
                      <Card key={ticket.id} className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                        <CardContent className="py-4 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground">{ticket.department} · {new Date(ticket.createdAt).toLocaleDateString("es-ES")}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${TICKET_STATUS_COLORS[ticket.status]}`}>
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
  <form onSubmit={async (e) => { await addNote(e); setShowNoteForm(false); }} className="space-y-2">
    <textarea
      placeholder="Añadir nota..."
      value={newNote}
      onChange={(e) => setNewNote(e.target.value)}
      required
      rows={2}
      autoFocus
      className="w-full text-sm px-2 py-2 rounded-md bg-input border border-border text-foreground resize-none"
    />
    <div className="flex gap-2">
      <Button type="submit" size="sm" className="flex-1" disabled={addingNote}>
        {addingNote ? "..." : "Guardar"}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setShowNoteForm(false)}>
        Cancelar
      </Button>
    </div>
  </form>
) : (
  <Button size="sm" variant="outline" className="w-full" onClick={() => setShowNoteForm(true)}>
    + Añadir nota
  </Button>
)}

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {player.notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay notas todavía.</p>
                  ) : (
                    player.notes.map((note) => (
                      <div key={note.id} className="p-2 rounded bg-muted/20 space-y-1">
                        <p className="text-xs">{note.content}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {note.author.email} · {new Date(note.createdAt).toLocaleDateString("es-ES")}
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