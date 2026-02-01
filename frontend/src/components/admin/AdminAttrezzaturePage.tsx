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

// Interfaccia per il form di creazione/modifica attrezzatura
interface AttrezzaturaForm {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// Interfaccia per i dati dell'attrezzatura ricevuti dal backend
interface AdminAttrezzatura {
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
const emptyForm: AttrezzaturaForm = {
  name: "",
  description: "",
  icon: "",
  isActive: true
};

const ITEMS_PER_PAGE = 10;

// Emoji comuni per le attrezzature
const EMOJI_SUGGESTIONS = ["🔨", "🪚", "🔧", "⚡", "💨", "🔩", "✨", "💧", "🔌", "🌿"];

const AdminAttrezzaturePage = () => {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const confirmModal = useConfirmModal();
  
  // Stati del componente
  const [form, setForm] = useState<AttrezzaturaForm>(emptyForm);
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

  // Query per recuperare la lista delle attrezzature
  const attrezzatureQuery = useQuery<{ attrezzature: AdminAttrezzatura[] }>({
    queryKey: ["admin", "attrezzature"],
    queryFn: () => authorizedFetch<{ attrezzature: AdminAttrezzatura[] }>("/admin/attrezzature"),
    enabled: Boolean(tokens)
  });

  // Gestione errori caricamento
  useEffect(() => {
    if (attrezzatureQuery.isError) {
      const message = attrezzatureQuery.error instanceof Error ? attrezzatureQuery.error.message : "Errore";
      pushAlert({ type: "error", title: "Caricamento attrezzature fallito", description: message });
    }
  }, [attrezzatureQuery.isError, attrezzatureQuery.error, pushAlert]);

  // Calcolo paginazione
  const attrezzature = useMemo(() => attrezzatureQuery.data?.attrezzature ?? [], [attrezzatureQuery.data]);
  
  // Filtra attrezzature
  const filteredAttrezzature = useMemo(() => {
    let result = attrezzature;
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter(attr => 
        attr.name.toLowerCase().includes(searchLower) ||
        attr.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterActive) {
      const isActive = filterActive === "active";
      result = result.filter(attr => attr.isActive === isActive);
    }
    
    return result;
  }, [attrezzature, debouncedSearch, filterActive]);
  
  const totalPages = Math.ceil(filteredAttrezzature.length / ITEMS_PER_PAGE);
  const paginatedAttrezzature = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAttrezzature.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAttrezzature, currentPage]);

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
        await authorizedFetch(`/admin/attrezzature/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Attrezzatura aggiornata" });
      } else {
        await authorizedFetch("/admin/attrezzature", {
          method: "POST",
          body: JSON.stringify(form)
        });
        pushAlert({ type: "success", title: "Attrezzatura creata" });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "attrezzature"] });
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
  const handleEdit = (attrezzatura: AdminAttrezzatura) => {
    setEditingId(attrezzatura.id);
    setForm({
      name: attrezzatura.name,
      description: attrezzatura.description ?? "",
      icon: attrezzatura.icon ?? "",
      isActive: attrezzatura.isActive
    });
    setIsFormModalOpen(true);
  };

  // Eliminazione attrezzatura
  const handleDelete = async (id: string) => {
    const confirmDelete = await confirmModal.confirm({
      title: "Eliminare attrezzatura?",
      message: "Questa azione è irreversibile. L'attrezzatura verrà rimossa definitivamente.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      variant: "danger"
    });
    
    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    try {
      await authorizedFetch(`/admin/attrezzature/${id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "attrezzature"] });
      pushAlert({ type: "success", title: "Attrezzatura eliminata" });
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
  const handleToggleActive = async (attrezzatura: AdminAttrezzatura) => {
    try {
      await authorizedFetch(`/admin/attrezzature/${attrezzatura.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: attrezzatura.name,
          description: attrezzatura.description ?? "",
          icon: attrezzatura.icon ?? "",
          isActive: !attrezzatura.isActive
        })
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "attrezzature"] });
      pushAlert({ 
        type: "success", 
        title: attrezzatura.isActive ? "Attrezzatura disattivata" : "Attrezzatura attivata" 
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
          <h1>Gestione attrezzature</h1>
          <p>Amministra gli attrezzi e strumenti disponibili per i rilevamenti.</p>
        </div>
        <button type="button" className="button button--primary" onClick={openCreateForm}>
          + Aggiungi attrezzatura
        </button>
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="card">
        <div className="table-header">
          <div>
            <h2>Attrezzature disponibili</h2>
            <p>Elenco delle attrezzature utilizzabili nei rilevamenti.</p>
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
              <option value="active">Solo attive</option>
              <option value="inactive">Solo disattive</option>
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
              {filteredAttrezzature.length} risultat{filteredAttrezzature.length === 1 ? "o" : "i"} su {attrezzature.length} totali
            </p>
          )}
        </div>
        
        {attrezzatureQuery.isLoading && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Caricamento...
          </div>
        )}
        
        {!attrezzatureQuery.isLoading && filteredAttrezzature.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            {hasFilters ? "Nessuna attrezzatura corrisponde ai filtri." : "Nessuna attrezzatura presente. Clicca \"Aggiungi attrezzatura\" per crearne una."}
          </div>
        )}
        
        {!attrezzatureQuery.isLoading && filteredAttrezzature.length > 0 && (
          <div className="admin-cards-grid">
            {paginatedAttrezzature.map((attr) => (
              <div 
                key={attr.id} 
                className={`admin-card-item ${!attr.isActive ? "admin-card-item--disabled" : ""}`}
              >
                <div className="admin-card-item__header">
                  <span className="admin-card-item__icon">{attr.icon || "🔧"}</span>
                  <div className="admin-card-item__info">
                    <h4 className="admin-card-item__name">{attr.name}</h4>
                    {attr.description && (
                      <p className="admin-card-item__desc">{attr.description}</p>
                    )}
                  </div>
                </div>
                <span className={`admin-card-item__status ${attr.isActive ? "admin-card-item__status--active" : "admin-card-item__status--inactive"}`}>
                  {attr.isActive ? "✓ Attiva" : "Disattiva"}
                </span>
                <div className="admin-card-item__actions">
                  <button 
                    type="button" 
                    className="btn btn--icon" 
                    onClick={() => handleToggleActive(attr)}
                    title={attr.isActive ? "Disattiva" : "Attiva"}
                    style={{ background: attr.isActive ? "#fef2f2" : "#f0fdf4" }}
                  >
                    {attr.isActive ? "🔴" : "🟢"}
                  </button>
                  <button type="button" className="btn" onClick={() => handleEdit(attr)}>
                    ✏️ Modifica
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => handleDelete(attr.id)}
                    disabled={deletingId === attr.id}
                  >
                    {deletingId === attr.id ? "..." : "🗑️"}
                  </button>
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
            totalItems={filteredAttrezzature.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Operazioni recenti sulle attrezzature.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>

      <FormModal
        isOpen={isFormModalOpen}
        title={editingId ? "Modifica attrezzatura" : "Nuova attrezzatura"}
        description="Inserisci i dati dell'attrezzatura."
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            placeholder="Nome attrezzatura"
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
                placeholder="Emoji"
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
              Attrezzatura attiva (visibile nei rilevamenti)
            </label>
          </div>
          <div className="heading-actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : (editingId ? "Aggiorna attrezzatura" : "Crea attrezzatura")}
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

export default AdminAttrezzaturePage;
