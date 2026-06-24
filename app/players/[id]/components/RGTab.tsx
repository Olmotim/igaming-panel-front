"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import { apiFetch, ApiError } from "@/lib/api";

interface RGLimit {
  id: number;
  type: string;
  period: string | null;
  amount: number | null;
  duration: number | null;
  status: string;
  requestedAt: string | null;
  startDate: string;
  endDate: string | null;
  coolingOffUntil: string | null;
  excludedUntil: string | null;
  therapyFlag: boolean;
  createdAt: string;
}

interface RGTabProps {
  playerId: number;
  accessToken: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT_LIMIT: "Límite de depósito",
  SESSION_LIMIT: "Límite de sesión",
  COOL_OFF: "Pausa temporal (Cool-off)",
  SELF_EXCLUSION: "Autoexclusión",
  REALITY_CHECK: "Recordatorio de tiempo",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-primary/20 text-primary",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/20 text-destructive",
};

export default function RGTab({ playerId, accessToken }: RGTabProps) {
  const [limits, setLimits] = useState<RGLimit[]>([]);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "DEPOSIT_LIMIT",
    period: "MONTHLY",
    amount: "",
    duration: "",
    endDate: "",
    coolingOffUntil: "",
    excludedUntil: "",
    therapyFlag: false,
  });

  useEffect(() => {
    fetchLimits();
  }, []);

  async function fetchLimits() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/rg`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setLimits(data);
    } finally {
      setLoadingLimits(false);
    }
  }

  async function addLimit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/players/${playerId}/rg`, {
        method: "POST",
        accessToken,
        body: {
          type: form.type,
          period: form.type === "DEPOSIT_LIMIT" ? form.period : undefined,
          amount: form.amount ? parseFloat(form.amount) : undefined,
          duration: form.duration ? parseInt(form.duration) : undefined,
          endDate: form.endDate || undefined,
          coolingOffUntil: form.coolingOffUntil || undefined,
          excludedUntil: form.excludedUntil || undefined,
          therapyFlag: form.therapyFlag,
        },
      });
      setForm({
        type: "DEPOSIT_LIMIT",
        period: "MONTHLY",
        amount: "",
        duration: "",
        endDate: "",
        coolingOffUntil: "",
        excludedUntil: "",
        therapyFlag: false,
      });
      setShowForm(false);
      fetchLimits();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al añadir el límite");
    }
  }

  async function updateStatus(limitId: number, status: string) {
    setError("");
    try {
      await apiFetch(`/players/rg/${limitId}/status`, {
        method: "PUT",
        accessToken,
        body: { status },
      });
      fetchLimits();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el límite");
    }
  }

  if (loadingLimits) {
    return <p className="text-muted-foreground text-sm">Cargando límites...</p>;
  }

  const activeLimits = limits.filter((l) => l.status === "ACTIVE");
  const hasSelfExclusion = activeLimits.some((l) => l.type === "SELF_EXCLUSION");

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {hasSelfExclusion && (
        <Card className="border-destructive/50">
          <CardContent className="py-3">
            <p className="text-destructive text-sm font-medium">
              ⚠ Este jugador tiene una autoexclusión activa.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{activeLimits.length} límite(s) activo(s)</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Añadir límite"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo límite de juego responsable</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addLimit} className="space-y-3">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>

              {form.type === "DEPOSIT_LIMIT" && (
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                  >
                    <option value="DAILY">Diario</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensual</option>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Importe (€)"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
              )}

              {form.type === "SESSION_LIMIT" && (
                <Input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              )}

              {form.type === "REALITY_CHECK" && (
                <Input
                  type="number"
                  placeholder="Cada cuántos minutos avisar"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              )}

              {form.type === "COOL_OFF" && (
                <Input
                  type="date"
                  placeholder="Hasta cuándo"
                  value={form.coolingOffUntil}
                  onChange={(e) => setForm({ ...form, coolingOffUntil: e.target.value })}
                />
              )}

              {form.type === "SELF_EXCLUSION" && (
                <>
                  <Input
                    type="date"
                    placeholder="Excluido hasta"
                    value={form.excludedUntil}
                    onChange={(e) => setForm({ ...form, excludedUntil: e.target.value })}
                  />
                  <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.therapyFlag}
                      onChange={(e) => setForm({ ...form, therapyFlag: e.target.checked })}
                    />
                    El jugador está recibiendo terapia / ayuda profesional
                  </label>
                </>
              )}

              <Button type="submit">Guardar límite</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {limits.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground text-sm">No hay límites configurados.</p>
            </CardContent>
          </Card>
        ) : (
          limits.map((limit) => (
            <Card key={limit.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{TYPE_LABELS[limit.type]}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[limit.status]}`}
                      >
                        {STATUS_LABELS[limit.status]}
                      </span>
                      {limit.therapyFlag && (
                        <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-xs font-medium">
                          En terapia
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {limit.amount &&
                        `${limit.amount.toFixed(2)} € (${limit.period === "DAILY" ? "diario" : limit.period === "WEEKLY" ? "semanal" : "mensual"})`}
                      {limit.duration && `${limit.duration} minutos`}
                      {limit.coolingOffUntil &&
                        `Hasta ${new Date(limit.coolingOffUntil).toLocaleDateString("es-ES")}`}
                      {limit.excludedUntil &&
                        `Excluido hasta ${new Date(limit.excludedUntil).toLocaleDateString("es-ES")}`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Activado el {new Date(limit.startDate).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  {limit.status === "ACTIVE" && (
                    <button
                      onClick={() => updateStatus(limit.id, "CANCELLED")}
                      className="bg-destructive/20 text-destructive hover:bg-destructive/30 rounded px-2 py-1 text-xs"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
