"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Cuenta creada correctamente. Inicia sesión.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 30% 50%, oklch(0.22 0.05 210 / 0.35) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, oklch(0.2 0.04 230 / 0.3) 0%, transparent 60%)",
      }}
    >
      <div className="border-border/30 hidden flex-col justify-between border-r p-12 lg:flex lg:w-1/2">
        <div>
          <span className="font-heading text-primary text-xl font-bold tracking-tight">
            ⬡ iGaming Panel
          </span>
        </div>
        <div className="space-y-6">
          <h1 className="font-heading text-3xl leading-tight font-bold">
            Bienvenido al sistema de gestión
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Acceso exclusivo para personal autorizado. Si no tienes credenciales, contacta con tu
            administrador.
          </p>
          <div className="space-y-3">
            {[
              "Solo personal interno autorizado",
              "Todas las acciones quedan registradas",
              "Ante problemas de acceso contacta con soporte",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                <span className="text-muted-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-xs">© 2026 iGaming Panel</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="mb-6 lg:hidden">
              <span className="font-heading text-primary text-xl font-bold tracking-tight">
                ⬡ iGaming Panel
              </span>
            </div>
            <h2 className="font-heading text-2xl font-bold">Acceso al panel</h2>
            <p className="text-muted-foreground text-sm">
              Introduce tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {success && <p className="text-success text-sm">{success}</p>}
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary underline underline-offset-4">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
