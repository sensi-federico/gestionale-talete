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
        {/* Hero con foto e info principali */}
        <section className="detail-page__hero">
          <div className="detail-page__hero-media">
            {photos.length > 0 ? (
              <PhotoCarousel photos={photos} />
            ) : (
              <div className="detail-page__no-photo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Nessuna foto</span>
              </div>
            )}
          </div>
          <div className="detail-page__hero-info">
            <span className="detail-page__type-badge">{rilevamento.tipo?.name || "Intervento"}</span>
            <h1 className="detail-page__address">{rilevamento.via} {rilevamento.numero_civico}</h1>
            <p className="detail-page__location">{rilevamento.comune?.name}</p>
            <div className="detail-page__datetime">
              <span className="detail-page__date">{formatDate(rilevamento.rilevamento_date)}</span>
              <span className="detail-page__time-separator">•</span>
              <span className="detail-page__time">
                {formatTime(rilevamento.rilevamento_time)}
                {rilevamento.ora_fine && ` → ${formatTime(rilevamento.ora_fine)}`}
              </span>
            </div>
          </div>
        </section>

        {/* Sezioni informative */}
        <div className="detail-page__sections">
          {/* Dettagli Lavoro */}
          <section className="detail-section">
            <header className="detail-section__header">
              <div className="detail-section__icon detail-section__icon--work">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="detail-section__title">Dettagli Lavoro</h2>
            </header>
            <div className="detail-section__body">
              <div className="detail-grid detail-grid--2">
                <div className="detail-item">
                  <span className="detail-item__label">Impresa</span>
                  <span className="detail-item__value">{rilevamento.impresa?.name || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Operai</span>
                  <span className="detail-item__value detail-item__value--number">{rilevamento.numero_operai}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tubo Esistente */}
          {hasTuboEsistente && (
            <section className="detail-section detail-section--tubo-esistente">
              <header className="detail-section__header">
                <div className="detail-section__icon detail-section__icon--old">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="detail-section__title">Tubo Esistente</h2>
              </header>
              <div className="detail-section__body">
                <div className="detail-grid detail-grid--4">
                  {(rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo) && (
                    <div className="detail-item">
                      <span className="detail-item__label">Materiale</span>
                      <span className="detail-item__value">{rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo}</span>
                    </div>
                  )}
                  {(rilevamento.tubo_esistente_diametro || rilevamento.diametro) && (
                    <div className="detail-item">
                      <span className="detail-item__label">Diametro</span>
                      <span className="detail-item__value">{rilevamento.tubo_esistente_diametro || rilevamento.diametro} <small>mm</small></span>
                    </div>
                  )}
                  {rilevamento.tubo_esistente_pn && (
                    <div className="detail-item">
                      <span className="detail-item__label">PN</span>
                      <span className="detail-item__value">{rilevamento.tubo_esistente_pn}</span>
                    </div>
                  )}
                  {rilevamento.tubo_esistente_profondita && (
                    <div className="detail-item">
                      <span className="detail-item__label">Profondità</span>
                      <span className="detail-item__value">{rilevamento.tubo_esistente_profondita} <small>cm</small></span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Tubo Nuovo */}
          {hasTuboNuovo && (
            <section className="detail-section detail-section--tubo-nuovo">
              <header className="detail-section__header">
                <div className="detail-section__icon detail-section__icon--new">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="detail-section__title">Tubo Nuovo</h2>
              </header>
              <div className="detail-section__body">
                <div className="detail-grid detail-grid--4">
                  {rilevamento.tubo_nuovo_materiale && (
                    <div className="detail-item">
                      <span className="detail-item__label">Materiale</span>
                      <span className="detail-item__value">{rilevamento.tubo_nuovo_materiale}</span>
                    </div>
                  )}
                  {rilevamento.tubo_nuovo_diametro && (
                    <div className="detail-item">
                      <span className="detail-item__label">Diametro</span>
                      <span className="detail-item__value">{rilevamento.tubo_nuovo_diametro} <small>mm</small></span>
                    </div>
                  )}
                  {rilevamento.tubo_nuovo_pn && (
                    <div className="detail-item">
                      <span className="detail-item__label">PN</span>
                      <span className="detail-item__value">{rilevamento.tubo_nuovo_pn}</span>
                    </div>
                  )}
                  {rilevamento.tubo_nuovo_profondita && (
                    <div className="detail-item">
                      <span className="detail-item__label">Profondità</span>
                      <span className="detail-item__value">{rilevamento.tubo_nuovo_profondita} <small>cm</small></span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Altri Interventi */}
          {rilevamento.altri_interventi && (
            <section className="detail-section">
              <header className="detail-section__header">
                <div className="detail-section__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="detail-section__title">Altri Interventi</h2>
              </header>
              <div className="detail-section__body">
                <p className="detail-section__text">{rilevamento.altri_interventi}</p>
              </div>
            </section>
          )}

          {/* Note */}
          {rilevamento.notes && (
            <section className="detail-section">
              <header className="detail-section__header">
                <div className="detail-section__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="detail-section__title">Note</h2>
              </header>
              <div className="detail-section__body">
                <p className="detail-section__text">{rilevamento.notes}</p>
              </div>
            </section>
          )}

          {/* Posizione GPS */}
          {lat && lon && (
            <section className="detail-section detail-section--location">
              <header className="detail-section__header">
                <div className="detail-section__icon detail-section__icon--location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <h2 className="detail-section__title">Posizione</h2>
              </header>
              <div className="detail-section__body">
                <div className="detail-location">
                  <code className="detail-location__coords">{lat.toFixed(6)}, {lon.toFixed(6)}</code>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-location__link"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Apri in Maps
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Informazioni Registrazione */}
          <section className="detail-section detail-section--meta">
            <header className="detail-section__header">
              <div className="detail-section__icon detail-section__icon--info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="detail-section__title">Informazioni Registrazione</h2>
            </header>
            <div className="detail-section__body">
              <div className="detail-grid detail-grid--2">
                {rilevamento.operaio && (
                  <div className="detail-item">
                    <span className="detail-item__label">Registrato da</span>
                    <span className="detail-item__value">{rilevamento.operaio.full_name || rilevamento.operaio.email || "—"}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-item__label">Data inserimento</span>
                  <span className="detail-item__value">{formatTimestamp(rilevamento.submit_timestamp || rilevamento.created_at)}</span>
                </div>
                {rilevamento.submit_gps_lat && rilevamento.submit_gps_lon && (
                  <div className="detail-item detail-item--full">
                    <span className="detail-item__label">GPS al momento dell'invio</span>
                    <code className="detail-item__value detail-item__value--mono">
                      {rilevamento.submit_gps_lat.toFixed(6)}, {rilevamento.submit_gps_lon.toFixed(6)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RilevamentoDetail;