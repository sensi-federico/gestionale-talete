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

// Interfaccia per il form di creazione/modifica tipo lavorazione
interface TipoLavorazioneForm {
  name: string;
  description: string;
}

// Interfaccia per i dati del tipo lavorazione ricevuti dal backend
interface AdminTipoLavorazione {
  id: string;
  name: string;
  description?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Form vuoto per reset e nuova creazione
const emptyForm: TipoLavorazioneForm = {
  name: "",
  description: ""
};

const ITEMS_PER_PAGE = 10;

const AdminTipiLavorazionePage = () => {
  const { tokens } = useAuthStore();
  const currentRole = useAuthStore((s) => s.user?.role);
  const canEdit = currentRole === "admin";
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  
  // Stati del componente
  const [form, setForm] = useState<TipoLavorazioneForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Funzione per chiamate API autenticate
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

  // Query per recuperare la lista dei tipi lavorazione
  const tipiQuery = useQuery<{ tipiLavorazione: AdminTipoLavorazione[] }>({
    queryKey: ["admin", "tipi-lavorazione"],
    queryFn: () => authorizedFetch<{ tipiLavorazione: AdminTipoLavorazione[] }>("/admin/tipi-lavorazione"),
    enabled: Boolean(tokens)
  });

  // Gestione errori caricamento
  useEffect(() => {
    if (tipiQuery.isError) {
      const message = tipiQuery.error instanceof Error ? tipiQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento tipi lavorazione fallito", description: message });
    }
  }, [tipiQuery.isError, tipiQuery.error, pushAlert]);

  // Calcolo paginazione
  const tipi = useMemo(() => tipiQuery.data?.tipiLavorazione ?? [], [tipiQuery.data]);
  
  // Filtra tipi
  const filteredTipi = useMemo(() => {
    if (!debouncedSearch) return tipi;
    
    const searchLower = debouncedSearch.toLowerCase();
    return tipi.filter(tipo => 
      tipo.name.toLowerCase().includes(searchLower) ||
      tipo.description?.toLowerCase().includes(searchLower)
    );
  }, [tipi, debouncedSearch]);
  
  const totalPages = Math.ceil(filteredTipi.length / ITEMS_PER_PAGE);
  const paginatedTipi = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTipi.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTipi, currentPage]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const hasFilters = searchQuery;

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Reset del form
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(false);
  };

  // Apertura form per creazione
  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  // Invio form (creazione o modifica)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await authorizedFetch(`/admin/tipi-lavorazione/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Tipo lavorazione aggiornato" });
      } else {
        await authorizedFetch("/admin/tipi-lavorazione", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Tipo lavorazione creato" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "tipi-lavorazione"] });
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

  // Apertura form per modifica
  const handleEdit = (tipo: AdminTipoLavorazione) => {
    setEditingId(tipo.id);
    setForm({
      name: tipo.name,
      description: tipo.description ?? ""
    });
    setIsFormModalOpen(true);
  };

  // Eliminazione tipo lavorazione
  const handleDelete = async (id: string) => {
    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare tipo lavorazione?",
      message: "Questa azione è irreversibile. Il tipo lavorazione verrà rimosso definitivamente. Nota: se esistono rilevamenti associati a questo tipo, l'eliminazione potrebbe fallire.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/tipi-lavorazione/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "tipi-lavorazione"] });
      pushAlert({ type: "success", title: "Tipo lavorazione eliminato" });
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
          <h1>Gestione tipi lavorazione</h1>
          <p>Amministra le tipologie di intervento disponibili nei rilevamenti.</p>
        </div>
        {canEdit && (
          <button type="button" className="button button--primary" onClick={openCreateForm}>
            + Aggiungi tipo
          </button>
        )}
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card">
        <div className="table-header">
          <div>
            <h2>Tipi lavorazione disponibili</h2>
            <p>Elenco delle tipologie di intervento selezionabili nei rilevamenti.</p>
          </div>
        </div>
        
        {/* Filtri */}
        <div className="table-filters">
          <div className="table-filters__row">
            <input
              type="text"
              placeholder="Cerca per nome o descrizione..."
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
              {filteredTipi.length} risultat{filteredTipi.length === 1 ? "o" : "i"} su {tipi.length} totali
            </p>
          )}
        </div>
        
        {tipiQuery.isLoading && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Caricamento...
          </div>
        )}
        
        {!tipiQuery.isLoading && filteredTipi.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            {hasFilters ? "Nessun tipo lavorazione corrisponde ai filtri." : "Nessun tipo lavorazione presente. Clicca \"Aggiungi tipo\" per crearne uno."}
          </div>
        )}
        
        {!tipiQuery.isLoading && filteredTipi.length > 0 && (
          <div className="admin-cards-grid">
            {paginatedTipi.map((tipo) => (
              <div key={tipo.id} className="admin-card-item">
                <div className="admin-card-item__header">
                  <span className="admin-card-item__icon">🔧</span>
                  <div className="admin-card-item__info">
                    <h4 className="admin-card-item__name">{tipo.name}</h4>
                    {tipo.description && (
                      <p className="admin-card-item__desc">{tipo.description}</p>
                    )}
                  </div>
                </div>
                <div className="admin-card-item__actions">
                  {canEdit ? (
                    <>
                      <button type="button" className="btn" onClick={() => handleEdit(tipo)}>
                        ✏️ Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => handleDelete(tipo.id)}
                        disabled={deletingId === tipo.id}
                      >
                        {deletingId === tipo.id ? "..." : "🗑️"}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTipi.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sui tipi lavorazione.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica tipo lavorazione" : "Nuovo tipo lavorazione"}
        description="Inserisci i dati del tipo di lavorazione."
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome tipo lavorazione"
            value={form.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <textarea
            placeholder="Descrizione (opzionale)"
            value={form.description}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={3}
          />
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna tipo" : "Crea tipo")}
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

export default AdminTipiLavorazionePage;
