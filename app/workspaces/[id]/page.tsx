"use client";

// Esta ruta no está enlazada desde el Navbar ni desde ningún otro sitio: el módulo
// workspaces/tasks del backend es scaffolding inicial conservado, no forma parte del
// flujo principal del backoffice. No se "completa" su integración salvo que se pida explícitamente.

import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { apiFetch, ApiError } from "@/lib/api";

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
  const [taskError, setTaskError] = useState("");

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
        credentials: "include",
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
    setTaskError("");

    try {
      await apiFetch(`/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        accessToken,
        body: {
          title: newTaskTitle,
          description: newTaskDesc || undefined,
          assignedTo: newTaskAssignee || undefined,
        },
      });

      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskAssignee("");
      setShowTaskForm(false);
      fetchWorkspace();
    } catch (err) {
      setTaskError(err instanceof ApiError ? err.message : "Error al crear la tarea");
    } finally {
      setCreating(false);
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError("");
    setAddingMember(true);

    try {
      await apiFetch(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        accessToken,
        body: { email: newMemberEmail },
      });
      setNewMemberEmail("");
      setShowMemberForm(false);
      fetchWorkspace();
    } catch (err) {
      setMemberError(err instanceof ApiError ? err.message : "Error al añadir miembro");
    } finally {
      setAddingMember(false);
    }
  }

  async function updateStatus(taskId: number, status: string) {
    setTaskError("");
    try {
      await apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "PUT",
        accessToken,
        body: { status },
      });
      fetchWorkspace();
    } catch (err) {
      setTaskError(err instanceof ApiError ? err.message : "Error al actualizar la tarea");
    }
  }

  async function deleteTask(taskId: number) {
    setTaskError("");
    try {
      await apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "DELETE",
        accessToken,
      });
      fetchWorkspace();
    } catch (err) {
      setTaskError(err instanceof ApiError ? err.message : "Error al eliminar la tarea");
    }
  }

  if (loading || loadingWs) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!workspace) return null;

  const userMember = workspace.members.find((m) => m.user.id === user?.id);
  const isOwner = userMember?.role === "owner";

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground mb-1 text-sm transition-colors"
            >
              ← Volver al dashboard
            </button>
            <h2 className="text-2xl font-bold">{workspace.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {workspace.members.length} miembro{workspace.members.length !== 1 ? "s" : ""} · Tu
              rol: <span className="text-primary">{userMember?.role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMemberForm(!showMemberForm)}
              >
                {showMemberForm ? "Cancelar" : "+ Miembro"}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? "Cancelar" : "+ Nueva tarea"}
            </Button>
          </div>
        </div>

        {taskError && <p className="text-destructive text-sm">{taskError}</p>}

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
              {memberError && <p className="text-destructive mt-2 text-sm">{memberError}</p>}
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
                  className="bg-muted border-border text-foreground w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="" className="bg-card text-foreground">
                    Sin asignar
                  </option>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Tareas
            </h3>
            {workspace.tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No hay tareas todavía.</p>
                </CardContent>
              </Card>
            ) : (
              workspace.tasks.map((task) => (
                <Card key={task.id} className="hover:border-border/80 transition-colors">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-muted-foreground text-sm">{task.description}</p>
                      )}
                      {task.assignee && (
                        <p className="text-muted-foreground text-xs">
                          Asignada a: <span className="text-primary">{task.assignee.email}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                        className={`cursor-pointer rounded border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[task.status]}`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En progreso</option>
                        <option value="done">Completada</option>
                      </select>
                      {isOwner && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-muted-foreground hover:text-destructive text-xs transition-colors"
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
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Miembros
            </h3>
            <Card>
              <CardContent className="space-y-3 py-4">
                {workspace.members.map((m) => (
                  <div key={m.user.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.user.email}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        m.role === "owner"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
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
