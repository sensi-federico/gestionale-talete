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

// Interfaccia per il form di creazione/modifica mezzo
interface MezzoForm {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// Interfaccia per i dati del mezzo ricevuti dal backend
interface AdminMezzo {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Form vuoto per reset e nuova creazione
const emptyForm: MezzoForm = {
  name: "",
  description: "",
  icon: "",
  isActive: true
};

const ITEMS_PER_PAGE = 10;

// Emoji comuni per i mezzi di lavoro
const EMOJI_SUGGESTIONS = ["🚛", "🚐", "🚚", "🚜", "🚧", "🏗️", "🚗", "🛻", "📦"];

const AdminMezziPage = () => {
  const { tokens } = useAuthStore();
  const currentRole = useAuthStore((s) => s.user?.role);
  const canEdit = currentRole === "admin";
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  
  // Stati del componente
  const [form, setForm] = useState<MezzoForm>(emptyForm);
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

  // Query per recuperare la lista dei mezzi
  const mezziQuery = useQuery<{ mezzi: AdminMezzo[] }>({
    queryKey: ["admin", "mezzi"],
    queryFn: () => authorizedFetch<{ mezzi: AdminMezzo[] }>("/admin/mezzi"),
    enabled: Boolean(tokens)
  });

  // Gestione errori caricamento
  useEffect(() => {
    if (mezziQuery.isError) {
      const message = mezziQuery.error instanceof Error ? mezziQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento mezzi fallito", description: message });
    }
  }, [mezziQuery.isError, mezziQuery.error, pushAlert]);

  // Calcolo paginazione
  const mezzi = useMemo(() => mezziQuery.data?.mezzi ?? [], [mezziQuery.data]);
  
  // Filtra mezzi
  const filteredMezzi = useMemo(() => {
    let result = mezzi;
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(mezzo => 
        mezzo.name.toLowerCase().includes(searchLower) ||
        mezzo.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterActive) {
      const isActive = filterActive === "active";
      result = result.filter(mezzo => mezzo.isActive === isActive);
    }
    
    return result;
  }, [mezzi, debouncedSearch, filterActive]);
  
  const totalPages = Math.ceil(filteredMezzi.length / ITEMS_PER_PAGE);
  const paginatedMezzi = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMezzi.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMezzi, currentPage]);

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
        await authorizedFetch(`/admin/mezzi/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Mezzo aggiornato" });
      } else {
        await authorizedFetch("/admin/mezzi", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Mezzo creato" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "mezzi"] });
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
  const handleEdit = (mezzo: AdminMezzo) => {
    setEditingId(mezzo.id);
    setForm({
      name: mezzo.name,
      description: mezzo.description ?? "",
      icon: mezzo.icon ?? "",
      isActive: mezzo.isActive
    });
    setIsFormModalOpen(true);
  };

  // Eliminazione mezzo
  const handleDelete = async (id: string) => {
    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare mezzo?",
      message: "Questa azione è irreversibile. Il mezzo verrà rimosso definitivamente.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/mezzi/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "mezzi"] });
      pushAlert({ type: "success", title: "Mezzo eliminato" });
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
  const handleToggleActive = async (mezzo: AdminMezzo) => {
    try {
      await authorizedFetch(`/admin/mezzi/${mezzo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: mezzo.name,
          description: mezzo.description ?? "",
          icon: mezzo.icon ?? "",
          isActive: !mezzo.isActive
        })
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "mezzi"] });
      pushAlert({ 
        type: "success", 
        title: mezzo.isActive ? "Mezzo disattivato" : "Mezzo attivato" 
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
          <h1>Gestione mezzi di lavoro</h1>
          <p>Amministra i veicoli e macchinari disponibili per i rilevamenti.</p>
        </div>
        {canEdit && (
          <button type="button" className="button button--primary" onClick={openCreateForm}>
            + Aggiungi mezzo
          </button>
        )}
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card">
        <div className="table-header">
          <div>
            <h2>Mezzi disponibili</h2>
            <p>Elenco dei mezzi di lavoro utilizzabili nei rilevamenti.</p>
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
              {filteredMezzi.length} risultat{filteredMezzi.length === 1 ? "o" : "i"} su {mezzi.length} totali
            </p>
          )}
        </div>
        
        {mezziQuery.isLoading && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Caricamento...
          </div>
        )}
        
        {!mezziQuery.isLoading && filteredMezzi.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            {hasFilters ? "Nessun mezzo corrisponde ai filtri." : "Nessun mezzo presente. Clicca \"Aggiungi mezzo\" per crearne uno."}
          </div>
        )}
        
        {!mezziQuery.isLoading && filteredMezzi.length > 0 && (
          <div className="admin-cards-grid">
            {paginatedMezzi.map((mezzo) => (
              <div 
                key={mezzo.id} 
                className={`admin-card-item ${!mezzo.isActive ? "admin-card-item--disabled" : ""}`}
              >
                <div className="admin-card-item__header">
                  <span className="admin-card-item__icon">{mezzo.icon || "🚗"}</span>
                  <div className="admin-card-item__info">
                    <h4 className="admin-card-item__name">{mezzo.name}</h4>
                    {mezzo.description && (
                      <p className="admin-card-item__desc">{mezzo.description}</p>
                    )}
                  </div>
                </div>
                <span className={`admin-card-item__status ${mezzo.isActive ? "admin-card-item__status--active" : "admin-card-item__status--inactive"}`}>
                  {mezzo.isActive ? "✓ Attivo" : "Disattivo"}
                </span>
                <div className="admin-card-item__actions">
                  {canEdit ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn--icon" 
                        onClick={() => handleToggleActive(mezzo)}
                        title={mezzo.isActive ? "Disattiva" : "Attiva"}
                        style={{ background: mezzo.isActive ? "#fef2f2" : "#f0fdf4" }}
                      >
                        {mezzo.isActive ? "🔴" : "🟢"}
                      </button>
                      <button type="button" className="btn" onClick={() => handleEdit(mezzo)}>
                        ✏️ Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        onClick={() => handleDelete(mezzo.id)}
                        disabled={deletingId === mezzo.id}
                      >
                        {deletingId === mezzo.id ? "..." : "🗑️"}
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
            totalItems={filteredMezzi.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sui mezzi di lavoro.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica mezzo" : "Nuovo mezzo"}
        description="Inserisci i dati del mezzo di lavoro."
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome mezzo"
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
            <label>Icona</label>
            <div className="emoji-picker">
              <input
                placeholder="Emoji (es. 🚛)"
                value={form.icon}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, icon: event.target.value }))
                }
                style={{ width: "80px", textAlign: "center", fontSize: "1.2rem" }}
              />
              <div className="emoji-suggestions">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-btn"
                    onClick={() => setForm((prev) => ({ ...prev, icon: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Mezzo attivo (visibile nei rilevamenti)
            </label>
          </div>
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna mezzo" : "Crea mezzo")}
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
        .emoji-picker {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .emoji-suggestions {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }
        .emoji-btn {
          padding: 0.25rem 0.5rem;
          font-size: 1.2rem;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .emoji-btn:hover {
          background: var(--color-bg-tertiary);
        }
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

export default AdminMezziPage;
