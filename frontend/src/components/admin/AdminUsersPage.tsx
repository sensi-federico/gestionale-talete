import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useReferenceData } from "../../hooks/useOfflineCache";
import AdminStatusBanner from "./AdminStatusBanner";
import AdminActivityLog from "./AdminActivityLog";
import ConfirmModal from "../ui/ConfirmModal";
import FormModal from "../ui/FormModal";
import Pagination from "../ui/Pagination";

type UserRole = "operaio" | "admin" | "impresa";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  impresaId?: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const emptyForm = {
  email: "",
  fullName: "",
  password: "",
  role: "operaio" as UserRole,
  impresaId: ""
};

const ITEMS_PER_PAGE = 10;

const AdminUsersPage = () => {
  const { tokens, user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  const referenceData = useReferenceData();
  const imprese = referenceData.data?.imprese ?? [];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);


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

  const usersQuery = useQuery<{ users: AdminUser[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => authorizedFetch<{ users: AdminUser[] }>("/admin/users"),
    enabled: Boolean(tokens)
  });

  useEffect(() => {
    if (usersQuery.isError) {
      const message = usersQuery.error instanceof Error ? usersQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento utenti fallito", description: message });
    }
  }, [usersQuery.isError, usersQuery.error, pushAlert]);

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(start, start + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(false);
  };

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tokens) {
      pushAlert({ type: "error", title: "Sessione scaduta", description: "Accedi nuovamente" });
      return;
    }

    if (!editingId && form.password.trim().length < 8) {
      pushAlert({
        type: "error",
        title: "Password troppo corta",
        description: "La password deve contenere almeno 8 caratteri"
      });
      return;
    }

    if (editingId && form.password && form.password.trim().length > 0 && form.password.trim().length < 8) {
      pushAlert({
        type: "error",
        title: "Password troppo corta",
        description: "La nuova password deve contenere almeno 8 caratteri"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const payload = {
          email: form.email,
          fullName: form.fullName,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
          ...(form.role === "impresa" && form.impresaId ? { impresaId: form.impresaId } : { impresaId: null })
        };
        await authorizedFetch(`/admin/users/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        pushAlert({ type: "success", title: "Utente aggiornato" });
      } else {
        await authorizedFetch("/auth/users", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Utente creato" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      email: user.email,
      fullName: user.fullName,
      password: "",
      role: user.role,
      impresaId: user.impresaId || ""
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Impedisci all'admin di eliminare se stesso
    if (currentUser?.id === id) {
      pushAlert({ 
        type: "error", 
        title: "Operazione non consentita", 
        description: "Non puoi eliminare il tuo stesso account" 
      });
      return;
    }

    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare utente?",
      message: "Questa azione è irreversibile. L'utente non potrà più accedere al sistema.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/users/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      pushAlert({ type: "success", title: "Utente eliminato" });
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

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return "Mai";
    }
    return new Date(value).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="page-container admin-dashboard">
      <header className="page-heading">
        <div>
          <h1>Gestione utenti</h1>
          <p>Crea, modifica ed elimina gli account operativi del gestionale.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreateForm}>
          + Aggiungi utente
        </button>
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card card--table">
        <div className="table-header">
          <div>
            <h2>Utenti registrati</h2>
            <p>Elenco completo degli account con ruolo e ultimo accesso.</p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Ultimo accesso</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading && (
                <tr>
                  <td colSpan={5}>Caricamento...</td>
                </tr>
              )}
              {!usersQuery.isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5}>Nessun utente presente.</td>
                </tr>
              )}
              {paginatedUsers.map((user) => {
                const roleLabel = user.role === "operaio" ? "Tecnico" : user.role === "impresa" ? "Impresa" : "Admin";
                return (
                <tr key={user.id}>
                  <td data-label="Nome">{user.fullName || "—"}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Ruolo">{roleLabel}</td>
                  <td data-label="Ultimo accesso">{formatDateTime(user.lastSignInAt)}</td>
                  <td data-label="Azione">
                    <div className="table-actions">
                      <button type="button" className="button button--ghost" onClick={() => handleEdit(user)}>
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => handleDelete(user.id)}
                        disabled={deletingId === user.id || currentUser?.id === user.id}
                        title={currentUser?.id === user.id ? "Non puoi eliminare te stesso" : undefined}
                      >
                        {deletingId === user.id ? "Elimino..." : "Elimina"}
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={users.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sulla gestione utenti.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica utente" : "Nuovo utente"}
        description={`Compila i campi per ${editingId ? "aggiornare" : "creare"} le credenziali di accesso.`}
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome completo"
            value={form.fullName}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, fullName: event.target.value }))
            }
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <div className="form-grid">
            <input
              placeholder={editingId ? "Nuova password (min 8 caratteri)" : "Password temporanea (min 8 caratteri)"}
              type="password"
              value={form.password}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required={!editingId}
            />
            <select
              value={form.role}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, role: event.target.value as UserRole, impresaId: "" }))
              }
            >
              <option value="operaio">Tecnico</option>
              <option value="impresa">Impresa</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === "impresa" && (
            <select
              value={form.impresaId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, impresaId: event.target.value }))
              }
              required
            >
              <option value="">Seleziona impresa...</option>
              {imprese.map((imp) => (
                <option key={imp.id} value={imp.id}>{imp.name}</option>
              ))}
            </select>
          )}
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna utente" : "Crea utente")}
            </button>
            {editingId && (
              <button type="button" className="button button--ghost" onClick={resetForm} disabled={isSubmitting}>
                Annulla modifica
              </button>
            )}
          </div>
        </form>
      </FormModal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.handleConfirm}
        onCancel={confirmModal.handleCancel}
      />
    </div>
  );
};

export default AdminUsersPage;
