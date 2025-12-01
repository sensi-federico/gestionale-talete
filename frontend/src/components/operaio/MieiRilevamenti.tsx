import { useState, useMemo } from "react";
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
  comune: { name: string } | null;
  tipo: { name: string } | null;
  impresa: { name: string } | null;
  sync_status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const MieiRilevamenti = () => {
  const { tokens } = useAuthStore();
  const [selectedRilevamento, setSelectedRilevamento] = useState<Rilevamento | null>(null);
  
  // Filtri
  const [searchText, setSearchText] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { data, isLoading, error } = useQuery<{ rilevamenti: Rilevamento[] }>({
    queryKey: ["miei-rilevamenti"],
    queryFn: async () => {
      if (!tokens) throw new Error("Token mancante");
      const response = await fetch(`${API_BASE}/rilevamenti`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      if (!response.ok) throw new Error("Errore nel caricamento");
      return response.json();
    },
    enabled: Boolean(tokens)
  });

  const rilevamenti = data?.rilevamenti ?? [];
  
  // Estrai lista unica dei tipi per il filtro
  const tipiUnique = useMemo(() => {
    const tipi = rilevamenti.map(r => r.tipo?.name).filter(Boolean) as string[];
    return Array.from(new Set(tipi)).sort();
  }, [rilevamenti]);
  
  // Applica filtri
  const filteredRilevamenti = useMemo(() => {
    return rilevamenti.filter(r => {
      // Filtro testo (via, comune)
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchVia = r.via.toLowerCase().includes(search);
        const matchComune = r.comune?.name.toLowerCase().includes(search);
        if (!matchVia && !matchComune) return false;
      }
      
      // Filtro tipo
      if (filterTipo && r.tipo?.name !== filterTipo) {
        return false;
      }
      
      // Filtro data da
      if (filterDateFrom && r.rilevamento_date < filterDateFrom) {
        return false;
      }
      
      // Filtro data a
      if (filterDateTo && r.rilevamento_date > filterDateTo) {
        return false;
      }
      
      return true;
    });
  }, [rilevamenti, searchText, filterTipo, filterDateFrom, filterDateTo]);
  
  const hasActiveFilters = searchText || filterTipo || filterDateFrom || filterDateTo;
  
  const clearFilters = () => {
    setSearchText("");
    setFilterTipo("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

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

  if (isLoading) {
    return (
      <div className="miei-rilevamenti">
        <div className="loading-placeholder">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="miei-rilevamenti">
        <div className="empty-state">
          <p>Errore nel caricamento dei rilevamenti</p>
        </div>
      </div>
    );
  }

  return (
    <div className="miei-rilevamenti">
      <div className="miei-rilevamenti__header">
        <h2>I miei rilevamenti</h2>
        <span className="miei-rilevamenti__count">{filteredRilevamenti.length} di {rilevamenti.length}</span>
      </div>

      {/* Filtri */}
      <div className="miei-rilevamenti__filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="🔍 Cerca via o comune..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="filter-input filter-input--search"
          />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="filter-input"
          >
            <option value="">Tutti i tipi</option>
            {tipiUnique.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="filter-input"
            placeholder="Dal"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="filter-input"
            placeholder="Al"
          />
          {hasActiveFilters && (
            <button 
              type="button" 
              className="filter-clear-btn"
              onClick={clearFilters}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredRilevamenti.length === 0 ? (
        <div className="empty-state">
          {hasActiveFilters ? (
            <>
              <p>Nessun rilevamento trovato con i filtri applicati.</p>
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </>
          ) : (
            <>
              <p>Non hai ancora registrato nessun rilevamento.</p>
              <p className="empty-state__hint">Vai su "Nuovo" per creare il tuo primo rilevamento!</p>
            </>
          )}
        </div>
      ) : (
        <div className="rilevamenti-list">
          {filteredRilevamenti.map((r) => (
            <div
              key={r.id}
              className="rilevamento-card"
              onClick={() => setSelectedRilevamento(r)}
            >
              <div className="rilevamento-card__header">
                <span className="rilevamento-card__date">
                  {formatDate(r.rilevamento_date)} • {formatTime(r.rilevamento_time)}
                </span>
                <div className="rilevamento-card__badges">
                  {r.foto_url && <span className="rilevamento-card__photo-badge">📷</span>}
                  {r.sync_status === "synced" ? (
                    <span className="sync-badge sync-badge--ok" title="Sincronizzato">✓</span>
                  ) : (
                    <span className="sync-badge sync-badge--pending" title="In attesa">⏳</span>
                  )}
                </div>
              </div>
              <div className="rilevamento-card__location">
                <strong>{r.via} {r.numero_civico}</strong>
                <span>{r.comune?.name}</span>
              </div>
              <div className="rilevamento-card__meta">
                <span className="meta-tag">{r.tipo?.name || "—"}</span>
                <span className="meta-tag">{r.impresa?.name || "—"}</span>
                {r.materiale_tubo && <span className="meta-tag">{r.materiale_tubo}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagina dettaglio fullscreen */}
      {selectedRilevamento && (
        <RilevamentoDetail
          rilevamento={selectedRilevamento}
          onClose={closeDetail}
        />
      )}
    </div>
  );
};

export default MieiRilevamenti;
