"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";
import { apiFetch, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/user";
import { canAccessKyc, canDecideKyc } from "@/lib/permissions";

interface KYC {
  id: number;
  kycLevel: string;
  idDocType: string | null;
  idDocNumber: string | null;
  idDocExpiry: string | null;
  idDocIssuingCountry: string | null;
  idDocStatus: string;
  poaDocStatus: string;
  sofDocStatus: string;
  sofDescription: string | null;
  pepStatus: string;
  pepNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: { id: number; email: string } | null;
}

interface KYCTabProps {
  playerId: number;
  accessToken: string | null;
  user: AuthUser | null;
}

const DOC_STATUS_LABELS: Record<string, string> = {
  NOT_REQUESTED: "No solicitado",
  PENDING: "Pendiente",
  APPROVED: "Verificado",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  NOT_REQUESTED: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/20 text-warning",
  APPROVED: "bg-success/20 text-success",
  VERIFIED: "bg-success/20 text-success",
  REJECTED: "bg-destructive/20 text-destructive",
};

const KYC_LEVEL_LABELS: Record<string, string> = {
  NONE: "Sin verificar",
  TIER_1: "Nivel 1",
  TIER_2: "Nivel 2",
  TIER_3: "Nivel 3",
};

export default function KYCTab({ playerId, accessToken, user }: KYCTabProps) {
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [editingId, setEditingId] = useState(false);
  const [error, setError] = useState("");
  const [idForm, setIdForm] = useState({
    idDocType: "",
    idDocNumber: "",
    idDocExpiry: "",
    idDocIssuingCountry: "",
  });

  useEffect(() => {
    fetchKYC();
  }, []);

  async function fetchKYC() {
    try {
      const data = await apiFetch<KYC | null>(`/players/${playerId}/kyc`, { accessToken });
      setKyc(data);
      if (data) {
        setIdForm({
          idDocType: data.idDocType ?? "",
          idDocNumber: data.idDocNumber ?? "",
          idDocExpiry: data.idDocExpiry ? data.idDocExpiry.split("T")[0] : "",
          idDocIssuingCountry: data.idDocIssuingCountry ?? "",
        });
      }
    } finally {
      setLoadingKyc(false);
    }
  }

  async function updateKYC(data: Record<string, unknown>): Promise<boolean> {
    setError("");
    try {
      await apiFetch(`/players/${playerId}/kyc`, { method: "PUT", accessToken, body: data });
      fetchKYC();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar el KYC");
      return false;
    }
  }

  async function saveIdDoc(e: React.FormEvent) {
    e.preventDefault();
    const ok = await updateKYC({ ...idForm, idDocStatus: "PENDING" });
    if (ok) setEditingId(false);
  }

  async function requestDoc(field: "poaDocStatus" | "sofDocStatus") {
    await updateKYC({ [field]: "PENDING" });
  }

  if (loadingKyc) {
    return <p className="text-muted-foreground text-sm">Cargando KYC...</p>;
  }

  const poaVisible = kyc && kyc.poaDocStatus !== "NOT_REQUESTED";
  const sofVisible = kyc && kyc.sofDocStatus !== "NOT_REQUESTED";

  return (
    <div className="space-y-4">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Documento de identidad</CardTitle>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${DOC_STATUS_COLORS[kyc?.idDocStatus ?? "NOT_REQUESTED"]}`}
                >
                  {DOC_STATUS_LABELS[kyc?.idDocStatus ?? "NOT_REQUESTED"]}
                </span>
                {canAccessKyc(user) && (
                  <Button size="sm" variant="outline" onClick={() => setEditingId(!editingId)}>
                    {editingId ? "Cancelar" : "Editar"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId ? (
                <form onSubmit={saveIdDoc} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={idForm.idDocType}
                      onChange={(e) => setIdForm({ ...idForm, idDocType: e.target.value })}
                    >
                      <option value="">Tipo de documento</option>
                      <option value="PASSPORT">Pasaporte</option>
                      <option value="NATIONAL_ID">DNI / ID Nacional</option>
                      <option value="DRIVERS_LICENSE">Carnet de conducir</option>
                    </Select>
                    <Input
                      placeholder="Número de documento"
                      value={idForm.idDocNumber}
                      onChange={(e) => setIdForm({ ...idForm, idDocNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      placeholder="Fecha de expiración"
                      value={idForm.idDocExpiry}
                      onChange={(e) => setIdForm({ ...idForm, idDocExpiry: e.target.value })}
                    />
                    <Input
                      placeholder="País emisor"
                      value={idForm.idDocIssuingCountry}
                      onChange={(e) =>
                        setIdForm({ ...idForm, idDocIssuingCountry: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit">Guardar y marcar como pendiente</Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{kyc?.idDocType ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Número</p>
                    <p className="font-medium">{kyc?.idDocNumber ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiración</p>
                    <p className="font-medium">
                      {kyc?.idDocExpiry
                        ? new Date(kyc.idDocExpiry).toLocaleDateString("es-ES")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">País emisor</p>
                    <p className="font-medium">{kyc?.idDocIssuingCountry ?? "—"}</p>
                  </div>
                </div>
              )}
              {kyc?.idDocStatus === "PENDING" && canDecideKyc(user) && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => updateKYC({ idDocStatus: "APPROVED" })}>
                    Verificar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateKYC({ idDocStatus: "REJECTED" })}
                  >
                    Rechazar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {poaVisible && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Justificante de domicilio (POA)</CardTitle>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${DOC_STATUS_COLORS[kyc!.poaDocStatus]}`}
                >
                  {DOC_STATUS_LABELS[kyc!.poaDocStatus]}
                </span>
              </CardHeader>
              <CardContent>
                {kyc!.poaDocStatus === "PENDING" && canDecideKyc(user) && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateKYC({ poaDocStatus: "VERIFIED" })}>
                      Verificar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateKYC({ poaDocStatus: "REJECTED" })}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
                {kyc!.poaDocStatus === "REJECTED" && canAccessKyc(user) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateKYC({ poaDocStatus: "PENDING" })}
                  >
                    Solicitar de nuevo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {sofVisible && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Origen de fondos (SOF)</CardTitle>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${DOC_STATUS_COLORS[kyc!.sofDocStatus]}`}
                >
                  {DOC_STATUS_LABELS[kyc!.sofDocStatus]}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {kyc?.sofDescription && (
                  <p className="text-muted-foreground text-sm">{kyc.sofDescription}</p>
                )}
                {kyc!.sofDocStatus === "PENDING" && canDecideKyc(user) && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateKYC({ sofDocStatus: "VERIFIED" })}>
                      Verificar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateKYC({ sofDocStatus: "REJECTED" })}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
                {kyc!.sofDocStatus === "REJECTED" && canAccessKyc(user) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateKYC({ sofDocStatus: "PENDING" })}
                  >
                    Solicitar de nuevo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nivel KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={kyc?.kycLevel ?? "NONE"}
                onChange={(e) => updateKYC({ kycLevel: e.target.value })}
                className="w-full"
                disabled={!canAccessKyc(user)}
              >
                {Object.entries(KYC_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {!canAccessKyc(user) && (
                <p className="text-muted-foreground mt-1 text-xs">Requiere departamento KYC.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solicitar documentos adicionales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!canAccessKyc(user) ? (
                <p className="text-muted-foreground text-sm">Requiere departamento KYC.</p>
              ) : (
                <>
                  {!poaVisible && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => requestDoc("poaDocStatus")}
                    >
                      Solicitar justificante de domicilio
                    </Button>
                  )}
                  {!sofVisible && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => requestDoc("sofDocStatus")}
                    >
                      Solicitar origen de fondos
                    </Button>
                  )}
                  {poaVisible && sofVisible && (
                    <p className="text-muted-foreground text-sm">
                      Todos los documentos ya han sido solicitados.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auditoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Última revisión</p>
                <p className="font-medium">
                  {kyc?.reviewedAt ? new Date(kyc.reviewedAt).toLocaleString("es-ES") : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Revisado por</p>
                <p className="font-medium">{kyc?.reviewedBy?.email ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
