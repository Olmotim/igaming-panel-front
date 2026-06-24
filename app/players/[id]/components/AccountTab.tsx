"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import type { Player, PlayerStatus, RiskLevel } from "@/types/player";
import type { AuthUser } from "@/types/user";
import { PLAYER_STATUS_LABELS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api";
import { canChangePlayerStatus, canChangePlayerRisk } from "@/lib/permissions";

interface AccountTabProps {
  player: Player;
  accessToken: string | null;
  user: AuthUser | null;
  onUpdate: () => void;
}

const RESTRICTIONS = [
  { key: "canDeposit", label: "Depositar" },
  { key: "canWithdraw", label: "Retirar" },
  { key: "canBet", label: "Apostar" },
  { key: "canReceiveBonus", label: "Recibir bonos" },
  { key: "canLogin", label: "Iniciar sesión" },
] as const;

export default function AccountTab({ player, accessToken, user, onUpdate }: AccountTabProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: player.firstName,
    lastName: player.lastName,
    phone: player.phone ?? "",
    dateOfBirth: player.dateOfBirth ? player.dateOfBirth.split("T")[0] : "",
    gender: player.gender ?? "",
    nationality: player.nationality ?? "",
    country: player.country ?? "",
    city: player.city ?? "",
    address: player.address ?? "",
    language: player.language ?? "es",
  });

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/players/${player.id}`, { method: "PUT", accessToken, body: form });
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRestriction(key: string, value: boolean) {
    setError("");
    try {
      await apiFetch(`/players/${player.id}/restrictions`, {
        method: "PUT",
        accessToken,
        body: { [key]: value },
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar la restricción");
    }
  }

  async function updateStatus(status: PlayerStatus) {
    setError("");
    try {
      await apiFetch(`/players/${player.id}/status`, {
        method: "PUT",
        accessToken,
        body: { status },
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el estado");
    }
  }

  async function updateRiskLevel(riskLevel: RiskLevel) {
    setError("");
    try {
      await apiFetch(`/players/${player.id}/risk`, {
        method: "PUT",
        accessToken,
        body: { riskLevel },
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el nivel de riesgo");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Datos personales</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? "Cancelar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={saveAccount} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Nombre"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <Input
                      placeholder="Apellidos"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Teléfono"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Fecha de nacimiento"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="">Género</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                    </Select>
                    <Input
                      placeholder="Nacionalidad"
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="País"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                    <Input
                      placeholder="Ciudad"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Dirección"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <Select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                    <option value="fr">Francés</option>
                    <option value="de">Alemán</option>
                    <option value="it">Italiano</option>
                  </Select>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre completo</p>
                    <p className="font-medium">
                      {player.firstName} {player.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{player.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha de nacimiento</p>
                    <p className="font-medium">
                      {player.dateOfBirth
                        ? new Date(player.dateOfBirth).toLocaleDateString("es-ES")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Género</p>
                    <p className="font-medium">{player.gender ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nacionalidad</p>
                    <p className="font-medium">{player.nationality ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">País / Ciudad</p>
                    <p className="font-medium">
                      {player.country ?? "—"} {player.city ? `· ${player.city}` : ""}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Dirección</p>
                    <p className="font-medium">{player.address ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Idioma</p>
                    <p className="font-medium">{player.language ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Último login</p>
                    <p className="font-medium">
                      {player.lastLogin ? new Date(player.lastLogin).toLocaleString("es-ES") : "—"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado y permisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Estado de la cuenta</p>
                <Select
                  value={player.status}
                  onChange={(e) => updateStatus(e.target.value as PlayerStatus)}
                  className="w-full"
                  disabled={player.status === "SELF_EXCLUDED" || !canChangePlayerStatus(user)}
                >
                  {Object.entries(PLAYER_STATUS_LABELS)
                    .filter(
                      ([value]) => value !== "SELF_EXCLUDED" || player.status === "SELF_EXCLUDED",
                    )
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </Select>
                {!canChangePlayerStatus(user) && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Requiere departamento Risk o Support, rol Supervisor o superior.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {RESTRICTIONS.map(({ key, label }) => {
                  const value = player[key as keyof Player] as boolean;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleRestriction(key, !value)}
                      className={`flex-1 rounded-lg px-3 py-3 text-center text-sm font-semibold transition-colors ${
                        value
                          ? "bg-success text-success-foreground hover:bg-success/90"
                          : "bg-destructive hover:bg-destructive/90 text-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm">Dinero real</p>
                <p className="text-primary text-2xl font-bold tabular-nums">
                  {player.realBalance.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Dinero de bono</p>
                <p className="text-2xl font-bold tabular-nums">
                  {player.bonusBalance.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AML / Risk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Nivel de riesgo</p>
                <Select
                  value={player.riskLevel}
                  onChange={(e) => updateRiskLevel(e.target.value as RiskLevel)}
                  className="w-full"
                  disabled={!canChangePlayerRisk(user)}
                >
                  <option value="LOW">Bajo</option>
                  <option value="MEDIUM">Medio</option>
                  <option value="HIGH">Alto</option>
                </Select>
                {!canChangePlayerRisk(user) && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Requiere departamento Risk, rol Supervisor o superior.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">PEP</span>
                <span
                  className={
                    player.isPEP ? "text-destructive font-medium" : "text-muted-foreground"
                  }
                >
                  {player.isPEP ? "Sí" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SOF verificado</span>
                <span
                  className={
                    player.sofVerified ? "text-success font-medium" : "text-muted-foreground"
                  }
                >
                  {player.sofVerified ? "Sí" : "No"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
