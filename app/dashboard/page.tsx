"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Workspace {
  id: number;
  name: string;
  createdAt: string;
  members: { role: string; user: { id: number; email: string } }[];
  _count: { tasks: number };
}

export default function DashboardPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchWorkspaces();
  }, [user, loading]);

  async function fetchWorkspaces() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setWorkspaces(data);
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      if (res.ok) {
        setNewWorkspaceName("");
        setShowForm(false);
        fetchWorkspaces();
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading || loadingWorkspaces) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">Bienvenido de vuelta</h2>
          <p className="text-muted-foreground mt-1">Aquí tienes un resumen de tu cuenta</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{user.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rol</CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                user.role === "admin"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {user.role}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{workspaces.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tus workspaces</h3>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancelar" : "+ Nuevo workspace"}
            </Button>
          </div>

          {showForm && (
            <form onSubmit={createWorkspace} className="flex gap-2">
              <Input
                placeholder="Nombre del workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                required
              />
              <Button type="submit" disabled={creating}>
                {creating ? "Creando..." : "Crear"}
              </Button>
            </form>
          )}

          {workspaces.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No tienes workspaces todavía.</p>
                <p className="text-sm text-muted-foreground mt-1">Crea uno para empezar a gestionar tareas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{ws.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {ws.members.length} miembro{ws.members.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ws._count.tasks} tarea{ws._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}