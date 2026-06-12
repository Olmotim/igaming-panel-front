"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  assignee: { id: number; email: string } | null;
}

interface Member {
  role: string;
  user: { id: number; email: string };
}

interface Workspace {
  id: number;
  name: string;
  members: Member[];
  tasks: Task[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/20 text-primary",
  done: "bg-green-500/20 text-green-400",
};

export default function WorkspacePage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadingWs, setLoadingWs] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | "">("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchWorkspace();
  }, [user, loading]);

  async function fetchWorkspace() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setWorkspace(data);
    } finally {
      setLoadingWs(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc || undefined,
          assignedTo: newTaskAssignee || undefined,
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssignee("");
        setShowTaskForm(false);
        fetchWorkspace();
      }
    } finally {
      setCreating(false);
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError("");
    setAddingMember(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: newMemberEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMemberError(data.message || "Error al añadir miembro");
        return;
      }

      setNewMemberEmail("");
      setShowMemberForm(false);
      fetchWorkspace();
    } finally {
      setAddingMember(false);
    }
  }

  async function updateStatus(taskId: number, status: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status }),
    });
    fetchWorkspace();
  }

  async function deleteTask(taskId: number) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    fetchWorkspace();
  }

  if (loading || loadingWs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!workspace) return null;

  const userMember = workspace.members.find(m => m.user.id === user?.id);
  const isOwner = userMember?.role === "owner";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => router.push("/dashboard")} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
              ← Volver al dashboard
            </button>
            <h2 className="text-2xl font-bold">{workspace.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {workspace.members.length} miembro{workspace.members.length !== 1 ? "s" : ""} · Tu rol: <span className="text-primary">{userMember?.role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button size="sm" variant="outline" onClick={() => setShowMemberForm(!showMemberForm)}>
                {showMemberForm ? "Cancelar" : "+ Miembro"}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? "Cancelar" : "+ Nueva tarea"}
            </Button>
          </div>
        </div>

        {showMemberForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Añadir miembro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addMember} className="flex gap-2">
                <Input
                  placeholder="Email del usuario"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={addingMember}>
                  {addingMember ? "Añadiendo..." : "Añadir"}
                </Button>
              </form>
              {memberError && <p className="text-sm text-destructive mt-2">{memberError}</p>}
            </CardContent>
          </Card>
        )}

        {showTaskForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva tarea</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTask} className="space-y-3">
                <Input
                  placeholder="Título de la tarea"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
                <Input
                  placeholder="Descripción (opcional)"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
<select
  value={newTaskAssignee}
  onChange={(e) => setNewTaskAssignee(e.target.value ? Number(e.target.value) : "")}
  className="w-full text-sm px-3 py-2 rounded-md bg-muted border border-border text-foreground"
>
  <option value="" className="bg-card text-foreground">Sin asignar</option>
  {workspace.members.map((m) => (
    <option key={m.user.id} value={m.user.id} className="bg-card text-foreground">
      {m.user.email} ({m.role})
    </option>
  ))}
</select>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creando..." : "Crear tarea"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Tareas</h3>
            {workspace.tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No hay tareas todavía.</p>
                </CardContent>
              </Card>
            ) : (
              workspace.tasks.map((task) => (
                <Card key={task.id} className="hover:border-border/80 transition-colors">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground">
                          Asignada a: <span className="text-primary">{task.assignee.email}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded font-medium border-0 cursor-pointer ${STATUS_COLORS[task.status]}`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En progreso</option>
                        <option value="done">Completada</option>
                      </select>
                      {isOwner && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Miembros</h3>
            <Card>
              <CardContent className="py-4 space-y-3">
                {workspace.members.map((m) => (
                  <div key={m.user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      m.role === "owner"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}