"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/user";
import { canCreateBonus, canApproveBonus } from "@/lib/permissions";

interface Bonus {
  id: number;
  type: string;
  description: string | null;
  amount: number;
  wagering: number;
  wageringCompleted: number;
  maxWinAmount: number | null;
  status: string;
  expiresAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  grantedBy: { id: number; email: string };
}

interface BonusesTabProps {
  playerId: number;
  accessToken: string | null;
  user: AuthUser | null;
  onUpdate: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Depósito",
  FREE_SPINS: "Tiradas gratis",
  CASHBACK: "Cashback",
  NO_DEPOSIT: "Sin depósito",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  CLAIMED: "Reclamado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-primary/20 text-primary",
  CLAIMED: "bg-success/20 text-success",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/20 text-destructive",
};

export default function BonusesTab({ playerId, accessToken, user, onUpdate }: BonusesTabProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loadingBonuses, setLoadingBonuses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    type: "DEPOSIT",
    description: "",
    amount: "",
    wagering: "",
    maxWinAmount: "",
    expiresAt: "",
  });

  useEffect(() => {
    fetchBonuses();
  }, []);

  async function fetchBonuses() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/bonuses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setBonuses(data);
    } finally {
      setLoadingBonuses(false);
    }
  }

  async function addBonus(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/players/${playerId}/bonuses`, {
        method: "POST",
        accessToken,
        body: {
          ...form,
          amount: parseFloat(form.amount),
          wagering: form.wagering ? parseFloat(form.wagering) : undefined,
          maxWinAmount: form.maxWinAmount ? parseFloat(form.maxWinAmount) : undefined,
        },
      });
      setForm({
        type: "DEPOSIT",
        description: "",
        amount: "",
        wagering: "",
        maxWinAmount: "",
        expiresAt: "",
      });
      setShowForm(false);
      fetchBonuses();
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al asignar el bono");
    }
  }

  async function updateStatus(bonusId: number, status: string) {
    setError("");
    try {
      await apiFetch(`/players/bonuses/${bonusId}/status`, {
        method: "PUT",
        accessToken,
        body: { status },
      });
      fetchBonuses();
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el bono");
    }
  }

  if (loadingBonuses) {
    return <p className="text-muted-foreground text-sm">Cargando bonos...</p>;
  }

  const activeBonuses = bonuses.filter((b) => b.status === "ACTIVE");

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{activeBonuses.length} bono(s) activo(s)</p>
        {canCreateBonus(user) && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Asignar bono"}
          </Button>
        )}
      </div>

      {showForm && canCreateBonus(user) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asignar nuevo bono</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addBonus} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Importe (€)"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <Input
                placeholder="Descripción (ej. Bono bienvenida 100%)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Wagering (x veces)"
                  value={form.wagering}
                  onChange={(e) => setForm({ ...form, wagering: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ganancia máxima (€)"
                  value={form.maxWinAmount}
                  onChange={(e) => setForm({ ...form, maxWinAmount: e.target.value })}
                />
              </div>
              <Input
                type="date"
                placeholder="Fecha de expiración"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
              <Button type="submit">Asignar bono</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {bonuses.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground text-sm">No hay bonos asignados.</p>
            </CardContent>
          </Card>
        ) : (
          bonuses.map((bonus) => (
            <Card key={bonus.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{TYPE_LABELS[bonus.type]}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bonus.status]}`}
                      >
                        {STATUS_LABELS[bonus.status]}
                      </span>
                    </div>
                    {bonus.description && (
                      <p className="text-muted-foreground text-sm">{bonus.description}</p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">{bonus.amount.toFixed(2)} €</span>
                      {bonus.wagering > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          · Wagering x{bonus.wagering} ({bonus.wageringCompleted.toFixed(0)}%
                          completado)
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Otorgado por {bonus.grantedBy.email} ·{" "}
                      {new Date(bonus.createdAt).toLocaleDateString("es-ES")}
                      {bonus.expiresAt &&
                        ` · Expira ${new Date(bonus.expiresAt).toLocaleDateString("es-ES")}`}
                    </p>
                  </div>
                  {bonus.status === "ACTIVE" && canApproveBonus(user) && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(bonus.id, "CLAIMED")}
                        className="bg-success/20 text-success hover:bg-success/30 rounded px-2 py-1 text-xs"
                      >
                        Reclamar
                      </button>
                      <button
                        onClick={() => updateStatus(bonus.id, "CANCELLED")}
                        className="bg-destructive/20 text-destructive hover:bg-destructive/30 rounded px-2 py-1 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
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
