"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Player {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  _count: { notes: number };
}

const STATUS_LABELS: Record<string, string> = {
  pending_verification: "Pendiente",
  active: "Activo",
  suspended: "Suspendido",
};

const STATUS_COLORS: Record<string, string> = {
  pending_verification: "bg-primary/20 text-primary",
  active: "bg-green-500/20 text-green-400",
  suspended: "bg-destructive/20 text-destructive",
};

export default function PlayersPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchPlayers();
  }, [user, loading]);

  async function fetchPlayers(searchTerm?: string) {
    try {
      const url = searchTerm
        ? `${process.env.NEXT_PUBLIC_API_URL}/players?search=${encodeURIComponent(searchTerm)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/players`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setPlayers(data);
    } finally {
      setLoadingPlayers(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPlayers(true);
    fetchPlayers(search);
  }

  async function createPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: newEmail, firstName: newFirstName, lastName: newLastName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al crear jugador");
        return;
      }

      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setShowForm(false);
      fetchPlayers();
    } finally {
      setCreating(false);
    }
  }

  if (loading || loadingPlayers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Jugadores</h2>
            <p className="text-muted-foreground mt-1">Gestión de jugadores registrados</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo jugador"}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar jugador</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createPlayer} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Apellidos"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    required
                  />
                </div>
                <Input
                  placeholder="Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={creating}>
                  {creating ? "Registrando..." : "Registrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline">Buscar</Button>
          {search && (
            <Button variant="ghost" onClick={() => { setSearch(""); fetchPlayers(); }}>
              Limpiar
            </Button>
          )}
        </form>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Notas</th>
                  <th className="text-left px-6 py-3 text-muted-foreground font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No se encontraron jugadores
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr key={player.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 text-muted-foreground">#{player.id}</td>
                      <td className="px-6 py-3 font-medium">
                        <Link href={`/players/${player.id}`} className="hover:text-primary transition-colors">
                          {player.firstName} {player.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{player.email}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[player.status]}`}>
                          {STATUS_LABELS[player.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{player._count.notes}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(player.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}