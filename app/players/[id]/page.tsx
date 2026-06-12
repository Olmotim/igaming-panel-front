"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";

interface Note {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; email: string };
}

interface Player {
  id: number;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  notes: Note[];
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

export default function PlayerPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const playerId = params.id;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchPlayer();
    } finally {
      setUpdatingStatus(false);
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
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <button onClick={() => router.push("/players")} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
            ← Volver a jugadores
          </button>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h2 className="text-2xl font-bold">{player.name}</h2>
              <p className="text-muted-foreground text-sm">{player.email} · #{player.id}</p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[player.status]}`}>
              {STATUS_LABELS[player.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{player.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registro</p>
                  <p className="font-medium">{new Date(player.createdAt).toLocaleDateString("es-ES")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notas internas</p>
                  <p className="font-medium">{player.notes.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cambiar estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["active", "pending_verification", "suspended"].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={player.status === status || updatingStatus}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      player.status === status
                        ? STATUS_COLORS[status] + " cursor-default"
                        : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Añadir nota interna</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addNote} className="flex gap-2">
                  <Input
                    placeholder="Escribe una nota sobre este jugador..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={addingNote}>
                    {addingNote ? "..." : "Añadir"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Notas internas ({player.notes.length})
              </h3>
              {player.notes.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <p className="text-muted-foreground text-sm">No hay notas todavía.</p>
                  </CardContent>
                </Card>
              ) : (
                player.notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="py-4 space-y-2">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {note.author.email} · {new Date(note.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}