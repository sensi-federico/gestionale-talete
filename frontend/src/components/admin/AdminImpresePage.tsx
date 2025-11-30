import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import AdminStatusBanner from "./AdminStatusBanner";
import AdminActivityLog from "./AdminActivityLog";

interface ImpresaForm {
  name: string;
  partitaIva: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface AdminImpresa {
  id: string;
  name: string;
  partita_iva: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const emptyForm: ImpresaForm = {
  name: "",
  partitaIva: "",
  phone: "",
  email: "",
  address: ""
};

const AdminImpresePage = () => {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const [form, setForm] = useState<ImpresaForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authorizedFetch = async <T,>(path: string, init?: RequestInit) => {
    if (!tokens) {
      throw new Error("Token mancante");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(init?.headers as Record<string, string> | undefined)
    };

    if (init?.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Richiesta fallita");
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  };

  const impreseQuery = useQuery<{ imprese: AdminImpresa[] }>({
    queryKey: ["admin", "imprese"],
    queryFn: () => authorizedFetch<{ imprese: AdminImpresa[] }>("/admin/imprese"),
    enabled: Boolean(tokens)
  });

  useEffect(() => {
    if (impreseQuery.isError) {
      const message = impreseQuery.error instanceof Error ? impreseQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento imprese fallito", description: message });
    }
  }, [impreseQuery.isError, impreseQuery.error, pushAlert]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        partitaIva: form.partitaIva,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined
      };

      if (editingId) {
        await authorizedFetch(`/admin/imprese/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        pushAlert({ type: "success", title: "Impresa aggiornata" });
      } else {
        await authorizedFetch("/admin/imprese", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        pushAlert({ type: "success", title: "Impresa registrata" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "imprese"] });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore";
      pushAlert({
        type: "error",
        title: editingId ? "Aggiornamento fallito" : "Creazione fallita",
        description: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (impresa: AdminImpresa) => {
    setEditingId(impresa.id);
    setForm({
      name: impresa.name,
      partitaIva: impresa.partita_iva,
      phone: impresa.phone ?? "",
      email: impresa.email ?? "",
      address: impresa.address ?? ""
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare definitivamente l'impresa?")) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/imprese/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "imprese"] });
      pushAlert({ type: "success", title: "Impresa eliminata" });
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore";
      pushAlert({ type: "error", title: "Eliminazione fallita", description: message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container admin-dashboard">
      <header className="page-heading">
        <div>
          <h1>Gestione imprese</h1>
          <p>Registra e aggiorna le aziende incaricate delle attività sul territorio.</p>
        </div>
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card card--form">
        <div className="card-heading">
          <h2>{editingId ? "Modifica impresa" : "Nuova impresa"}</h2>
          <p>Completa i dati dell&apos;azienda per consentire l&apos;assegnazione nei rilevamenti.</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome"
            value={form.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <div className="form-grid">
            <input
              placeholder="Partita IVA"
              value={form.partitaIva}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, partitaIva: event.target.value }))
              }
              required
              maxLength={11}
            />
            <input
              placeholder="Telefono"
              value={form.phone ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </div>
          <div className="form-grid">
            <input
              placeholder="Email"
              value={form.email ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              type="email"
            />
            <input
              placeholder="Indirizzo"
              value={form.address ?? ""}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
            />
          </div>
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {editingId ? "Aggiorna impresa" : "Crea impresa"}
            </button>
            {editingId && (
              <button type="button" className="button button--ghost" onClick={resetForm} disabled={isSubmitting}>
                Annulla modifica
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card card--table">
        <div className="table-header">
          <div>
            <h2>Imprese registrate</h2>
            <p>Catalogo delle aziende disponibili per l&apos;assegnazione degli interventi.</p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Partita IVA</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {impreseQuery.isLoading && (
                <tr>
                  <td colSpan={5}>Caricamento...</td>
                </tr>
              )}
              {!impreseQuery.isLoading && (impreseQuery.data?.imprese.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5}>Nessuna impresa presente.</td>
                </tr>
              )}
              {impreseQuery.data?.imprese.map((impresa) => (
                <tr key={impresa.id}>
                  <td data-label="Nome">{impresa.name}</td>
                  <td data-label="Partita IVA">{impresa.partita_iva}</td>
                  <td data-label="Email">{impresa.email ?? "—"}</td>
                  <td data-label="Telefono">{impresa.phone ?? "—"}</td>
                  <td data-label="Azione">
                    <div className="table-actions">
                      <button type="button" className="button button--ghost" onClick={() => handleEdit(impresa)}>
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => handleDelete(impresa.id)}
                        disabled={deletingId === impresa.id}
                      >
                        {deletingId === impresa.id ? "Elimino..." : "Elimina"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sulla gestione imprese.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>
    </div>
  );
};

export default AdminImpresePage;
