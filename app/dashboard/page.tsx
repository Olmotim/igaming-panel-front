"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">ID de usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">#{user.id}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}