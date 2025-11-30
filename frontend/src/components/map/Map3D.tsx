import { useEffect, useRef } from "react";
import maplibregl, {
  EventData,
  Map as MapInstance,
  MapMouseEvent,
  Marker as MapMarker
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json";

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
      style: MAP_STYLE_URL,
      center: value ? [value.lon, value.lat] : [12.4964, 41.9028],
      zoom: value ? 14 : 5,
      pitch: 60,
      bearing: 0
    });

    map.addControl(new maplibregl.NavigationControl());

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
