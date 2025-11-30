import { useEffect, useRef } from "react";
import maplibregl, {
  EventData,
  Map as MapInstance,
  MapMouseEvent,
  Marker as MapMarker
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GeolocateControl = (maplibregl as any).GeolocateControl;

// Stile OpenStreetMap con tiles reali
const MAP_STYLE: maplibregl.StyleSpecification = {
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

interface Map3DProps {
  value?: { lat: number; lon: number } | null;
  onChange?: (coords: { lat: number; lon: number }) => void;
}

const Map3D = ({ value, onChange }: Map3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MapMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
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

  return <div ref={containerRef} style={{ width: "100%", height: "300px", borderRadius: "12px" }} />;
};

export default Map3D;
