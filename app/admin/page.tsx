"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/Select";
import Navbar from "@/components/Navbar";

interface User {
  id: number;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

const DEPARTMENTS = ["CS", "RISK", "COMPLIANCE", "PAYMENTS", "RG", "SPORTSBOOK", "AML", "SECOND_LINE", "DOCUMENTS"];

export default function AdminPage() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/dashboard"); return; }
    fetchUsers();
  }, [user, loading]);

  async function fetchUsers() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setUsers(data);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function updateDepartment(userId: number, department: string) {
    setUpdatingId(userId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/department`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ department }),
      });
      fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const admins = users.filter(u => u.role === "admin").length;
  const regularUsers = users.filter(u => u.role === "user").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Panel de administración</h2>
          <p className="text-muted-foreground mt-1">Gestión de usuarios del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agentes</CardTitle>
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
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 text-muted-foreground font-medium">ID</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Rol</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Departamento</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 text-muted-foreground">#{u.id}</td>
                    <td className="py-3 font-medium">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.role === "admin" ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <Select
                          value={u.department ?? ""}
                          onChange={(e) => updateDepartment(u.id, e.target.value)}
                          className="text-xs"
                        >
                          <option value="">Sin departamento</option>
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
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