import { useEffect, useMemo } from "react";
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
}

const RilevamentoDetail = ({ rilevamento, onClose, onDelete }: RilevamentoDetailProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
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

  return (
    <div className="detail-page">
      {/* Header */}
      <header className="detail-page__header">
        <button type="button" className="detail-page__back" onClick={onClose} aria-label="Torna indietro">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="detail-page__header-title">
          <span className="detail-page__header-label">Dettaglio Intervento</span>
        </div>
        <div className="detail-page__header-actions">
          {onDelete && (
            <button type="button" className="detail-page__action detail-page__action--danger" onClick={() => onDelete(rilevamento.id)} aria-label="Elimina">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="detail-page__content">
        {/* Hero - Tipo Lavorazione Grande */}
        <section className="detail-page__hero">
          <div className="detail-page__type-container">
            <div className="detail-page__type-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="detail-page__type-name">{rilevamento.tipo?.name || "Intervento"}</h1>
          </div>
        </section>

        {/* Gallery Foto */}
        {photos.length > 0 && (
          <section className="detail-page__gallery">
            <PhotoCarousel photos={photos} />
          </section>
        )}

        {/* Informazioni principali */}
        <div className="detail-page__body">
          {/* Card Luogo e Data */}
          <div className="detail-card">
            <div className="detail-card__row">
              <div className="detail-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="detail-card__content">
                <span className="detail-card__label">Indirizzo</span>
                <strong className="detail-card__value">{rilevamento.via} {rilevamento.numero_civico}</strong>
                <span className="detail-card__sub">{rilevamento.comune?.name}</span>
              </div>
            </div>
            <div className="detail-card__divider" />
            <div className="detail-card__row">
              <div className="detail-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="detail-card__content">
                <span className="detail-card__label">Data e Orario</span>
                <strong className="detail-card__value">{formatDate(rilevamento.rilevamento_date)}</strong>
                <span className="detail-card__sub">
                  {formatTime(rilevamento.rilevamento_time)}
                  {rilevamento.ora_fine && ` → ${formatTime(rilevamento.ora_fine)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Card Impresa e Operai */}
          <div className="detail-card detail-card--grid">
            <div className="detail-card__cell">
              <span className="detail-card__label">Impresa</span>
              <strong className="detail-card__value">{rilevamento.impresa?.name || "—"}</strong>
            </div>
            <div className="detail-card__cell">
              <span className="detail-card__label">N° Operai</span>
              <strong className="detail-card__value detail-card__value--big">{rilevamento.numero_operai}</strong>
            </div>
          </div>

          {/* Tubo Esistente */}
          {hasTuboEsistente && (
            <div className="detail-card detail-card--accent-yellow">
              <div className="detail-card__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Tubo Esistente</span>
              </div>
              <div className="detail-card__specs">
                {(rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo) && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Materiale</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo}</span>
                  </div>
                )}
                {(rilevamento.tubo_esistente_diametro || rilevamento.diametro) && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Diametro</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_esistente_diametro || rilevamento.diametro} mm</span>
                  </div>
                )}
                {rilevamento.tubo_esistente_pn && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">PN</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_esistente_pn}</span>
                  </div>
                )}
                {rilevamento.tubo_esistente_profondita && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Profondità</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_esistente_profondita} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tubo Nuovo */}
          {hasTuboNuovo && (
            <div className="detail-card detail-card--accent-green">
              <div className="detail-card__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>Tubo Nuovo</span>
              </div>
              <div className="detail-card__specs">
                {rilevamento.tubo_nuovo_materiale && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Materiale</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_nuovo_materiale}</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_diametro && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Diametro</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_nuovo_diametro} mm</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_pn && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">PN</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_nuovo_pn}</span>
                  </div>
                )}
                {rilevamento.tubo_nuovo_profondita && (
                  <div className="detail-card__spec">
                    <span className="detail-card__spec-label">Profondità</span>
                    <span className="detail-card__spec-value">{rilevamento.tubo_nuovo_profondita} cm</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Altri Interventi */}
          {rilevamento.altri_interventi && (
            <div className="detail-card">
              <div className="detail-card__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <span>Altri Interventi</span>
              </div>
              <p className="detail-card__text">{rilevamento.altri_interventi}</p>
            </div>
          )}

          {/* Note */}
          {rilevamento.notes && (
            <div className="detail-card">
              <div className="detail-card__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>Note</span>
              </div>
              <p className="detail-card__text">{rilevamento.notes}</p>
            </div>
          )}

          {/* Posizione GPS */}
          {lat && lon && (
            <div className="detail-card">
              <div className="detail-card__header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Coordinate GPS</span>
              </div>
              <div className="detail-card__gps">
                <code className="detail-card__coords">{lat.toFixed(6)}, {lon.toFixed(6)}</code>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-card__map-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Apri in Maps
                </a>
              </div>
            </div>
          )}

          {/* Metadati Registrazione */}
          <div className="detail-card detail-card--muted">
            <div className="detail-card__meta">
              {rilevamento.operaio && (
                <div className="detail-card__meta-item">
                  <span className="detail-card__meta-label">Registrato da</span>
                  <span className="detail-card__meta-value">{rilevamento.operaio.full_name || rilevamento.operaio.email || "—"}</span>
                </div>
              )}
              <div className="detail-card__meta-item">
                <span className="detail-card__meta-label">Data inserimento</span>
                <span className="detail-card__meta-value">{formatTimestamp(rilevamento.submit_timestamp || rilevamento.created_at)}</span>
              </div>
              {rilevamento.submit_gps_lat && rilevamento.submit_gps_lon && (
                <div className="detail-card__meta-item detail-card__meta-item--full">
                  <span className="detail-card__meta-label">GPS invio</span>
                  <code className="detail-card__meta-value">{rilevamento.submit_gps_lat.toFixed(6)}, {rilevamento.submit_gps_lon.toFixed(6)}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RilevamentoDetail;