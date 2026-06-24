"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/Select";
import Navbar from "@/components/Navbar";
import type { AdminUserRecord } from "@/types/user";
import { DEPARTMENTS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";

export default function AdminPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, loading]);

  async function fetchUsers() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setUsers(data);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function updateDepartment(userId: number, department: string) {
    setUpdatingId(userId);
    setError("");
    try {
      await apiFetch(`/admin/users/${userId}/department`, {
        method: "PUT",
        accessToken,
        body: { department },
      });
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el departamento");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || loadingUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const admins = users.filter((u) => u.role === "ADMIN").length;
  const regularUsers = users.filter((u) => u.role !== "ADMIN").length;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h2 className="font-heading text-2xl font-bold">Panel de administración</h2>
          <p className="text-muted-foreground mt-1">Gestión de usuarios del sistema</p>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary text-3xl font-bold">{admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{regularUsers}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuarios registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/50 border-b">
                  <th className="text-muted-foreground py-2.5 text-left font-medium">ID</th>
                  <th className="text-muted-foreground py-2.5 text-left font-medium">Email</th>
                  <th className="text-muted-foreground py-2.5 text-left font-medium">Rol</th>
                  <th className="text-muted-foreground py-2.5 text-left font-medium">
                    Departamento
                  </th>
                  <th className="text-muted-foreground py-2.5 text-left font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-border/30 hover:bg-muted/20 border-b transition-colors"
                  >
                    <td className="text-muted-foreground py-2.5 tabular-nums">#{u.id}</td>
                    <td className="py-2.5 font-medium">{u.email}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {u.role === "ADMIN" ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Select
                          value={u.department ?? ""}
                          onChange={(e) => updateDepartment(u.id, e.target.value)}
                          className="text-xs"
                        >
                          <option value="">Sin departamento</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="text-muted-foreground py-2.5">
                      {new Date(u.createdAt).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
