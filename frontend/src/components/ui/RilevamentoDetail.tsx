import { useEffect } from "react";

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
  submit_timestamp?: string | null;
  submit_gps_lat?: number | null;
  submit_gps_lon?: number | null;
  comune: { name: string } | null;
  tipo: { name: string } | null;
  impresa: { name: string } | null;
  sync_status?: string;
  operaio?: { full_name: string; email?: string } | null;
}

interface RilevamentoDetailProps {
  rilevamento: Rilevamento;
  onClose: () => void;
  showOperaio?: boolean;
  onDelete?: (id: string) => void;
  showSensitive?: boolean; // quando false nasconde data/ora/posizione
}

const RilevamentoDetail = ({ rilevamento, onClose, showOperaio = false, onDelete, showSensitive = true }: RilevamentoDetailProps) => {
const RilevamentoDetail = ({ rilevamento, onClose, showOperaio = false, onDelete }: RilevamentoDetailProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5) || "-";
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Blocca scroll del body quando la pagina è aperta
  useEffect(() => {
    // Salva la posizione corrente dello scroll
    const scrollY = window.scrollY;
    
    // Blocca lo scroll - metodo più semplice e compatibile
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    
    return () => {
      // Ripristina lo scroll
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Chiudi con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const lat = rilevamento.manual_lat || rilevamento.gps_lat;
  const lon = rilevamento.manual_lon || rilevamento.gps_lon;

  const handleBackClick = () => {
    onClose();
  };

  return (
    <div className="detail-page">
      {/* Contenuto scrollabile */}
      <div className="detail-page__content">
        {/* Hero con foto */}
        {rilevamento.foto_url && (
          <div className="detail-page__hero">
            <img src={rilevamento.foto_url} alt="Foto rilevamento" />
          </div>
        )}

        {/* Info principale */}
        <section className="detail-section">
          <div className="detail-section__main">
            <h2 className="detail-section__address">
              {rilevamento.via} {rilevamento.numero_civico}
            </h2>
            <p className="detail-section__comune">{rilevamento.comune?.name}</p>
            <p className="detail-section__datetime">
              📅 {formatDate(rilevamento.rilevamento_date)} alle {formatTime(rilevamento.rilevamento_time)}
            </p>
          </div>
        </section>

        {/* Dettagli lavoro */}
        <section className="detail-section">
          <h3 className="detail-section__title">Dettagli lavoro</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-item__label">Tipo lavorazione</span>
              <span className="detail-item__value">{rilevamento.tipo?.name || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-item__label">Impresa</span>
              <span className="detail-item__value">{rilevamento.impresa?.name || "—"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-item__label">N° operai</span>
              <span className="detail-item__value">{rilevamento.numero_operai}</span>
            </div>
            {rilevamento.materiale_tubo && (
              <div className="detail-item">
                <span className="detail-item__label">Materiale tubo</span>
                <span className="detail-item__value">{rilevamento.materiale_tubo}</span>
              </div>
            )}
            {rilevamento.diametro && (
              <div className="detail-item">
                <span className="detail-item__label">Diametro</span>
                <span className="detail-item__value">{rilevamento.diametro}</span>
              </div>
            )}
          </div>
        </section>

        {/* Altri interventi */}
        {rilevamento.altri_interventi && (
          <section className="detail-section">
            <h3 className="detail-section__title">Altri interventi</h3>
            <p className="detail-section__text">{rilevamento.altri_interventi}</p>
          </section>
        )}

        {/* Note */}
        {rilevamento.notes && (
          <section className="detail-section">
            <h3 className="detail-section__title">Note</h3>
            <p className="detail-section__text">{rilevamento.notes}</p>
          </section>
        )}

        {/* Posizione GPS (nascosta per responsabile) */}
        {showSensitive && lat && lon && (
          <section className="detail-section">
            <h3 className="detail-section__title">Posizione</h3>
            <div className="detail-coords">
              <span>📍 {lat.toFixed(6)}, {lon.toFixed(6)}</span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${lat},${lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--primary detail-map-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Apri in Google Maps
            </a>
          </section>
        )}

        {/* Info registrazione */}
        <section className="detail-section detail-section--meta">
          <h3 className="detail-section__title">Informazioni registrazione</h3>
          <div className="detail-grid">
            {showOperaio && rilevamento.operaio && (
              <div className="detail-item">
                <span className="detail-item__label">Registrato da</span>
                <span className="detail-item__value">
                  {rilevamento.operaio.full_name || rilevamento.operaio.email || "—"}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-item__label">Data inserimento</span>
              <span className="detail-item__value">
                {formatTimestamp(rilevamento.submit_timestamp || rilevamento.created_at)}
              </span>
            </div>
            {showOperaio && rilevamento.submit_gps_lat && rilevamento.submit_gps_lon && (
              <div className="detail-item">
                <span className="detail-item__label">GPS al momento invio</span>
                <span className="detail-item__value detail-item__value--mono">
                  {rilevamento.submit_gps_lat.toFixed(5)}, {rilevamento.submit_gps_lon.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer con pulsanti */}
      <footer className="detail-page__footer">
        <button 
          type="button"
          className="detail-page__back-btn" 
          onClick={handleBackClick}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Torna indietro
        </button>
        {onDelete && (
          <button 
            type="button"
            className="detail-page__delete-btn" 
            onClick={() => onDelete(rilevamento.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Elimina
          </button>
        )}
      </footer>
    </div>
  );
};

export default RilevamentoDetail;