import { useEffect, useMemo, useState } from "react";
import PhotoCarousel from "./PhotoCarousel";

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
  onDelete?: (id: string) => void;
  onDownloadZip?: (id: string, photos: { url: string; label: string }[]) => void;
  isAdmin?: boolean;
}

const RilevamentoDetail = ({ rilevamento, onClose, onDelete, onDownloadZip, isAdmin = false }: RilevamentoDetailProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Blocca scroll del body
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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

  const photos = useMemo(() => {
    const result: { url: string; label: string }[] = [];
    if (rilevamento.foto_panoramica_url) result.push({ url: rilevamento.foto_panoramica_url, label: "Panoramica" });
    if (rilevamento.foto_inizio_lavori_url) result.push({ url: rilevamento.foto_inizio_lavori_url, label: "Inizio Lavori" });
    if (rilevamento.foto_intervento_url) result.push({ url: rilevamento.foto_intervento_url, label: "Intervento" });
    if (rilevamento.foto_fine_lavori_url) result.push({ url: rilevamento.foto_fine_lavori_url, label: "Fine Lavori" });
    if (result.length === 0 && rilevamento.foto_url) result.push({ url: rilevamento.foto_url, label: "Foto" });
    return result;
  }, [rilevamento]);

  const hasTuboEsistente = rilevamento.tubo_esistente_materiale || 
    rilevamento.tubo_esistente_diametro || rilevamento.tubo_esistente_pn || 
    rilevamento.tubo_esistente_profondita || rilevamento.materiale_tubo || rilevamento.diametro;

  const hasTuboNuovo = rilevamento.tubo_nuovo_materiale || 
    rilevamento.tubo_nuovo_diametro || rilevamento.tubo_nuovo_pn || rilevamento.tubo_nuovo_profondita;

  const handleDownloadZip = async () => {
    if (!onDownloadZip || photos.length === 0) return;
    setIsDownloading(true);
    try {
      await onDownloadZip(rilevamento.id, photos);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rdp">
      {/* Header */}
      <header className="rdp__header">
        <button type="button" className="rdp__back" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="rdp__title">Dettaglio</h1>
        <div className="rdp__actions">
          {photos.length > 0 && onDownloadZip && (
            <button 
              type="button" 
              className="rdp__action" 
              onClick={handleDownloadZip}
              disabled={isDownloading}
              title="Scarica foto"
            >
              {isDownloading ? (
                <span className="rdp__spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
          {onDelete && (
            <button type="button" className="rdp__action rdp__action--danger" onClick={() => onDelete(rilevamento.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="rdp__scroll">
        {/* Hero */}
        <div className="rdp__hero">
          <span className="rdp__badge">{rilevamento.tipo?.name || "Intervento"}</span>
          <h2 className="rdp__address">{rilevamento.via} {rilevamento.numero_civico}</h2>
          <p className="rdp__comune">{rilevamento.comune?.name}</p>
          <p className="rdp__date">{formatDate(rilevamento.rilevamento_date)}</p>
          <p className="rdp__time">
            🕐 {formatTime(rilevamento.rilevamento_time)}
            {rilevamento.ora_fine && <span> → {formatTime(rilevamento.ora_fine)}</span>}
          </p>
        </div>

        {/* Foto */}
        {photos.length > 0 && (
          <div className="rdp__photos">
            <PhotoCarousel photos={photos} />
          </div>
        )}

        {/* Cards */}
        <div className="rdp__cards">
          {/* Info Lavoro */}
          <div className="rdp-card">
            <h3 className="rdp-card__title">📋 Informazioni Lavoro</h3>
            <div className="rdp-card__grid">
              <div className="rdp-card__field">
                <span className="rdp-card__label">Impresa</span>
                <span className="rdp-card__value">{rilevamento.impresa?.name || "—"}</span>
              </div>
              <div className="rdp-card__field">
                <span className="rdp-card__label">N° Operai</span>
                <span className="rdp-card__value rdp-card__value--highlight">{rilevamento.numero_operai}</span>
              </div>
            </div>
          </div>

          {/* Tubo Esistente */}
          {hasTuboEsistente && (
            <div className="rdp-card rdp-card--yellow">
              <h3 className="rdp-card__title">🔶 Tubo Esistente</h3>
              <div className="rdp-card__grid rdp-card__grid--4">
                {(rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo) && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Materiale</span>
                    <span className="rdp-card__value">{rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo}</span>
                  </div>
                )}
                {(rilevamento.tubo_esistente_diametro || rilevamento.diametro) && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Diametro</span>
                    <span className="rdp-card__value">{rilevamento.tubo_esistente_diametro || rilevamento.diametro} mm</span>
                  </div>
                )}
                {rilevamento.tubo_esistente_pn && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">PN</span>
                    <span className="rdp-card__value">{rilevamento.tubo_esistente_pn}</span>
                  </div>
                )}
                {rilevamento.tubo_esistente_profondita && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Profondità</span>
                    <span className="rdp-card__value">{rilevamento.tubo_esistente_profondita} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tubo Nuovo */}
          {hasTuboNuovo && (
            <div className="rdp-card rdp-card--green">
              <h3 className="rdp-card__title">🟢 Tubo Nuovo</h3>
              <div className="rdp-card__grid rdp-card__grid--4">
                {rilevamento.tubo_nuovo_materiale && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Materiale</span>
                    <span className="rdp-card__value">{rilevamento.tubo_nuovo_materiale}</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_diametro && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Diametro</span>
                    <span className="rdp-card__value">{rilevamento.tubo_nuovo_diametro} mm</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_pn && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">PN</span>
                    <span className="rdp-card__value">{rilevamento.tubo_nuovo_pn}</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_profondita && (
                  <div className="rdp-card__field">
                    <span className="rdp-card__label">Profondità</span>
                    <span className="rdp-card__value">{rilevamento.tubo_nuovo_profondita} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Altri Interventi */}
          {rilevamento.altri_interventi && (
            <div className="rdp-card">
              <h3 className="rdp-card__title">✅ Altri Interventi</h3>
              <p className="rdp-card__text">{rilevamento.altri_interventi}</p>
            </div>
          )}

          {/* Note */}
          {rilevamento.notes && (
            <div className="rdp-card">
              <h3 className="rdp-card__title">📝 Note</h3>
              <p className="rdp-card__text">{rilevamento.notes}</p>
            </div>
          )}

          {/* GPS */}
          {lat && lon && (
            <div className="rdp-card">
              <h3 className="rdp-card__title">📍 Posizione GPS</h3>
              <code className="rdp-card__code">{lat.toFixed(6)}, {lon.toFixed(6)}</code>
              <a
                href={`https://www.google.com/maps?q=${lat},${lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rdp-card__link"
              >
                Apri in Google Maps →
              </a>
            </div>
          )}

          {/* Meta - Info Registrazione */}
          <div className="rdp-card rdp-card--muted">
            <h3 className="rdp-card__title">ℹ️ Info Registrazione</h3>
            <div className="rdp-card__grid">
              {rilevamento.operaio && (
                <div className="rdp-card__field">
                  <span className="rdp-card__label">Registrato da</span>
                  <span className="rdp-card__value">{rilevamento.operaio.full_name || rilevamento.operaio.email || "—"}</span>
                </div>
              )}
              {isAdmin && (
                <div className="rdp-card__field">
                  <span className="rdp-card__label">Data inserimento</span>
                  <span className="rdp-card__value">{formatTimestamp(rilevamento.submit_timestamp || rilevamento.created_at)}</span>
                </div>
              )}
              {isAdmin && rilevamento.submit_gps_lat && rilevamento.submit_gps_lon && (
                <div className="rdp-card__field">
                  <span className="rdp-card__label">GPS invio</span>
                  <code className="rdp-card__value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {rilevamento.submit_gps_lat.toFixed(6)}, {rilevamento.submit_gps_lon.toFixed(6)}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RilevamentoDetail;