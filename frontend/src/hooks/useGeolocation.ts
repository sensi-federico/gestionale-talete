import { useEffect, useState } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata");
      setIsLoading(false);
      return;
    }

    const watcherId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setIsLoading(false);
      },
      (geoError) => {
        setError(geoError.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcherId);
    };
  }, []);

  return { position, error, isLoading };
};
