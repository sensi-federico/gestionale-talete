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

// Interfaccia per il form di creazione/modifica materiale tubo
interface MaterialeTuboForm {
  name: string;
  description: string;
  isActive: boolean;
}

// Interfaccia per i dati del materiale tubo ricevuti dal backend
interface AdminMaterialeTubo {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Form vuoto per reset e nuova creazione
const emptyForm: MaterialeTuboForm = {
  name: "",
  description: "",
  isActive: true
};

const ITEMS_PER_PAGE = 10;

const AdminMaterialiTuboPage = () => {
  const { tokens } = useAuthStore();
  const currentRole = useAuthStore((s) => s.user?.role);
  const canEdit = currentRole === "admin";
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  
  // Stati del componente
  const [form, setForm] = useState<MaterialeTuboForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
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

  // Query per recuperare la lista dei materiali tubo
  const materialiQuery = useQuery<{ materialiTubo: AdminMaterialeTubo[] }>({
    queryKey: ["admin", "materiali-tubo"],
    queryFn: () => authorizedFetch<{ materialiTubo: AdminMaterialeTubo[] }>("/admin/materiali-tubo"),
    enabled: Boolean(tokens)
  });

  // Gestione errori caricamento
  useEffect(() => {
    if (materialiQuery.isError) {
      const message = materialiQuery.error instanceof Error ? materialiQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento materiali tubo fallito", description: message });
    }
  }, [materialiQuery.isError, materialiQuery.error, pushAlert]);

  // Calcolo paginazione
  const materiali = useMemo(() => materialiQuery.data?.materialiTubo ?? [], [materialiQuery.data]);
  
  // Filtra materiali
  const filteredMateriali = useMemo(() => {
    let result = materiali;
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(mat => 
        mat.name.toLowerCase().includes(searchLower) ||
        mat.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterActive) {
      const isActive = filterActive === "active";
      result = result.filter(mat => mat.isActive === isActive);
    }
    
    return result;
  }, [materiali, debouncedSearch, filterActive]);
  
  const totalPages = Math.ceil(filteredMateriali.length / ITEMS_PER_PAGE);
  const paginatedMateriali = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMateriali.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMateriali, currentPage]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterActive]);

  const hasFilters = searchQuery || filterActive;

  const resetFilters = () => {
    setSearchQuery("");
    setFilterActive("");
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
        await authorizedFetch(`/admin/materiali-tubo/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Materiale tubo aggiornato" });
      } else {
        await authorizedFetch("/admin/materiali-tubo", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Materiale tubo creato" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "materiali-tubo"] });
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
  const handleEdit = (materiale: AdminMaterialeTubo) => {
    setEditingId(materiale.id);
    setForm({
      name: materiale.name,
      description: materiale.description ?? "",
      isActive: materiale.isActive
    });
    setIsFormModalOpen(true);
  };

  // Eliminazione materiale tubo
  const handleDelete = async (id: string) => {
    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare materiale tubo?",
      message: "Questa azione è irreversibile. Il materiale tubo verrà rimosso definitivamente.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/materiali-tubo/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "materiali-tubo"] });
      pushAlert({ type: "success", title: "Materiale tubo eliminato" });
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

  // Toggle attivo/disattivo
  const handleToggleActive = async (materiale: AdminMaterialeTubo) => {
    try {
      await authorizedFetch(`/admin/materiali-tubo/${materiale.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: materiale.name,
          description: materiale.description ?? "",
          isActive: !materiale.isActive
        })
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "materiali-tubo"] });
      pushAlert({ 
        type: "success", 
        title: materiale.isActive ? "Materiale disattivato" : "Materiale attivato" 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore";
      pushAlert({ type: "error", title: "Operazione fallita", description: message });
    }
  };

  return (
    <div className="page-container admin-dashboard">
      <header className="page-heading">
        <div>
          <h1>Gestione materiali tubo</h1>
          <p>Amministra i tipi di materiale delle tubazioni disponibili nei rilevamenti.</p>
        </div>
        {canEdit && (
          <button type="button" className="button button--primary" onClick={openCreateForm}>
            + Aggiungi materiale
          </button>
        )}
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card">
        <div className="table-header">
          <div>
            <h2>Materiali tubo disponibili</h2>
            <p>Elenco dei materiali selezionabili nei rilevamenti.</p>
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
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="table-filters__select"
            >
              <option value="">Tutti gli stati</option>
              <option value="active">Solo attivi</option>
              <option value="inactive">Solo disattivi</option>
            </select>
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
              {filteredMateriali.length} risultat{filteredMateriali.length === 1 ? "o" : "i"} su {materiali.length} totali
            </p>
          )}
        </div>
        
        {materialiQuery.isLoading && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Caricamento...
          </div>
        )}
        
        {!materialiQuery.isLoading && filteredMateriali.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            {hasFilters ? "Nessun materiale corrisponde ai filtri." : "Nessun materiale tubo presente. Clicca \"Aggiungi materiale\" per crearne uno."}
          </div>
        )}
        
        {!materialiQuery.isLoading && filteredMateriali.length > 0 && (
          <div className="admin-cards-grid">
            {paginatedMateriali.map((mat) => (
              <div 
                key={mat.id} 
                className={`admin-card-item ${!mat.isActive ? "admin-card-item--disabled" : ""}`}
              >
                <div className="admin-card-item__header">
                  <span className="admin-card-item__icon">🔩</span>
                  <div className="admin-card-item__info">
                    <h4 className="admin-card-item__name">{mat.name}</h4>
                    {mat.description && (
                      <p className="admin-card-item__desc">{mat.description}</p>
                    )}
                  </div>
                </div>
                <span className={`admin-card-item__status ${mat.isActive ? "admin-card-item__status--active" : "admin-card-item__status--inactive"}`}>
                  {mat.isActive ? "✓ Attivo" : "Disattivo"}
                </span>
                <div className="admin-card-item__actions">
                  {canEdit ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn--icon" 
                        onClick={() => handleToggleActive(mat)}
                        title={mat.isActive ? "Disattiva" : "Attiva"}
                        style={{ background: mat.isActive ? "#fef2f2" : "#f0fdf4" }}
                      >
                        {mat.isActive ? "🔴" : "🟢"}
                      </button>
                      <button type="button" className="btn" onClick={() => handleEdit(mat)}>
                        ✏️ Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => handleDelete(mat.id)}
                        disabled={deletingId === mat.id}
                      >
                        {deletingId === mat.id ? "..." : "🗑️"}
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
            totalItems={filteredMateriali.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sui materiali tubo.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica materiale tubo" : "Nuovo materiale tubo"}
        description="Inserisci i dati del materiale delle tubazioni."
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome materiale (es. PVC, PE, Ghisa)"
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
            rows={2}
          />
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Materiale attivo (visibile nei rilevamenti)
            </label>
          </div>
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna materiale" : "Crea materiale")}
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

      <style>{`
        .row--disabled {
          opacity: 0.6;
        }
        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .badge--success {
          background: #d4edda;
          color: #155724;
        }
        .badge--secondary {
          background: #e2e3e5;
          color: #383d41;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .button--small {
          padding: 0.25rem 0.5rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AdminMaterialiTuboPage;
