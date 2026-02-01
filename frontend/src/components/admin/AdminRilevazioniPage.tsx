import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import RilevamentoDetail from "../ui/RilevamentoDetail";
import Pagination from "../ui/Pagination";
import ConfirmModal from "../ui/ConfirmModal";
import JSZip from "jszip";

interface Rilevamento {
  id: string;
  created_at: string;
  via: string;
  numero_civico: string;
  gps_lat: number;
  gps_lon: number;
  manual_lat: number | null;
  manual_lon: number | null;
  numero_operai: number;
  foto_url: string | null;
  foto_panoramica_url?: string | null;
  foto_inizio_lavori_url?: string | null;
  foto_intervento_url?: string | null;
  foto_fine_lavori_url?: string | null;
  notes: string | null;
  rilevamento_date: string;
  rilevamento_time: string;
  ora_fine?: string | null;
  materiale_tubo: string | null;
  diametro: string | null;
  altri_interventi: string | null;
  tubo_esistente_materiale?: string | null;
  tubo_esistente_diametro?: string | null;
  tubo_esistente_pn?: string | null;
  tubo_esistente_profondita?: string | null;
  tubo_nuovo_materiale?: string | null;
  tubo_nuovo_diametro?: string | null;
  tubo_nuovo_pn?: string | null;
  tubo_nuovo_profondita?: string | null;
  submit_timestamp: string | null;
  submit_gps_lat: number | null;
  submit_gps_lon: number | null;
  comune: { id: string; name: string; province: string } | null;
  tipo: { id: string; name: string } | null;
  impresa: { id: string; name: string } | null;
  operaio: { id: string; email: string; full_name: string } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface Comune {
  id: string;
  name: string;
  province: string;
}

interface TipoLavorazione {
  id: string;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const ITEMS_PER_PAGE = 10;

const AdminRilevazioniPage = () => {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();
  const { pushAlert } = useAdminAlerts();
  const [selectedRilevamento, setSelectedRilevamento] = useState<Rilevamento | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOperaio, setFilterOperaio] = useState<string>("");
  const [filterImpresa, setFilterImpresa] = useState<string>("");
  const [filterComune, setFilterComune] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const currentRole = useAuthStore((s) => s.user?.role);

  const authorizedFetch = async <T,>(path: string) => {
    if (!tokens) throw new Error("Token mancante");
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    if (!response.ok) throw new Error("Richiesta fallita");
    return (await response.json()) as T;
  };

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterOperaio) params.append("operaioId", filterOperaio);
    if (filterImpresa) params.append("impresaId", filterImpresa);
    if (filterComune) params.append("comuneId", filterComune);
    if (filterTipo) params.append("tipoLavorazioneId", filterTipo);
    if (filterDateFrom) params.append("dateFrom", filterDateFrom);
    if (filterDateTo) params.append("dateTo", filterDateTo);
    return params.toString();
  };

  // Fetch rilevamenti
  const rilevazioniQuery = useQuery<{ rilevamenti: Rilevamento[] }>({
    queryKey: ["admin", "rilevamenti", filterOperaio, filterImpresa, filterComune, filterTipo, filterDateFrom, filterDateTo],
    queryFn: () => {
      const params = buildQueryParams();
      const url = `/admin/rilevamenti${params ? `?${params}` : ""}`;
      return authorizedFetch<{ rilevamenti: Rilevamento[] }>(url);
    },
    enabled: Boolean(tokens)
  });

  // Fetch users per filtro
  const usersQuery = useQuery<{ users: User[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => authorizedFetch<{ users: User[] }>("/admin/users"),
    enabled: Boolean(tokens)
  });

  // Fetch comuni, tipi lavorazione e imprese per filtri
  const referenceQuery = useQuery<{ comuni: Comune[]; tipiLavorazione: TipoLavorazione[]; imprese: { id: string; name: string }[] }>({
    queryKey: ["admin", "reference"],
    queryFn: () => authorizedFetch<{ comuni: Comune[]; tipiLavorazione: TipoLavorazione[]; imprese: { id: string; name: string }[] }>("/admin/reference"),
    enabled: Boolean(tokens)
  });

  const rilevamenti = rilevazioniQuery.data?.rilevamenti ?? [];
  const users = usersQuery.data?.users ?? [];
  const comuni = referenceQuery.data?.comuni ?? [];
  const tipiLavorazione = referenceQuery.data?.tipiLavorazione ?? [];
  const imprese = referenceQuery.data?.imprese ?? [];

  // Paginazione
  const totalPages = Math.ceil(rilevamenti.length / ITEMS_PER_PAGE);
  const paginatedRilevamenti = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rilevamenti.slice(start, start + ITEMS_PER_PAGE);
  }, [rilevamenti, currentPage]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5) || "-";
  };

  const closeDetail = () => setSelectedRilevamento(null);

  const resetFilters = () => {
    setFilterOperaio("");
    setFilterComune("");
    setFilterTipo("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setCurrentPage(1);
  };

  const hasFilters = filterOperaio || filterImpresa || filterComune || filterTipo || filterDateFrom || filterDateTo;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tokens) throw new Error("Token mancante");
      const response = await fetch(`${API_BASE}/rilevamenti/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      if (!response.ok) throw new Error("Eliminazione fallita");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rilevamenti"] });
      setSelectedRilevamento(null);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
      pushAlert({ 
        type: "success", 
        title: "Intervento eliminato", 
        description: "L'intervento è stato eliminato con successo" 
      });
    },
    onError: (error) => {
      console.error("Errore eliminazione:", error);
      pushAlert({ 
        type: "error", 
        title: "Eliminazione fallita", 
        description: error instanceof Error ? error.message : "Errore durante l'eliminazione" 
      });
    }
  });

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteMutation.mutate(deleteTargetId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!tokens) return;
    
    setIsExporting(true);
    try {
      const params = buildQueryParams();
      const url = `${API_BASE}/admin/rilevamenti/export${params ? `?${params}` : ""}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      
      if (!response.ok) throw new Error("Export fallito");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `rilevamenti_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Errore export:", error);
      alert("Errore durante l'export");
    } finally {
      setIsExporting(false);
    }
  };

  // Download foto come ZIP
  const handleDownloadZip = useCallback(async (id: string, photos: { url: string; label: string }[]) => {
    if (photos.length === 0) return;

    try {
      const zip = new JSZip();
      const folder = zip.folder(`intervento_${id}`);
      
      if (!folder) throw new Error("Errore creazione cartella zip");
      
      // Scarica le immagini in parallelo
      const downloads = photos.map(async (photo, index) => {
        try {
          const response = await fetch(photo.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const blob = await response.blob();
          // Estrai estensione dall'URL o usa jpg di default
          const urlParts = photo.url.split(".");
          const ext = urlParts.length > 1 ? urlParts[urlParts.length - 1].split("?")[0] : "jpg";
          const safeLabel = photo.label.replace(/[^a-zA-Z0-9]/g, "_");
          const filename = `${String(index + 1).padStart(2, "0")}_${safeLabel}.${ext}`;
          
          folder.file(filename, blob);
        } catch (err) {
          console.warn(`Errore download foto ${photo.label}:`, err);
        }
      });

      await Promise.all(downloads);
      
      // Genera e scarica lo ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `foto_intervento_${id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      pushAlert({
        type: "success",
        title: "Download completato",
        description: `${photos.length} foto scaricate correttamente`
      });
    } catch (error) {
      console.error("Errore download zip:", error);
      pushAlert({
        type: "error",
        title: "Download fallito",
        description: "Errore durante la creazione del file ZIP"
      });
    }
  }, [pushAlert]);

  return (
    <div className="page-container admin-rilevamenti">
      <header className="page-heading">
        <div>
          <h1>Interventi</h1>
          <p>Visualizza e analizza tutti gli interventi registrati.</p>
        </div>
      </header>

      {/* Filtri */}
      <div className="rilevamenti-filters">
        <div className="filter-group">
          <label>Tecnico</label>
          <select value={filterOperaio} onChange={(e) => setFilterOperaio(e.target.value)}>
            <option value="">Tutti</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Comune</label>
          <select value={filterComune} onChange={(e) => setFilterComune(e.target.value)}>
            <option value="">Tutti</option>
            {comuni.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.province})</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Impresa</label>
          <select value={filterImpresa} onChange={(e) => setFilterImpresa(e.target.value)}>
            <option value="">Tutte</option>
            {imprese.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Tipo lavorazione</label>
          <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="">Tutti</option>
            {tipiLavorazione.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Data da</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Data a</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="button button--ghost"
            onClick={resetFilters}
          >
            ✕ Reset
          </button>
        )}
        <div className="export-btn-wrapper">
          <button 
            type="button" 
            className="button button--primary" 
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            {isExporting ? "Export..." : "📥 Export CSV"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="rilevamenti-stats">
        <div className="stat-pill">
          <span className="stat-pill__value">{rilevamenti.length}</span>
          <span className="stat-pill__label">Interventi</span>
        </div>
      </div>

      {/* Lista */}
      <div className="rilevamenti-list">
        {rilevazioniQuery.isLoading && <div className="loading-placeholder">Caricamento...</div>}
        
        {!rilevazioniQuery.isLoading && rilevamenti.length === 0 && (
          <div className="empty-state">
            <p>Nessun intervento trovato</p>
          </div>
        )}

        {paginatedRilevamenti.map((r) => (
          <div
            key={r.id}
            className="rilevamento-card"
            onClick={() => setSelectedRilevamento(r)}
          >
            <div className="rilevamento-card__header">
              <span className="rilevamento-card__date">
                {formatDate(r.rilevamento_date)} • {formatTime(r.rilevamento_time)}
              </span>
              {(r.foto_url || r.foto_panoramica_url || r.foto_inizio_lavori_url || r.foto_intervento_url || r.foto_fine_lavori_url) && (
                <span className="rilevamento-card__photo-badge">📷</span>
              )}
            </div>
            <div className="rilevamento-card__location">
              <strong>{r.via} {r.numero_civico}</strong>
              <span>{r.comune?.name} ({r.comune?.province})</span>
            </div>
            <div className="rilevamento-card__meta">
              <span className="meta-tag">{r.tipo?.name || "—"}</span>
              <span className="meta-tag">{r.impresa?.name || "—"}</span>
              <span className="meta-tag">👷 {r.numero_operai}</span>
              {(r.tubo_esistente_materiale || r.materiale_tubo) && (
                <span className="meta-tag">{r.tubo_esistente_materiale || r.materiale_tubo}</span>
              )}
            </div>
            <div className="rilevamento-card__operaio">
              Registrato da: <strong>{r.operaio?.full_name || r.operaio?.email || "—"}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Paginazione */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={rilevamenti.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Pagina dettaglio fullscreen */}
      {selectedRilevamento && (
        <RilevamentoDetail
          rilevamento={selectedRilevamento}
          onClose={closeDetail}
          onDelete={currentRole !== "responsabile" ? handleDeleteRequest : undefined}
          onDownloadZip={handleDownloadZip}
        />
      )}

      {/* Modal di conferma eliminazione */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Eliminare intervento?"
        message="Questa azione è irreversibile. L'intervento verrà rimosso definitivamente dal database."
        confirmText="Elimina"
        cancelText="Annulla"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default AdminRilevazioniPage;
