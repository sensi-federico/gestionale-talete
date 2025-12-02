import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const ImpresaDashboard = () => {
  const navigate = useNavigate();
  const { tokens } = useAuthStore();
  const [stats, setStats] = useState<{ oggi: number; settimana: number; totale: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!tokens) return;
      try {
        const response = await fetch(`${API_BASE}/rilevamenti`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const data = await response.json();
        const rilevamenti = data.rilevamenti || [];

        const oggi = new Date().toISOString().split("T")[0];
        const settimanaFa = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        setStats({
          totale: rilevamenti.length,
          oggi: rilevamenti.filter((r: { rilevamento_date: string }) => r.rilevamento_date === oggi).length,
          settimana: rilevamenti.filter((r: { rilevamento_date: string }) => r.rilevamento_date >= settimanaFa).length
        });
      } catch (error) {
        console.error("Errore caricamento stats", error);
      }
    };

    fetchStats();
  }, [tokens]);

  return (
    <div className="tecnico-dashboard">
      <div className="tecnico-dashboard__header">
        <h1>Dashboard Impresa</h1>
        <p className="tecnico-dashboard__subtitle">Gestisci gli interventi della tua impresa</p>
      </div>

      <div className="tecnico-dashboard__actions">
        <button
          className="tecnico-action-card tecnico-action-card--primary"
          onClick={() => navigate("/nuovo-impresa")}
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
      </div>

      <div className="tecnico-dashboard__stats">
        <h2>Statistiche impresa</h2>
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

export default ImpresaDashboard;
