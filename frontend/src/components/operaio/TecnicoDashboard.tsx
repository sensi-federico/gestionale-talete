import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface Stats {
  totale: number;
  oggi: number;
  settimana: number;
}

const TecnicoDashboard = () => {
  const navigate = useNavigate();
  const { tokens, user } = useAuthStore();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["tecnico-stats"],
    queryFn: async () => {
      if (!tokens) throw new Error("Token mancante");
      const response = await fetch(`${API_BASE}/rilevamenti`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      if (!response.ok) throw new Error("Errore nel caricamento");
      const data = await response.json();
      const rilevamenti = data.rilevamenti || [];
      
      const oggi = new Date().toISOString().split("T")[0];
      const settimanaFa = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      return {
        totale: rilevamenti.length,
        oggi: rilevamenti.filter((r: { rilevamento_date: string }) => r.rilevamento_date === oggi).length,
        settimana: rilevamenti.filter((r: { rilevamento_date: string }) => r.rilevamento_date >= settimanaFa).length
      };
    },
    enabled: Boolean(tokens)
  });

  const displayName = user?.fullName?.trim() || user?.email?.split("@")[0] || "Tecnico";

  return (
    <div className="tecnico-dashboard">
      <div className="tecnico-dashboard__welcome">
        <h1>Ciao, {displayName}!</h1>
        <p>Cosa vuoi fare oggi?</p>
      </div>

      <div className="tecnico-dashboard__actions">
        <button
          className="tecnico-action-card tecnico-action-card--primary"
          onClick={() => navigate("/nuovo")}
        >
          <div className="tecnico-action-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="tecnico-action-card__title">Nuovo Intervento</span>
          <span className="tecnico-action-card__subtitle">Registra un nuovo intervento</span>
        </button>

        <button
          className="tecnico-action-card"
          onClick={() => navigate("/miei-rilevamenti")}
        >
          <div className="tecnico-action-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h6" strokeLinecap="round" />
            </svg>
          </div>
          <span className="tecnico-action-card__title">I miei interventi</span>
          <span className="tecnico-action-card__subtitle">Visualizza lo storico</span>
        </button>

        <button
          className="tecnico-action-card"
          onClick={() => navigate("/imprese")}
        >
          <div className="tecnico-action-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
              <path d="M9 9v.01M9 13v.01M9 17v.01M13 9v.01M13 13v.01M13 17v.01" strokeLinecap="round" />
            </svg>
          </div>
          <span className="tecnico-action-card__title">Imprese</span>
          <span className="tecnico-action-card__subtitle">Visualizza imprese e interventi</span>
        </button>
      </div>

      <div className="tecnico-dashboard__stats">
        <h2>Le tue statistiche</h2>
        <div className="tecnico-stats-grid">
          <div className="tecnico-stat-card">
            <span className="tecnico-stat-card__value">{stats?.oggi ?? "—"}</span>
            <span className="tecnico-stat-card__label">Oggi</span>
          </div>
          <div className="tecnico-stat-card">
            <span className="tecnico-stat-card__value">{stats?.settimana ?? "—"}</span>
            <span className="tecnico-stat-card__label">Questa settimana</span>
          </div>
          <div className="tecnico-stat-card">
            <span className="tecnico-stat-card__value">{stats?.totale ?? "—"}</span>
            <span className="tecnico-stat-card__label">Totale</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TecnicoDashboard;
