import { useEffect, useRef, useState } from "react";
import maplibregl, {
  EventData,
  Map as MapInstance,
  MapMouseEvent,
  Marker as MapMarker
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GeolocateControl = (maplibregl as any).GeolocateControl;

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Stile satellite ESRI (gratuito)
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }
  },
  layers: [
    {
      id: "satellite-tiles",
      type: "raster",
      source: "satellite",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

type MapType = "street" | "satellite";

interface Map3DProps {
  value?: { lat: number; lon: number } | null;
  onChange?: (coords: { lat: number; lon: number }) => void;
}

const Map3D = ({ value, onChange }: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const [mapType, setMapType] = useState<MapType>("street");

  // Cambia tipo di mappa
  const toggleMapType = () => {
    const newType = mapType === "street" ? "satellite" : "street";
    setMapType(newType);
    if (mapRef.current) {
      mapRef.current.setStyle(newType === "satellite" ? SATELLITE_STYLE : OSM_STYLE);
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: value ? [value.lon, value.lat] : [12.4964, 41.9028],
      zoom: value ? 14 : 12,
      pitch: 0,
      bearing: 0
    });

    map.addControl(new maplibregl.NavigationControl());
    
    // Aggiungo controllo geolocalizzazione per trovare la posizione dell'operaio
    const geolocate = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: false,
      showUserLocation: true
    });
    map.addControl(geolocate);
    
    // Quando l'utente usa la geolocalizzazione, aggiorna le coordinate
    geolocate.on("geolocate", (e: GeolocationPosition) => {
      const coords = { lat: e.coords.latitude, lon: e.coords.longitude };
      if (onChange) {
        onChange(coords);
      }
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#1c7ed6" });
      }
      markerRef.current.setLngLat([coords.lon, coords.lat]).addTo(map);
    });

    map.on("click", (event: MapMouseEvent & EventData) => {
      const coords = { lat: event.lngLat.lat, lon: event.lngLat.lng };
      if (onChange) {
        onChange(coords);
      }
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#1c7ed6" });
      }
      markerRef.current.setLngLat([coords.lon, coords.lat]).addTo(map);
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [value, onChange]);

  useEffect(() => {
    if (value && mapRef.current) {
      mapRef.current.flyTo({ center: [value.lon, value.lat], zoom: 16, essential: true });
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#1c7ed6" });
      }
      markerRef.current.setLngLat([value.lon, value.lat]).addTo(mapRef.current);
    }
  }, [value]);

  // Ripristina marker dopo cambio stile
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const handleStyleLoad = () => {
      if (value && markerRef.current) {
        markerRef.current.setLngLat([value.lon, value.lat]).addTo(map);
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [value]);

  return (
    <div className="map-container-wrapper">
      <div ref={containerRef} style={{ width: "100%", height: "300px", borderRadius: "12px" }} />
      <button 
        type="button" 
        className="map-type-toggle"
        onClick={toggleMapType}
        title={mapType === "street" ? "Passa a vista satellite" : "Passa a vista stradale"}
      >
        {mapType === "street" ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
            Satellite
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
            Mappa
          </>
        )}
      </button>
    </div>
  );
};

export default Map3D;
