import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import AdminStatusBanner from "./AdminStatusBanner";
import AdminActivityLog from "./AdminActivityLog";
import ConfirmModal from "../ui/ConfirmModal";
import FormModal from "../ui/FormModal";
import Pagination from "../ui/Pagination";

interface ComuneForm {
  name: string;
  province: string;
  region: string;
}

interface AdminComune {
  id: string;
  name: string;
  province: string;
  region: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const emptyForm: ComuneForm = {
  name: "",
  province: "",
  region: ""
};

const ITEMS_PER_PAGE = 10;

const AdminComuniPage = () => {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  const [form, setForm] = useState<ComuneForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

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

  const comuniQuery = useQuery<{ comuni: AdminComune[] }>({
    queryKey: ["admin", "comuni"],
    queryFn: () => authorizedFetch<{ comuni: AdminComune[] }>("/admin/comuni"),
    enabled: Boolean(tokens)
  });

  useEffect(() => {
    if (comuniQuery.isError) {
      const message = comuniQuery.error instanceof Error ? comuniQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento comuni fallito", description: message });
    }
  }, [comuniQuery.isError, comuniQuery.error, pushAlert]);

  const comuni = useMemo(() => comuniQuery.data?.comuni ?? [], [comuniQuery.data]);
  
  // Filtra comuni
  const filteredComuni = useMemo(() => {
    if (!debouncedSearch) return comuni;
    
    const searchLower = debouncedSearch.toLowerCase();
    return comuni.filter(comune => 
      comune.name.toLowerCase().includes(searchLower) ||
      comune.province.toLowerCase().includes(searchLower) ||
      comune.region.toLowerCase().includes(searchLower)
    );
  }, [comuni, debouncedSearch]);
  
  const totalPages = Math.ceil(filteredComuni.length / ITEMS_PER_PAGE);
  const paginatedComuni = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredComuni.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredComuni, currentPage]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const hasFilters = searchQuery;

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

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
    setIsSubmitting(true);
    try {
      if (editingId) {
        await authorizedFetch(`/admin/comuni/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Comune aggiornato" });
      } else {
        await authorizedFetch("/admin/comuni", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Comune creato" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "comuni"] });
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

  const handleEdit = (comune: AdminComune) => {
    setEditingId(comune.id);
    setForm({
      name: comune.name,
      province: comune.province,
      region: comune.region
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare comune?",
      message: "Questa azione è irreversibile. Il comune verrà rimosso definitivamente.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/comuni/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "comuni"] });
      pushAlert({ type: "success", title: "Comune eliminato" });
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
          <h1>Gestione comuni</h1>
          <p>Amministra l&apos;anagrafica territoriale disponibile ai rilevatori.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreateForm}>
          + Aggiungi comune
        </button>
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card card--table">
        <div className="table-header">
          <div>
            <h2>Comuni disponibili</h2>
            <p>Elenco completo dei comuni abilitati ai rilevamenti.</p>
          </div>
        </div>
        
        {/* Filtri */}
        <div className="table-filters">
          <div className="table-filters__row">
            <input
              type="text"
              placeholder="Cerca per nome, provincia o regione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="table-filters__search"
            />
            {hasFilters && (
              <button
                type="button"
                className="button button--ghost"
                onClick={resetFilters}
              >
                Cancella filtri
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="table-filters__count">
              {filteredComuni.length} risultat{filteredComuni.length === 1 ? "o" : "i"} su {comuni.length} totali
            </p>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Provincia</th>
                <th>Regione</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {comuniQuery.isLoading && (
                <tr>
                  <td colSpan={4}>Caricamento...</td>
                </tr>
              )}
              {!comuniQuery.isLoading && filteredComuni.length === 0 && (
                <tr>
                  <td colSpan={4}>{hasFilters ? "Nessun comune corrisponde ai filtri." : "Nessun comune presente."}</td>
                </tr>
              )}
              {paginatedComuni.map((comune) => (
                <tr key={comune.id}>
                  <td data-label="Nome">{comune.name}</td>
                  <td data-label="Provincia">{comune.province}</td>
                  <td data-label="Regione">{comune.region}</td>
                  <td data-label="Azione">
                    <div className="table-actions">
                      <button type="button" className="button button--ghost" onClick={() => handleEdit(comune)}>
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        onClick={() => handleDelete(comune.id)}
                        disabled={deletingId === comune.id}
                      >
                        {deletingId === comune.id ? "Elimino..." : "Elimina"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredComuni.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sull&apos;anagrafica comuni.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica comune" : "Nuovo comune"}
        description="Compila i dati anagrafici del comune per renderlo disponibile ai rilevamenti."
        onClose={resetForm}
      >
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
              placeholder="Provincia"
              value={form.province}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, province: event.target.value }))
              }
              required
            />
            <input
              placeholder="Regione"
              value={form.region}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, region: event.target.value }))
              }
              required
            />
          </div>
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna comune" : "Crea comune")}
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

export default AdminComuniPage;
