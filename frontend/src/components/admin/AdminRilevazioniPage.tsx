import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";

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
  comune: { id: string; name: string; province: string } | null;
  tipo_lavorazione: { id: string; name: string } | null;
  impresa: { id: string; name: string } | null;
  operaio: { id: string; email: string; full_name: string } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const AdminRilevazioniPage = () => {
  const { tokens } = useAuthStore();
  const [selectedRilevamento, setSelectedRilevamento] = useState<Rilevamento | null>(null);
  const [filterOperaio, setFilterOperaio] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");

  const authorizedFetch = async <T,>(path: string) => {
    if (!tokens) throw new Error("Token mancante");
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    if (!response.ok) throw new Error("Richiesta fallita");
    return (await response.json()) as T;
  };

  // Fetch rilevamenti
  const rilevazioniQuery = useQuery<{ rilevamenti: Rilevamento[] }>({
    queryKey: ["admin", "rilevamenti", filterOperaio],
    queryFn: () => {
      let url = "/admin/rilevamenti";
      if (filterOperaio) url += `?operaioId=${filterOperaio}`;
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

  const rilevamenti = rilevazioniQuery.data?.rilevamenti ?? [];
  const users = usersQuery.data?.users ?? [];

  // Filtra per data client-side
  const filteredRilevamenti = filterDate
    ? rilevamenti.filter((r) => r.rilevamento_date === filterDate)
    : rilevamenti;

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

  // Chiudi con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          <select
            value={filterOperaio}
            onChange={(e) => setFilterOperaio(e.target.value)}
          >
            <option value="">Tutti</option>
            {users.filter(u => u.full_name).map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Data</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        {(filterOperaio || filterDate) && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => { setFilterOperaio(""); setFilterDate(""); }}
          >
            Resetta filtri
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="rilevamenti-stats">
        <div className="stat-pill">
          <span className="stat-pill__value">{filteredRilevamenti.length}</span>
          <span className="stat-pill__label">Rilevamenti</span>
        </div>
      </div>

      {/* Lista */}
      <div className="rilevamenti-list">
        {rilevazioniQuery.isLoading && <div className="loading-placeholder">Caricamento...</div>}
        
        {!rilevazioniQuery.isLoading && filteredRilevamenti.length === 0 && (
          <div className="empty-state">
            <p>Nessun rilevamento trovato</p>
          </div>
        )}

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
              {r.foto_url && <span className="rilevamento-card__photo-badge">📷</span>}
            </div>
            <div className="rilevamento-card__location">
              <strong>{r.via} {r.numero_civico}</strong>
              <span>{r.comune?.name} ({r.comune?.province})</span>
            </div>
            <div className="rilevamento-card__meta">
              <span className="meta-tag">{r.tipo_lavorazione?.name || "—"}</span>
              <span className="meta-tag">{r.impresa?.name || "—"}</span>
              <span className="meta-tag">👷 {r.numero_operai}</span>
            </div>
            <div className="rilevamento-card__operaio">
              Registrato da: <strong>{r.operaio?.full_name || r.operaio?.email || "—"}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Modal dettaglio */}
      {selectedRilevamento && (
        <div className="rilevamento-modal-overlay" onClick={closeDetail}>
          <div className="rilevamento-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rilevamento-modal__close" onClick={closeDetail}>✕</button>
            
            <h2>Dettaglio Rilevamento</h2>
            
            {selectedRilevamento.foto_url && (
              <div className="rilevamento-modal__photo">
                <img src={selectedRilevamento.foto_url} alt="Foto rilevamento" />
              </div>
            )}

            <div className="rilevamento-modal__grid">
              <div className="detail-row">
                <span className="detail-label">Data/Ora</span>
                <span className="detail-value">
                  {formatDate(selectedRilevamento.rilevamento_date)} alle {formatTime(selectedRilevamento.rilevamento_time)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Indirizzo</span>
                <span className="detail-value">
                  {selectedRilevamento.via} {selectedRilevamento.numero_civico}, {selectedRilevamento.comune?.name} ({selectedRilevamento.comune?.province})
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tipo lavorazione</span>
                <span className="detail-value">{selectedRilevamento.tipo_lavorazione?.name || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Impresa</span>
                <span className="detail-value">{selectedRilevamento.impresa?.name || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">N° operai</span>
                <span className="detail-value">{selectedRilevamento.numero_operai}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registrato da</span>
                <span className="detail-value">{selectedRilevamento.operaio?.full_name || selectedRilevamento.operaio?.email || "—"}</span>
              </div>
              {selectedRilevamento.notes && (
                <div className="detail-row detail-row--full">
                  <span className="detail-label">Note</span>
                  <span className="detail-value">{selectedRilevamento.notes}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Coordinate GPS</span>
                <span className="detail-value detail-value--mono">
                  {selectedRilevamento.gps_lat.toFixed(6)}, {selectedRilevamento.gps_lon.toFixed(6)}
                </span>
              </div>
              {selectedRilevamento.manual_lat && (
                <div className="detail-row">
                  <span className="detail-label">Coordinate manuali</span>
                  <span className="detail-value detail-value--mono">
                    {selectedRilevamento.manual_lat.toFixed(6)}, {selectedRilevamento.manual_lon?.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {(selectedRilevamento.manual_lat || selectedRilevamento.gps_lat) && (
              <a
                href={`https://www.google.com/maps?q=${selectedRilevamento.manual_lat || selectedRilevamento.gps_lat},${selectedRilevamento.manual_lon || selectedRilevamento.gps_lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--primary rilevamento-modal__map-btn"
              >
                🗺️ Apri in Google Maps
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRilevazioniPage;
