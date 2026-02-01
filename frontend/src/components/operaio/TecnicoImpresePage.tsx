// TecnicoImpresePage.tsx
// Page for technicians to view all imprese and their interventions

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import RilevamentoDetail from "../ui/RilevamentoDetail";
import Pagination from "../ui/Pagination";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const ITEMS_PER_PAGE = 10;

interface Impresa {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  email: string;
  telefono: string;
  indirizzo: string;
  attiva: boolean;
  created_at: string;
}

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

const TecnicoImpresePage = () => {
  const { tokens } = useAuthStore();
  const [selectedImpresa, setSelectedImpresa] = useState<Impresa | null>(null);
  const [selectedRilevamento, setSelectedRilevamento] = useState<Rilevamento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch imprese
  const { data: imprese, isLoading: isLoadingImprese } = useQuery<Impresa[]>({
    queryKey: ["tecnico-imprese"],
    queryFn: async () => {
      if (!tokens) throw new Error("Token mancante");
      const response = await fetch(`${API_BASE}/admin/imprese`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      if (!response.ok) throw new Error("Errore nel caricamento imprese");
      const data = await response.json();
      // API returns { imprese: [...] }, map to our interface
      return (data.imprese || []).map((imp: any) => ({
        id: imp.id,
        ragione_sociale: imp.name,
        partita_iva: imp.partita_iva || "",
        email: imp.email || "",
        telefono: imp.phone || "",
        indirizzo: imp.address || "",
        attiva: true,
        created_at: imp.created_at || ""
      }));
    },
    enabled: Boolean(tokens)
  });

  // Fetch rilevamenti for selected impresa
  const { data: rilevamenti, isLoading: isLoadingRilevamenti } = useQuery<Rilevamento[]>({
    queryKey: ["tecnico-impresa-rilevamenti", selectedImpresa?.id],
    queryFn: async () => {
      if (!tokens || !selectedImpresa) throw new Error("Token o impresa mancante");
      const response = await fetch(`${API_BASE}/rilevamenti?impresaId=${selectedImpresa.id}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
      });
      if (!response.ok) throw new Error("Errore nel caricamento rilevamenti");
      const data = await response.json();
      return data.rilevamenti || [];
    },
    enabled: Boolean(tokens) && Boolean(selectedImpresa)
  });

  const filteredImprese = imprese?.filter(impresa => 
    impresa.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    impresa.partita_iva?.includes(searchTerm)
  ) || [];

  // Pagination
  const totalPages = Math.ceil(filteredImprese.length / ITEMS_PER_PAGE);
  const paginatedImprese = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredImprese.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredImprese, currentPage]);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Impresa detail view
  if (selectedImpresa) {
    return (
      <div className="tecnico-impresa-detail">
        {/* Header con back button */}
        <div className="tecnico-impresa-detail__header">
          <button
            type="button"
            className="tecnico-impresa-detail__back"
            onClick={() => setSelectedImpresa(null)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Torna alle imprese
          </button>
        </div>

        {/* Impresa info card */}
        <div className="impresa-info-card">
          <h2 className="impresa-info-card__name">{selectedImpresa.ragione_sociale}</h2>
          <div className="impresa-info-card__details">
            {selectedImpresa.partita_iva && (
              <div className="impresa-info-card__item">
                <span className="impresa-info-card__label">P.IVA:</span>
                <span className="impresa-info-card__value">{selectedImpresa.partita_iva}</span>
              </div>
            )}
            {selectedImpresa.email && (
              <div className="impresa-info-card__item">
                <span className="impresa-info-card__label">Email:</span>
                <a href={`mailto:${selectedImpresa.email}`} className="impresa-info-card__link">
                  {selectedImpresa.email}
                </a>
              </div>
            )}
            {selectedImpresa.telefono && (
              <div className="impresa-info-card__item">
                <span className="impresa-info-card__label">Telefono:</span>
                <a href={`tel:${selectedImpresa.telefono}`} className="impresa-info-card__link">
                  {selectedImpresa.telefono}
                </a>
              </div>
            )}
            {selectedImpresa.indirizzo && (
              <div className="impresa-info-card__item">
                <span className="impresa-info-card__label">Indirizzo:</span>
                <span className="impresa-info-card__value">{selectedImpresa.indirizzo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rilevamenti dell'impresa */}
        <div className="tecnico-impresa-detail__rilevamenti">
          <h3 className="tecnico-impresa-detail__section-title">
            Interventi ({rilevamenti?.length || 0})
          </h3>
          
          {isLoadingRilevamenti ? (
            <div className="tecnico-impresa-detail__loading">
              <span className="spinner" /> Caricamento interventi...
            </div>
          ) : rilevamenti && rilevamenti.length > 0 ? (
            <div className="rilevamenti-list">
              {rilevamenti.map(rilevamento => (
                <button
                  key={rilevamento.id}
                  type="button"
                  className="rilevamento-card"
                  onClick={() => setSelectedRilevamento(rilevamento)}
                >
                  <div className="rilevamento-card__main">
                    <span className="rilevamento-card__address">
                      {rilevamento.via} {rilevamento.numero_civico}
                    </span>
                    <span className="rilevamento-card__comune">
                      {rilevamento.comune?.name}
                    </span>
                  </div>
                  <div className="rilevamento-card__meta">
                    <span className="rilevamento-card__date">
                      {formatDate(rilevamento.rilevamento_date)}
                    </span>
                    <span className="rilevamento-card__tipo">
                      {rilevamento.tipo?.name}
                    </span>
                  </div>
                  <svg className="rilevamento-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <div className="tecnico-impresa-detail__empty">
              <span className="tecnico-impresa-detail__empty-icon">📋</span>
              <p>Nessun intervento registrato per questa impresa</p>
            </div>
          )}
        </div>

        {/* Rilevamento detail modal */}
        {selectedRilevamento && (
          <RilevamentoDetail
            rilevamento={selectedRilevamento}
            onClose={() => setSelectedRilevamento(null)}
          />
        )}
      </div>
    );
  }

  // Main imprese list view
  return (
    <div className="tecnico-imprese-page">
      <div className="tecnico-imprese-page__header">
        <h1>Imprese</h1>
        <p>Visualizza le imprese e i loro interventi</p>
      </div>

      {/* Search bar */}
      <div className="tecnico-imprese-page__search">
        <div className="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Cerca impresa..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-input__clear"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Imprese list */}
      {isLoadingImprese ? (
        <div className="tecnico-imprese-page__loading">
          <span className="spinner" /> Caricamento imprese...
        </div>
      ) : paginatedImprese.length > 0 ? (
        <>
          <div className="imprese-list">
            {paginatedImprese.map(impresa => (
              <button
                key={impresa.id}
                type="button"
                className={`impresa-card ${!impresa.attiva ? "impresa-card--inactive" : ""}`}
                onClick={() => setSelectedImpresa(impresa)}
              >
                <div className="impresa-card__icon">
                  🏢
                </div>
                <div className="impresa-card__content">
                  <span className="impresa-card__name">{impresa.ragione_sociale}</span>
                  {impresa.partita_iva && (
                    <span className="impresa-card__piva">P.IVA: {impresa.partita_iva}</span>
                  )}
                </div>
                <svg className="impresa-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredImprese.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </>
      ) : (
        <div className="tecnico-imprese-page__empty">
          <span className="tecnico-imprese-page__empty-icon">🏢</span>
          <p>{searchTerm ? "Nessuna impresa trovata" : "Nessuna impresa disponibile"}</p>
        </div>
      )}
    </div>
  );
};

export default TecnicoImpresePage;
