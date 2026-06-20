"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/Select";

interface Payment {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  accountNumber: string | null;
  reference: string | null;
  notes: string | null;
  processedAt: string | null;
  createdAt: string;
}

interface PaymentsTabProps {
  playerId: number;
  accessToken: string | null;
  onUpdate: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  ERROR: "Error",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-orange-500/20 text-orange-400",
  APPROVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-destructive/20 text-destructive",
  ERROR: "bg-destructive/20 text-destructive",
};

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retiro",
};

export default function PaymentsTab({ playerId, accessToken, onUpdate }: PaymentsTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "DEPOSIT",
    amount: "",
    currency: "EUR",
    status: "PENDING",
    paymentMethod: "",
    accountNumber: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/payments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setPayments(data);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setForm({ type: "DEPOSIT", amount: "", currency: "EUR", status: "PENDING", paymentMethod: "", accountNumber: "", reference: "", notes: "" });
    setShowForm(false);
    fetchPayments();
  }

async function updateStatus(paymentId: number, status: string) {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/payments/${paymentId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status }),
  });
  fetchPayments();
  onUpdate();
}

  if (loadingPayments) {
    return <p className="text-muted-foreground text-sm">Cargando pagos...</p>;
  }

  const totalDeposits = payments.filter(p => p.type === "DEPOSIT" && p.status === "APPROVED").reduce((sum, p) => sum + p.amount, 0);
  const totalWithdrawals = payments.filter(p => p.type === "WITHDRAWAL" && p.status === "APPROVED").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total depositado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">{totalDeposits.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total retirado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-400">{totalWithdrawals.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <div className="flex items-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Añadir transacción"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva transacción</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="DEPOSIT">Depósito</option>
                  <option value="WITHDRAWAL">Retiro</option>
                </Select>
                <Input type="number" step="0.01" placeholder="Importe" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Método de pago (Visa, Trustly...)" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} />
                <Input placeholder="Número de cuenta / tarjeta" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <Input placeholder="Referencia de transacción" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobado</option>
                <option value="REJECTED">Rechazado</option>
              </Select>
              <Button type="submit">Guardar transacción</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Importe</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Método</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Referencia</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay transacciones</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/30">
                    <td className="px-4 py-3">{TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 font-medium">{p.amount.toFixed(2)} {p.currency}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.paymentMethod ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.reference ?? "—"}</td>
                    <td className="px-4 py-3">
                      {p.status === "PENDING" ? (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(p.id, "APPROVED")} className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30">Aprobar</button>
                          <button onClick={() => updateStatus(p.id, "REJECTED")} className="px-2 py-1 rounded text-xs bg-destructive/20 text-destructive hover:bg-destructive/30">Rechazar</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("es-ES")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}