"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import type { PlayerListItem } from "@/types/player";
import { PLAYER_STATUS_LABELS, PLAYER_STATUS_COLORS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";

function PlayersContent() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
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
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearch(urlSearch);
      fetchPlayers(urlSearch);
    } else {
      fetchPlayers();
    }
  }, [user, loading]);

  async function fetchPlayers(searchTerm?: string) {
    try {
      const url = searchTerm
        ? `${process.env.NEXT_PUBLIC_API_URL}/players?search=${encodeURIComponent(searchTerm)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/players`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
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
      await apiFetch("/players", {
        method: "POST",
        accessToken,
        body: { email: newEmail, firstName: newFirstName, lastName: newLastName },
      });

      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setShowForm(false);
      fetchPlayers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear jugador");
    } finally {
      setCreating(false);
    }
  }

  if (loading || loadingPlayers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Jugadores</h2>
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
                {error && <p className="text-destructive text-sm">{error}</p>}
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
          <Button type="submit" variant="outline">
            Buscar
          </Button>
          {search && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                fetchPlayers();
              }}
            >
              Limpiar
            </Button>
          )}
        </form>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/50 border-b">
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">ID</th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Nombre
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">Email</th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Estado
                  </th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">Notas</th>
                  <th className="text-muted-foreground px-6 py-2.5 text-left font-medium">
                    Registro
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground px-6 py-8 text-center">
                      No se encontraron jugadores
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr
                      key={player.id}
                      className="border-border/30 hover:bg-muted/20 border-b transition-colors"
                    >
                      <td className="text-muted-foreground px-6 py-2.5 tabular-nums">
                        #{player.id}
                      </td>
                      <td className="px-6 py-2.5 font-medium">
                        <Link
                          href={`/players/${player.id}`}
                          className="hover:text-primary flex items-center gap-2 transition-colors"
                        >
                          <span>
                            {player.firstName} {player.lastName}
                          </span>
                          {player.rgLimits.length > 0 && (
                            <span title="Autoexclusión activa">🚫</span>
                          )}
                          {(player.kyc?.idDocStatus === "PENDING" ||
                            player.kyc?.poaDocStatus === "PENDING" ||
                            player.kyc?.sofDocStatus === "PENDING") && (
                            <span title="KYC pendiente">📄</span>
                          )}
                          {player.riskLevel === "HIGH" && <span title="Riesgo alto">⚠️</span>}
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5">{player.email}</td>
                      <td className="px-6 py-2.5">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${PLAYER_STATUS_COLORS[player.status]}`}
                        >
                          {PLAYER_STATUS_LABELS[player.status]}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5 tabular-nums">
                        {player._count.notes}
                      </td>
                      <td className="text-muted-foreground px-6 py-2.5">
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

export default function PlayersPage() {
  return (
    <Suspense>
      <PlayersContent />
    </Suspense>
  );
}
