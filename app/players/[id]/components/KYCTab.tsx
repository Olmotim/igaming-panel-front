"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";

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
}

const DOC_STATUS_LABELS: Record<string, string> = {
  NOT_REQUESTED: "No solicitado",
  PENDING: "Pendiente",
  VERIFIED: "Verificado",
  REJECTED: "Rechazado",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  NOT_REQUESTED: "bg-muted text-muted-foreground",
  PENDING: "bg-orange-500/20 text-orange-400",
  VERIFIED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-destructive/20 text-destructive",
};

const KYC_LEVEL_LABELS: Record<string, string> = {
  NONE: "Sin verificar",
  BASIC: "Básico",
  ENHANCED: "Mejorado",
  FULL: "Completo",
};

export default function KYCTab({ playerId, accessToken }: KYCTabProps) {
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [editingId, setEditingId] = useState(false);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/kyc`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKyc(data);
        if (data) {
          setIdForm({
            idDocType: data.idDocType ?? "",
            idDocNumber: data.idDocNumber ?? "",
            idDocExpiry: data.idDocExpiry ? data.idDocExpiry.split("T")[0] : "",
            idDocIssuingCountry: data.idDocIssuingCountry ?? "",
          });
        }
      }
    } finally {
      setLoadingKyc(false);
    }
  }

  async function updateKYC(data: Record<string, unknown>) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/kyc`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    fetchKYC();
  }

  async function saveIdDoc(e: React.FormEvent) {
    e.preventDefault();
    await updateKYC({ ...idForm, idDocStatus: "PENDING" });
    setEditingId(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documento de identidad</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${DOC_STATUS_COLORS[kyc?.idDocStatus ?? "NOT_REQUESTED"]}`}>
                {DOC_STATUS_LABELS[kyc?.idDocStatus ?? "NOT_REQUESTED"]}
              </span>
              <Button size="sm" variant="outline" onClick={() => setEditingId(!editingId)}>
                {editingId ? "Cancelar" : "Editar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editingId ? (
              <form onSubmit={saveIdDoc} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={idForm.idDocType} onChange={(e) => setIdForm({ ...idForm, idDocType: e.target.value })}>
                    <option value="">Tipo de documento</option>
                    <option value="PASSPORT">Pasaporte</option>
                    <option value="NATIONAL_ID">DNI / ID Nacional</option>
                    <option value="DRIVERS_LICENSE">Carnet de conducir</option>
                  </Select>
                  <Input placeholder="Número de documento" value={idForm.idDocNumber} onChange={(e) => setIdForm({ ...idForm, idDocNumber: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" placeholder="Fecha de expiración" value={idForm.idDocExpiry} onChange={(e) => setIdForm({ ...idForm, idDocExpiry: e.target.value })} />
                  <Input placeholder="País emisor" value={idForm.idDocIssuingCountry} onChange={(e) => setIdForm({ ...idForm, idDocIssuingCountry: e.target.value })} />
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
                  <p className="font-medium">{kyc?.idDocExpiry ? new Date(kyc.idDocExpiry).toLocaleDateString("es-ES") : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">País emisor</p>
                  <p className="font-medium">{kyc?.idDocIssuingCountry ?? "—"}</p>
                </div>
              </div>
            )}
            {kyc?.idDocStatus === "PENDING" && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => updateKYC({ idDocStatus: "VERIFIED" })}>Verificar</Button>
                <Button size="sm" variant="outline" onClick={() => updateKYC({ idDocStatus: "REJECTED" })}>Rechazar</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {poaVisible && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Justificante de domicilio (POA)</CardTitle>
              <span className={`px-2 py-1 rounded text-xs font-medium ${DOC_STATUS_COLORS[kyc!.poaDocStatus]}`}>
                {DOC_STATUS_LABELS[kyc!.poaDocStatus]}
              </span>
            </CardHeader>
            <CardContent>
              {kyc!.poaDocStatus === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateKYC({ poaDocStatus: "VERIFIED" })}>Verificar</Button>
                  <Button size="sm" variant="outline" onClick={() => updateKYC({ poaDocStatus: "REJECTED" })}>Rechazar</Button>
                </div>
              )}
              {kyc!.poaDocStatus === "REJECTED" && (
                <Button size="sm" variant="outline" onClick={() => updateKYC({ poaDocStatus: "PENDING" })}>Solicitar de nuevo</Button>
              )}
            </CardContent>
          </Card>
        )}

        {sofVisible && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Origen de fondos (SOF)</CardTitle>
              <span className={`px-2 py-1 rounded text-xs font-medium ${DOC_STATUS_COLORS[kyc!.sofDocStatus]}`}>
                {DOC_STATUS_LABELS[kyc!.sofDocStatus]}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {kyc?.sofDescription && (
                <p className="text-sm text-muted-foreground">{kyc.sofDescription}</p>
              )}
              {kyc!.sofDocStatus === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateKYC({ sofDocStatus: "VERIFIED" })}>Verificar</Button>
                  <Button size="sm" variant="outline" onClick={() => updateKYC({ sofDocStatus: "REJECTED" })}>Rechazar</Button>
                </div>
              )}
              {kyc!.sofDocStatus === "REJECTED" && (
                <Button size="sm" variant="outline" onClick={() => updateKYC({ sofDocStatus: "PENDING" })}>Solicitar de nuevo</Button>
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
            <Select value={kyc?.kycLevel ?? "NONE"} onChange={(e) => updateKYC({ kycLevel: e.target.value })} className="w-full">
              {Object.entries(KYC_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Solicitar documentos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!poaVisible && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => requestDoc("poaDocStatus")}>
                Solicitar justificante de domicilio
              </Button>
            )}
            {!sofVisible && (
              <Button size="sm" variant="outline" className="w-full" onClick={() => requestDoc("sofDocStatus")}>
                Solicitar origen de fondos
              </Button>
            )}
            {poaVisible && sofVisible && (
              <p className="text-sm text-muted-foreground">Todos los documentos ya han sido solicitados.</p>
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
              <p className="font-medium">{kyc?.reviewedAt ? new Date(kyc.reviewedAt).toLocaleString("es-ES") : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Revisado por</p>
              <p className="font-medium">{kyc?.reviewedBy?.email ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}