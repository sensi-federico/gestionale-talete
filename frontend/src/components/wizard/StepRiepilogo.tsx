// StepRiepilogo.tsx
// Step 6: Riepilogo completo dell'intervento con mini-mappa e possibilità di modifica

import { useMemo, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { WizardFormState, TIPI_OPERAIO } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";

// Stile satellite per mini-mappa
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri"
    }
  },
  layers: [{ id: "satellite-tiles", type: "raster", source: "satellite", minzoom: 0, maxzoom: 19 }]
};

interface StepRiepilogoProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  referenceData: ReferenceData | undefined;
  isLoadingReference: boolean;
  goToStep: (step: number) => void;
  isImpresa: boolean;
}

const StepRiepilogo = ({
  formState,
  referenceData,
  goToStep,
  isImpresa
}: StepRiepilogoProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  // Lookup helpers
  const comuneNome = useMemo(() => 
    referenceData?.comuni?.find(c => c.id === formState.comuneId)?.nome || "-",
    [referenceData?.comuni, formState.comuneId]
  );

  const tipoLavorazioneNome = useMemo(() => 
    referenceData?.tipiLavorazione?.find(t => t.id === formState.tipoLavorazioneId)?.nome || "-",
    [referenceData?.tipiLavorazione, formState.tipoLavorazioneId]
  );

  const impresaNome = useMemo(() => {
    if (isImpresa) return "La tua impresa";
    return referenceData?.imprese?.find(i => i.id === formState.impresaId)?.ragione_sociale || "-";
  }, [referenceData?.imprese, formState.impresaId, isImpresa]);

  // Calcoli totali
  const totaleOperai = formState.operai.reduce((sum, o) => sum + o.numero, 0);
  const totaleOreUomo = formState.operai.reduce((sum, o) => sum + (o.numero * o.oreLavoro), 0);
  const totaleOreMezzi = formState.mezziUtilizzo.reduce((sum, m) => sum + m.oreUtilizzo, 0);
  const totaleOreAttrezzature = formState.attrezzatureUtilizzo.reduce((sum, a) => sum + a.oreUtilizzo, 0);

  // Inizializza mini-mappa
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!formState.manualLat || !formState.manualLon) return;
    
    // Cleanup previous map if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: SATELLITE_STYLE,
      center: [formState.manualLon, formState.manualLat],
      zoom: 16,
      interactive: false // Mini-mappa non interattiva
    } as any);

    // Aggiungi marker
    const el = document.createElement("div");
    el.className = "map-marker-pin";
    el.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new maplibregl.Marker({ element: el, anchor: "bottom" } as any)
      .setLngLat([formState.manualLon, formState.manualLat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [formState.manualLat, formState.manualLon]);

  // Componente sezione riepilogo
  const RiepilogoSection = ({ 
    title, 
    icon, 
    stepNumber, 
    children 
  }: { 
    title: string; 
    icon: string; 
    stepNumber: number; 
    children: React.ReactNode;
  }) => (
    <div className="riepilogo-section">
      <div className="riepilogo-section__header">
        <h4 className="riepilogo-section__title">
          {icon} {title}
        </h4>
        <button
          type="button"
          className="riepilogo-section__edit"
          onClick={() => goToStep(stepNumber)}
        >
          ✏️ Modifica
        </button>
      </div>
      <div className="riepilogo-section__content">
        {children}
      </div>
    </div>
  );

  return (
    <div className="step-riepilogo">
      <div className="step-riepilogo__header">
        <h3>Verifica i dati prima dell'invio</h3>
        <p>Controlla che tutte le informazioni siano corrette</p>
      </div>

      {/* 1. Luogo */}
      <RiepilogoSection title="Luogo" icon="📍" stepNumber={1}>
        {formState.manualLat && formState.manualLon && (
          <div 
            ref={mapContainerRef} 
            className="riepilogo-minimap"
            style={{ height: "250px", marginBottom: "12px", borderRadius: "12px", overflow: "hidden" }}
          />
        )}
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Comune:</span>
          <span className="riepilogo-field__value">{comuneNome}</span>
        </div>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Indirizzo:</span>
          <span className="riepilogo-field__value">
            {formState.via} {formState.numeroCivico}
          </span>
        </div>
        {formState.manualLat && formState.manualLon && (
          <div className="riepilogo-field riepilogo-field--small">
            <span className="riepilogo-field__label">Coordinate:</span>
            <span className="riepilogo-field__value">
              {formState.manualLat.toFixed(6)}, {formState.manualLon.toFixed(6)}
            </span>
          </div>
        )}
      </RiepilogoSection>

      {/* 2. Lavoro */}
      <RiepilogoSection title="Lavoro" icon="🔧" stepNumber={2}>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Tipo Lavorazione:</span>
          <span className="riepilogo-field__value">{tipoLavorazioneNome}</span>
        </div>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Impresa:</span>
          <span className="riepilogo-field__value">{impresaNome}</span>
        </div>
        {formState.materialeTubo && (
          <div className="riepilogo-field">
            <span className="riepilogo-field__label">Materiale Tubo:</span>
            <span className="riepilogo-field__value">{formState.materialeTubo}</span>
          </div>
        )}
        {formState.diametro && (
          <div className="riepilogo-field">
            <span className="riepilogo-field__label">Diametro:</span>
            <span className="riepilogo-field__value">{formState.diametro} mm</span>
          </div>
        )}
        {formState.altriInterventi && (
          <div className="riepilogo-field">
            <span className="riepilogo-field__label">Altri Interventi:</span>
            <span className="riepilogo-field__value">{formState.altriInterventi}</span>
          </div>
        )}
      </RiepilogoSection>

      {/* 3. Operai */}
      <RiepilogoSection title="Operai" icon="👷" stepNumber={3}>
        {formState.operai.length === 0 ? (
          <div className="riepilogo-empty">Nessun operaio specificato</div>
        ) : (
          <>
            {formState.operai.map((op, idx) => {
              const tipoLabel = TIPI_OPERAIO.find(t => t.value === op.tipoOperaio)?.label || op.tipoOperaio;
              return (
                <div key={idx} className="riepilogo-field">
                  <span className="riepilogo-field__label">{tipoLabel}:</span>
                  <span className="riepilogo-field__value">
                    {op.numero} × {op.oreLavoro}h = {op.numero * op.oreLavoro} ore/uomo
                  </span>
                </div>
              );
            })}
            <div className="riepilogo-field riepilogo-field--total">
              <span className="riepilogo-field__label">Totale:</span>
              <span className="riepilogo-field__value">
                {totaleOperai} operai, {totaleOreUomo} ore/uomo
              </span>
            </div>
          </>
        )}
      </RiepilogoSection>

      {/* 4. Mezzi e Attrezzature */}
      <RiepilogoSection title="Mezzi e Attrezzature" icon="🚛" stepNumber={4}>
        {formState.mezziUtilizzo.length === 0 && formState.attrezzatureUtilizzo.length === 0 ? (
          <div className="riepilogo-empty">Nessun mezzo o attrezzatura specificato</div>
        ) : (
          <>
            {formState.mezziUtilizzo.length > 0 && (
              <div className="riepilogo-subsection">
                <strong>Mezzi:</strong>
                {formState.mezziUtilizzo.map((m, idx) => (
                  <div key={idx} className="riepilogo-field">
                    <span className="riepilogo-field__label">{m.mezzoNome}:</span>
                    <span className="riepilogo-field__value">{m.oreUtilizzo}h</span>
                  </div>
                ))}
                <div className="riepilogo-field riepilogo-field--subtotal">
                  <span>Totale ore mezzi: {totaleOreMezzi}h</span>
                </div>
              </div>
            )}
            
            {formState.attrezzatureUtilizzo.length > 0 && (
              <div className="riepilogo-subsection">
                <strong>Attrezzature:</strong>
                {formState.attrezzatureUtilizzo.map((a, idx) => (
                  <div key={idx} className="riepilogo-field">
                    <span className="riepilogo-field__label">{a.attrezzaturaNome}:</span>
                    <span className="riepilogo-field__value">{a.oreUtilizzo}h</span>
                  </div>
                ))}
                <div className="riepilogo-field riepilogo-field--subtotal">
                  <span>Totale ore attrezzature: {totaleOreAttrezzature}h</span>
                </div>
              </div>
            )}
          </>
        )}
      </RiepilogoSection>

      {/* 5. Documenta */}
      <RiepilogoSection title="Documentazione" icon="📸" stepNumber={5}>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Data:</span>
          <span className="riepilogo-field__value">
            {new Date(formState.rilevamentoDate).toLocaleDateString("it-IT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </span>
        </div>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Orario:</span>
          <span className="riepilogo-field__value">
            {formState.oraInizio}
            {formState.oraFine ? ` - ${formState.oraFine}` : ""}
          </span>
        </div>
        <div className="riepilogo-field">
          <span className="riepilogo-field__label">Foto:</span>
          <span className="riepilogo-field__value">
            {formState.fotoPreview ? "✅ Allegata" : "❌ Non allegata"}
          </span>
        </div>
        {formState.fotoPreview && (
          <img 
            src={formState.fotoPreview} 
            alt="Foto intervento" 
            className="riepilogo-photo-thumb"
          />
        )}
        {formState.notes && (
          <div className="riepilogo-field">
            <span className="riepilogo-field__label">Note:</span>
            <span className="riepilogo-field__value riepilogo-field__value--notes">
              {formState.notes}
            </span>
          </div>
        )}
      </RiepilogoSection>

      {/* Conferma finale */}
      <div className="step-riepilogo__confirm">
        <div className="info-box info-box--green">
          <span className="info-box__icon">✅</span>
          <p>
            Tutto pronto! Controlla i dati e premi <strong>"Invia Intervento"</strong> per confermare.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepRiepilogo;
