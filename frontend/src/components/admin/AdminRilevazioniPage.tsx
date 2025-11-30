import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import RilevamentoDetail from "../ui/RilevamentoDetail";

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
  notes: string | null;
  rilevamento_date: string;
  rilevamento_time: string;
  materiale_tubo: string | null;
  diametro: string | null;
  altri_interventi: string | null;
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

const AdminRilevazioniPage = () => {
  const { tokens } = useAuthStore();
  const [selectedRilevamento, setSelectedRilevamento] = useState<Rilevamento | null>(null);
  const [filterOperaio, setFilterOperaio] = useState<string>("");
  const [filterComune, setFilterComune] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

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
    if (filterComune) params.append("comuneId", filterComune);
    if (filterTipo) params.append("tipoLavorazioneId", filterTipo);
    if (filterDateFrom) params.append("dateFrom", filterDateFrom);
    if (filterDateTo) params.append("dateTo", filterDateTo);
    return params.toString();
  };

  // Fetch rilevamenti
  const rilevazioniQuery = useQuery<{ rilevamenti: Rilevamento[] }>({
    queryKey: ["admin", "rilevamenti", filterOperaio, filterComune, filterTipo, filterDateFrom, filterDateTo],
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

  // Fetch comuni e tipi lavorazione per filtri
  const referenceQuery = useQuery<{ comuni: Comune[]; tipiLavorazione: TipoLavorazione[] }>({
    queryKey: ["admin", "reference"],
    queryFn: () => authorizedFetch<{ comuni: Comune[]; tipiLavorazione: TipoLavorazione[] }>("/admin/reference"),
    enabled: Boolean(tokens)
  });

  const rilevamenti = rilevazioniQuery.data?.rilevamenti ?? [];
  const users = usersQuery.data?.users ?? [];
  const comuni = referenceQuery.data?.comuni ?? [];
  const tipiLavorazione = referenceQuery.data?.tipiLavorazione ?? [];

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
  };

  const hasFilters = filterOperaio || filterComune || filterTipo || filterDateFrom || filterDateTo;

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

  return (
    <div className="page-container admin-rilevamenti">
      <header className="page-heading">
        <div>
          <h1>Rilevamenti</h1>
          <p>Visualizza e analizza tutti i rilevamenti registrati.</p>
        </div>
      </header>

      {/* Filtri */}
      <div className="rilevamenti-filters">
        <div className="filter-group">
          <label>Operaio</label>
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
          <span className="stat-pill__label">Rilevamenti</span>
        </div>
      </div>

      {/* Lista */}
      <div className="rilevamenti-list">
        {rilevazioniQuery.isLoading && <div className="loading-placeholder">Caricamento...</div>}
        
        {!rilevazioniQuery.isLoading && rilevamenti.length === 0 && (
          <div className="empty-state">
            <p>Nessun rilevamento trovato</p>
          </div>
        )}

        {rilevamenti.map((r) => (
          <div
            key={r.id}
            className="rilevamento-card"
            onClick={() => setSelectedRilevamento(r)}
          >
            <div className="rilevamento-card__header">
              <span className="rilevamento-card__date">
                {formatDate(r.rilevamento_date)} • {formatTime(r.rilevamento_time)}
              </span>
              {r.foto_url && <span className="rilevamento-card__photo-badge">📷</span>}
            </div>
            <div className="rilevamento-card__location">
              <strong>{r.via} {r.numero_civico}</strong>
              <span>{r.comune?.name} ({r.comune?.province})</span>
            </div>
            <div className="rilevamento-card__meta">
              <span className="meta-tag">{r.tipo?.name || "—"}</span>
              <span className="meta-tag">{r.impresa?.name || "—"}</span>
              <span className="meta-tag">👷 {r.numero_operai}</span>
              {r.materiale_tubo && <span className="meta-tag">{r.materiale_tubo}</span>}
            </div>
            <div className="rilevamento-card__operaio">
              Registrato da: <strong>{r.operaio?.full_name || r.operaio?.email || "—"}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Pagina dettaglio fullscreen */}
      {selectedRilevamento && (
        <RilevamentoDetail
          rilevamento={selectedRilevamento}
          onClose={closeDetail}
          showOperaio={true}
        />
      )}
    </div>
  );
};

export default AdminRilevazioniPage;
