"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const { user, accessToken, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (data.length === 1) {
        router.push(`/players/${data[0].id}`);
        setSearch("");
      } else {
        router.push(`/players?search=${encodeURIComponent(search)}`);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-primary font-bold text-lg tracking-tight whitespace-nowrap">
            ⬡ iGaming Panel
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/tickets" className="text-muted-foreground hover:text-foreground transition-colors">
              Tickets
            </Link>
            <Link href="/players" className="text-muted-foreground hover:text-foreground transition-colors">
              Jugadores
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <Input
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={searching}
            className="h-8 text-sm"
          />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </nav>
  );
}