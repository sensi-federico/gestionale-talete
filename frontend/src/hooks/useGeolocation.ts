import { useEffect, useState, useCallback } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

type PermissionStatus = "prompt" | "granted" | "denied" | "unknown";

export const useGeolocation = (autoStart = false) => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("unknown");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [watcherId, setWatcherId] = useState<number | null>(null);

  // Controlla lo stato dei permessi
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      // Browser non supporta permissions API, proviamo direttamente
      setPermissionStatus("unknown");
      return "unknown";
    }
    
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionStatus(result.state as PermissionStatus);
      
      // Ascolta cambiamenti
      result.onchange = () => {
        setPermissionStatus(result.state as PermissionStatus);
      };
      
      return result.state;
    } catch {
      setPermissionStatus("unknown");
      return "unknown";
    }
  }, []);

  // Avvia il tracking GPS
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowPermissionModal(false);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setIsLoading(false);
        setPermissionStatus("granted");
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermissionStatus("denied");
          setError("Permesso negato. Attiva la localizzazione nelle impostazioni.");
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setError("Posizione non disponibile. Verifica il GPS.");
        } else if (geoError.code === geoError.TIMEOUT) {
          setError("Timeout nella richiesta GPS. Riprova.");
        } else {
          setError(geoError.message);
        }
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
    );

    setWatcherId(id);
  }, []);

  // Mostra il modal e poi richiedi i permessi
  const requestPermission = useCallback(() => {
    setShowPermissionModal(true);
  }, []);

  // Chiudi il modal e avvia il tracking (chiamato dal modal)
  const confirmPermission = useCallback(() => {
    startTracking();
  }, [startTracking]);

  // Salta il permesso GPS
  const skipPermission = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  // Controlla permessi all'avvio
  useEffect(() => {
    checkPermission().then((status) => {
      if (autoStart) {
        if (status === "granted") {
          // Già autorizzato, avvia subito
          startTracking();
        } else if (status === "prompt" || status === "unknown") {
          // Mostra il nostro modal
          setShowPermissionModal(true);
        } else if (status === "denied") {
          setError("Permesso GPS negato. Attivalo dalle impostazioni del browser.");
        }
      }
    });
  }, [autoStart, checkPermission, startTracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watcherId !== null) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, [watcherId]);

  return { 
    position, 
    error, 
    isLoading, 
    permissionStatus,
    showPermissionModal,
    requestPermission,
    confirmPermission,
    skipPermission,
    startTracking
  };
};
