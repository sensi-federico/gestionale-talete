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

  return (
    <div className="intervento-detail">
      {/* Header */}
      <header className="intervento-detail__header">
        <button type="button" className="intervento-detail__back" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Indietro</span>
        </button>
        <div className="intervento-detail__header-actions">
          {onDelete && (
            <button type="button" className="intervento-detail__delete" onClick={() => onDelete(rilevamento.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="intervento-detail__content">
        <div className="intervento-detail__container">
          {/* Left Column - Photos */}
          <div className="intervento-detail__photos">
            {photos.length > 0 ? (
              <PhotoCarousel photos={photos} />
            ) : (
              <div className="intervento-detail__no-photos">
                <span className="intervento-detail__no-photos-icon">📷</span>
                <p>Nessuna foto disponibile</p>
              </div>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="intervento-detail__info">
            {/* Hero Section */}
            <div className="intervento-detail__hero">
              <span className="intervento-detail__badge">{rilevamento.tipo?.name || "Intervento"}</span>
              <h1 className="intervento-detail__title">
                {rilevamento.via} {rilevamento.numero_civico}
              </h1>
              <p className="intervento-detail__subtitle">{rilevamento.comune?.name}</p>
              <p className="intervento-detail__date">
                📅 {formatDate(rilevamento.rilevamento_date)}
                {rilevamento.ora_fine 
                  ? ` • ${formatTime(rilevamento.rilevamento_time)} - ${formatTime(rilevamento.ora_fine)}`
                  : ` • ${formatTime(rilevamento.rilevamento_time)}`
                }
              </p>
            </div>

            {/* Info Cards */}
            <div className="intervento-detail__cards">
              {/* Card Lavoro */}
              <div className="info-card">
                <h3 className="info-card__title">🔧 Dettagli Lavoro</h3>
                <div className="info-card__grid">
                  <div className="info-card__item">
                    <span className="info-card__label">Impresa</span>
                    <span className="info-card__value">{rilevamento.impresa?.name || "—"}</span>
                  </div>
                  <div className="info-card__item">
                    <span className="info-card__label">N° Operai</span>
                    <span className="info-card__value">{rilevamento.numero_operai}</span>
                  </div>
                </div>
              </div>

              {/* Card Tubo Esistente */}
              {hasTuboEsistente && (
                <div className="info-card info-card--tubo">
                  <h3 className="info-card__title">🔩 Tubo Esistente</h3>
                  <div className="info-card__grid info-card__grid--4">
                    {(rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo) && (
                      <div className="info-card__item">
                        <span className="info-card__label">Materiale</span>
                        <span className="info-card__value">{rilevamento.tubo_esistente_materiale || rilevamento.materiale_tubo}</span>
                      </div>
                    )}
                    {(rilevamento.tubo_esistente_diametro || rilevamento.diametro) && (
                      <div className="info-card__item">
                        <span className="info-card__label">Diametro</span>
                        <span className="info-card__value">{rilevamento.tubo_esistente_diametro || rilevamento.diametro} mm</span>
                      </div>
                    )}
                    {rilevamento.tubo_esistente_pn && (
                      <div className="info-card__item">
                        <span className="info-card__label">PN</span>
                        <span className="info-card__value">{rilevamento.tubo_esistente_pn}</span>
                      </div>
                    )}
                    {rilevamento.tubo_esistente_profondita && (
                      <div className="info-card__item">
                        <span className="info-card__label">Profondità</span>
                        <span className="info-card__value">{rilevamento.tubo_esistente_profondita} cm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Tubo Nuovo */}
              {hasTuboNuovo && (
                <div className="info-card info-card--tubo-nuovo">
                  <h3 className="info-card__title">✨ Tubo Nuovo</h3>
                  <div className="info-card__grid info-card__grid--4">
                    {rilevamento.tubo_nuovo_materiale && (
                      <div className="info-card__item">
                        <span className="info-card__label">Materiale</span>
                        <span className="info-card__value">{rilevamento.tubo_nuovo_materiale}</span>
                      </div>
                    )}
                    {rilevamento.tubo_nuovo_diametro && (
                      <div className="info-card__item">
                        <span className="info-card__label">Diametro</span>
                        <span className="info-card__value">{rilevamento.tubo_nuovo_diametro} mm</span>
                      </div>
                    )}
                    {rilevamento.tubo_nuovo_pn && (
                      <div className="info-card__item">
                        <span className="info-card__label">PN</span>
                        <span className="info-card__value">{rilevamento.tubo_nuovo_pn}</span>
                      </div>
                    )}
                    {rilevamento.tubo_nuovo_profondita && (
                      <div className="info-card__item">
                        <span className="info-card__label">Profondità</span>
                        <span className="info-card__value">{rilevamento.tubo_nuovo_profondita} cm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Altri interventi */}
              {rilevamento.altri_interventi && (
                <div className="info-card">
                  <h3 className="info-card__title">📋 Altri Interventi</h3>
                  <p className="info-card__text">{rilevamento.altri_interventi}</p>
                </div>
              )}

              {/* Note */}
              {rilevamento.notes && (
                <div className="info-card">
                  <h3 className="info-card__title">📝 Note</h3>
                  <p className="info-card__text">{rilevamento.notes}</p>
                </div>
              )}

              {/* Posizione */}
              {lat && lon && (
                <div className="info-card">
                  <h3 className="info-card__title">📍 Posizione</h3>
                  <p className="info-card__coords">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-card__map-link"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Apri in Google Maps
                  </a>
                </div>
              )}

              {/* Info registrazione */}
              <div className="info-card info-card--meta">
                <h3 className="info-card__title">ℹ️ Informazioni</h3>
                <div className="info-card__grid">
                  {rilevamento.operaio && (
                    <div className="info-card__item">
                      <span className="info-card__label">Registrato da</span>
                      <span className="info-card__value">{rilevamento.operaio.full_name || rilevamento.operaio.email || "—"}</span>
                    </div>
                  )}
                  <div className="info-card__item">
                    <span className="info-card__label">Data inserimento</span>
                    <span className="info-card__value">{formatTimestamp(rilevamento.submit_timestamp || rilevamento.created_at)}</span>
                  </div>
                  {rilevamento.submit_gps_lat && rilevamento.submit_gps_lon && (
                    <div className="info-card__item">
                      <span className="info-card__label">GPS invio</span>
                      <span className="info-card__value info-card__value--mono">
                        {rilevamento.submit_gps_lat.toFixed(5)}, {rilevamento.submit_gps_lon.toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RilevamentoDetail;