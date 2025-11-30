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

  // Chiudi modal con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <span className="miei-rilevamenti__count">{rilevamenti.length} totali</span>
      </div>

      {rilevamenti.length === 0 ? (
        <div className="empty-state">
          <p>Non hai ancora registrato nessun rilevamento.</p>
          <p className="empty-state__hint">Usa la tab "Nuovo" per creare il tuo primo rilevamento!</p>
        </div>
      ) : (
        <div className="rilevamenti-list">
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
                  {selectedRilevamento.via} {selectedRilevamento.numero_civico}, {selectedRilevamento.comune?.name}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tipo lavorazione</span>
                <span className="detail-value">{selectedRilevamento.tipo?.name || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Impresa</span>
                <span className="detail-value">{selectedRilevamento.impresa?.name || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">N° operai</span>
                <span className="detail-value">{selectedRilevamento.numero_operai}</span>
              </div>
              {selectedRilevamento.materiale_tubo && (
                <div className="detail-row">
                  <span className="detail-label">Materiale tubo</span>
                  <span className="detail-value">{selectedRilevamento.materiale_tubo}</span>
                </div>
              )}
              {selectedRilevamento.diametro && (
                <div className="detail-row">
                  <span className="detail-label">Diametro</span>
                  <span className="detail-value">{selectedRilevamento.diametro}</span>
                </div>
              )}
              {selectedRilevamento.altri_interventi && (
                <div className="detail-row detail-row--full">
                  <span className="detail-label">Altri interventi</span>
                  <span className="detail-value">{selectedRilevamento.altri_interventi}</span>
                </div>
              )}
              {selectedRilevamento.notes && (
                <div className="detail-row detail-row--full">
                  <span className="detail-label">Note</span>
                  <span className="detail-value">{selectedRilevamento.notes}</span>
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

export default MieiRilevamenti;
