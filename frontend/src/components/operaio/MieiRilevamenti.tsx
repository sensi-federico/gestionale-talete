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
