// StepLuogo.tsx
// Step 1: Selezione luogo con mappa grande, geolocalizzazione automatica e geocoding bidirezionale

import { useEffect, useState, useCallback, useRef } from "react";
import maplibregl, { Marker as MapMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { WizardFormState } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";

// Stile satellite ESRI (default per precisione)
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

// Stile OSM
const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap"
    }
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }]
};

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface StepLuogoProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  updateCoords: (coords: { lat: number; lon: number }) => void;
  referenceData: ReferenceData | undefined;
  isLoadingReference: boolean;
  geolocation: {
    position: GeoPosition | null;
    error: string | null;
    isLoading: boolean;
    startTracking: () => void;
  };
}

const StepLuogo = ({
  formState,
  updateField,
  updateCoords,
  referenceData,
  isLoadingReference,
  geolocation
}: StepLuogoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const [mapType, setMapType] = useState<"satellite" | "street">("satellite");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Geocoding inverso: da coordinate a indirizzo
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    setIsGeocoding(true);
    setGeocodeError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "it" } }
      );
      
      if (!response.ok) throw new Error("Errore geocoding");
      
      const data = await response.json();
      
      if (data.address) {
        // Estrai via e numero civico
        const via = data.address.road || data.address.pedestrian || data.address.footway || "";
        const numero = data.address.house_number || "";
        
        if (via) {
          updateField("via", via);
          updateField("numeroCivico", numero);
        }
        
        // Cerca di abbinare il comune
        const comuneName = data.address.city || data.address.town || data.address.village || data.address.municipality || "";
        if (comuneName && referenceData?.comuni) {
          const matchedComune = referenceData.comuni.find(
            c => c.nome?.toLowerCase() === comuneName.toLowerCase()
          );
          if (matchedComune) {
            updateField("comuneId", matchedComune.id);
          }
        }
      }
    } catch (error) {
      console.error("Errore reverse geocoding:", error);
      setGeocodeError("Impossibile determinare l'indirizzo dalla posizione");
    } finally {
      setIsGeocoding(false);
    }
  }, [updateField, referenceData?.comuni]);

  // Geocoding diretto: da indirizzo a coordinate
  const forwardGeocode = useCallback(async () => {
    if (!formState.via || !formState.comuneId) return;
    
    const comuneNome = referenceData?.comuni?.find(c => c.id === formState.comuneId)?.nome || "";
    if (!comuneNome) return;
    
    setIsGeocoding(true);
    setGeocodeError(null);
    
    try {
      const query = `${formState.via} ${formState.numeroCivico}, ${comuneNome}, Italia`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "it" } }
      );
      
      if (!response.ok) throw new Error("Errore geocoding");
      
      const data = await response.json();
      
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        updateCoords({ lat, lon });
        
        // Centra mappa
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lon, lat], zoom: 17 });
          setMarker(lat, lon);
        }
      } else {
        setGeocodeError("Indirizzo non trovato");
      }
    } catch (error) {
      console.error("Errore forward geocoding:", error);
      setGeocodeError("Errore nella ricerca dell'indirizzo");
    } finally {
      setIsGeocoding(false);
    }
  }, [formState.via, formState.numeroCivico, formState.comuneId, referenceData?.comuni, updateCoords]);

  // Imposta marker sulla mappa
  const setMarker = useCallback((lat: number, lon: number) => {
    if (!mapRef.current) return;
    
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "map-marker-pin";
      el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" } as any);
    }
    
    markerRef.current.setLngLat([lon, lat]).addTo(mapRef.current);
  }, []);

  // Geolocalizzazione manuale (refresh)
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocalizzazione non supportata");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
        updateCoords(coords);
        setMarker(coords.lat, coords.lon);
        mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 17 });
        setIsLocating(false);
        
        // Geocoding inverso automatico
        await reverseGeocode(coords.lat, coords.lon);
      },
      (error) => {
        console.error("Errore geolocalizzazione:", error);
        setIsLocating(false);
        alert("Impossibile ottenere la posizione. Verifica i permessi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateCoords, setMarker, reverseGeocode]);

  // Toggle tipo mappa
  const toggleMapType = useCallback(() => {
    const newType = mapType === "satellite" ? "street" : "satellite";
    setMapType(newType);
    mapRef.current?.setStyle(newType === "satellite" ? SATELLITE_STYLE : OSM_STYLE);
  }, [mapType]);

  // Auto-geolocalizzazione all'avvio
  useEffect(() => {
    if (geolocation.position && !formState.manualLat && !formState.manualLon) {
      const coords = { 
        lat: geolocation.position.latitude, 
        lon: geolocation.position.longitude 
      };
      updateCoords(coords);
      
      // Geocoding inverso automatico
      reverseGeocode(coords.lat, coords.lon);
    }
  }, [geolocation.position, formState.manualLat, formState.manualLon, updateCoords, reverseGeocode]);

  // Inizializza mappa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = formState.manualLat && formState.manualLon
      ? [formState.manualLon, formState.manualLat]
      : geolocation.position
        ? [geolocation.position.longitude, geolocation.position.latitude]
        : [12.4964, 41.9028]; // Default Roma

    const initialZoom = formState.manualLat || geolocation.position ? 16 : 6;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: initialCenter as [number, number],
      zoom: initialZoom
    } as any);

    // Click sulla mappa
    map.on("click", async (e) => {
      const coords = { lat: e.lngLat.lat, lon: e.lngLat.lng };
      updateCoords(coords);
      setMarker(coords.lat, coords.lon);
      
      // Geocoding inverso automatico
      await reverseGeocode(coords.lat, coords.lon);
    });

    // Ripristina marker dopo cambio stile
    map.on("style.load", () => {
      if (formState.manualLat && formState.manualLon) {
        setMarker(formState.manualLat, formState.manualLon);
      }
    });

    mapRef.current = map;

    // Imposta marker iniziale se ci sono coordinate
    if (formState.manualLat && formState.manualLon) {
      setTimeout(() => setMarker(formState.manualLat!, formState.manualLon!), 100);
    }

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Aggiorna marker quando cambiano le coordinate esterne
  useEffect(() => {
    if (formState.manualLat && formState.manualLon && mapRef.current) {
      setMarker(formState.manualLat, formState.manualLon);
    }
  }, [formState.manualLat, formState.manualLon, setMarker]);

  return (
    <div className="step-luogo">
      {/* Mappa grande */}
      <div className="step-luogo__map-wrapper">
        <div 
          ref={containerRef} 
          className="step-luogo__map"
          style={{ height: "50vh", minHeight: "300px" }}
        />
        
        {/* Controlli mappa sovrapposti */}
        <div className="step-luogo__map-controls">
          <button
            type="button"
            className="step-luogo__map-btn"
            onClick={handleGeolocate}
            disabled={isLocating}
            title="Aggiorna posizione GPS"
          >
            {isLocating ? (
              <span className="spinner-small" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
              </svg>
            )}
          </button>
          
          <button
            type="button"
            className="step-luogo__map-btn"
            onClick={toggleMapType}
            title={mapType === "satellite" ? "Vista mappa" : "Vista satellite"}
          >
            {mapType === "satellite" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 3v18"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/>
              </svg>
            )}
          </button>
        </div>

        {/* Coordinate */}
        {formState.manualLat && formState.manualLon && (
          <div className="step-luogo__coords">
            📍 {formState.manualLat.toFixed(6)}, {formState.manualLon.toFixed(6)}
          </div>
        )}
        
        {/* Hint */}
        {!formState.manualLat && (
          <div className="step-luogo__hint">
            Tocca la mappa per selezionare la posizione dell'intervento
          </div>
        )}
      </div>

      {/* Geocoding status */}
      {isGeocoding && (
        <div className="step-luogo__geocoding">
          <span className="spinner-small" /> Ricerca indirizzo...
        </div>
      )}
      
      {geocodeError && (
        <div className="step-luogo__error">{geocodeError}</div>
      )}

      {/* Campi indirizzo */}
      <div className="step-luogo__fields">
        <div className="form-group">
          <label htmlFor="comuneId">Comune *</label>
          <select
            id="comuneId"
            name="comuneId"
            value={formState.comuneId}
            onChange={(e) => updateField("comuneId", e.target.value)}
            required
            disabled={isLoadingReference}
          >
            <option value="">Seleziona comune...</option>
            {referenceData?.comuni?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group form-group--flex-2">
            <label htmlFor="via">Via/Piazza *</label>
            <input
              type="text"
              id="via"
              name="via"
              value={formState.via}
              onChange={(e) => updateField("via", e.target.value)}
              placeholder="Es: Via Roma"
              required
            />
          </div>

          <div className="form-group form-group--flex-1">
            <label htmlFor="numeroCivico">N° Civico</label>
            <input
              type="text"
              id="numeroCivico"
              name="numeroCivico"
              value={formState.numeroCivico}
              onChange={(e) => updateField("numeroCivico", e.target.value)}
              placeholder="Es: 42"
            />
          </div>
        </div>

        {/* Bottone cerca su mappa (geocoding diretto) */}
        <button
          type="button"
          className="btn btn--secondary btn--full-width"
          onClick={forwardGeocode}
          disabled={!formState.via || !formState.comuneId || isGeocoding}
        >
          {isGeocoding ? (
            <>
              <span className="spinner-small" /> Ricerca in corso...
            </>
          ) : (
            <>🔍 Cerca indirizzo sulla mappa</>
          )}
        </button>
      </div>
    </div>
  );
};

export default StepLuogo;
