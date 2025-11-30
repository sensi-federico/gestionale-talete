import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { Marker as MapMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Stile OpenStreetMap standard
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
      attribution: '© OpenStreetMap'
    }
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }]
};

// Stile satellite ESRI
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: '© Esri'
    }
  },
  layers: [{ id: "satellite-tiles", type: "raster", source: "satellite", minzoom: 0, maxzoom: 19 }]
};

interface MapPickerProps {
  value?: { lat: number; lon: number } | null;
  onChange?: (coords: { lat: number; lon: number }) => void;
  height?: string;
}

const MapPicker = ({ value, onChange, height = "280px" }: MapPickerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const [mapType, setMapType] = useState<"street" | "satellite">("satellite");
  const [isLocating, setIsLocating] = useState(false);

  // Funzione per impostare/aggiornare il marker
  const setMarker = useCallback((lat: number, lon: number) => {
    if (!mapRef.current) return;
    
    if (!markerRef.current) {
      // Crea marker personalizzato
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

  // Geolocalizzazione manuale
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocalizzazione non supportata");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
        onChange?.(coords);
        setMarker(coords.lat, coords.lon);
        mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 17 });
        setIsLocating(false);
      },
      (error) => {
        console.error("Errore geolocalizzazione:", error);
        setIsLocating(false);
        alert("Impossibile ottenere la posizione. Assicurati di aver concesso i permessi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, setMarker]);

  // Toggle mappa
  const toggleMapType = useCallback(() => {
    const newType = mapType === "street" ? "satellite" : "street";
    setMapType(newType);
    mapRef.current?.setStyle(newType === "satellite" ? SATELLITE_STYLE : OSM_STYLE);
  }, [mapType]);

  // Inizializza mappa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: value ? [value.lon, value.lat] : [12.4964, 41.9028],
      zoom: value ? 16 : 6
    } as any);

    // Click sulla mappa per selezionare posizione
    map.on("click", (e) => {
      const coords = { lat: e.lngLat.lat, lon: e.lngLat.lng };
      onChange?.(coords);
      setMarker(coords.lat, coords.lon);
    });

    // Ripristina marker dopo cambio stile
    map.on("style.load", () => {
      if (value) {
        setMarker(value.lat, value.lon);
      }
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Aggiorna quando cambia value dall'esterno
  useEffect(() => {
    if (value && mapRef.current) {
      setMarker(value.lat, value.lon);
      mapRef.current.flyTo({ center: [value.lon, value.lat], zoom: 17, essential: true });
    }
  }, [value, setMarker]);

  return (
    <div className="map-picker">
      <div className="map-picker__container" ref={containerRef} style={{ height }} />
      
      <div className="map-picker__controls">
        <button
          type="button"
          className="map-picker__btn map-picker__btn--locate"
          onClick={handleGeolocate}
          disabled={isLocating}
          title="Usa la mia posizione"
        >
          {isLocating ? (
            <span className="map-picker__spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
            </svg>
          )}
        </button>
        
        <button
          type="button"
          className="map-picker__btn map-picker__btn--toggle"
          onClick={toggleMapType}
          title={mapType === "street" ? "Vista satellite" : "Vista mappa"}
        >
          {mapType === "street" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
          )}
        </button>
      </div>

      {value && (
        <div className="map-picker__coords">
          📍 {value.lat.toFixed(6)}, {value.lon.toFixed(6)}
        </div>
      )}

      {!value && (
        <div className="map-picker__hint">
          Tocca la mappa o usa il GPS per selezionare la posizione
        </div>
      )}
    </div>
  );
};

export default MapPicker;
