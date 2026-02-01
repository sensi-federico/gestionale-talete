import { useEffect, useRef, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

// Intervallo di polling configurabile (default 2 minuti per test, 5 minuti in prod)
const CHECK_INTERVAL = Number(import.meta.env.VITE_SW_CHECK_INTERVAL) || 120000;

export const useSWUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const hasCheckedRef = useRef(false);

  // Funzione per controllare manualmente gli aggiornamenti
  const checkForUpdate = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log("[SW] Controllo aggiornamenti...");
        await registration.update();
        
        // Check if there's a waiting worker
        if (registration.waiting) {
          console.log("[SW] Worker in attesa trovato - aggiornamento disponibile!");
          setUpdateAvailable(true);
        }
      }
    } catch (error) {
      console.error("[SW] Errore controllo aggiornamenti:", error);
    }
  }, []);

  useEffect(() => {
    // Skip if no service worker support
    if (!('serviceWorker' in navigator)) {
      console.log("[SW] Service Worker non supportato");
      return;
    }

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("[SW] 🔄 onNeedRefresh chiamato - Aggiornamento disponibile!");
        setUpdateAvailable(true);
      },
      onRegistered(registration) {
        console.log("[SW] ✅ Service Worker registrato", registration);
        registrationRef.current = registration || null;
        
        // Check immediately if there's already a waiting worker
        if (registration?.waiting) {
          console.log("[SW] Worker già in attesa all'avvio");
          setUpdateAvailable(true);
        }
        
        // Listen for new workers
        if (registration) {
          registration.addEventListener('updatefound', () => {
            console.log("[SW] 🆕 Nuovo worker trovato");
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log("[SW] Stato worker:", newWorker.state);
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log("[SW] Nuovo contenuto disponibile!");
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      },
      onRegisterError(err: unknown) {
        console.error("[SW] ❌ Errore registrazione:", err);
      },
    });
    updateRef.current = update;

    // Polling periodico per controllare aggiornamenti
    const intervalId = setInterval(() => {
      console.log("[SW] Controllo periodico aggiornamenti");
      checkForUpdate();
    }, CHECK_INTERVAL);

    // Controlla aggiornamenti quando la pagina torna visibile
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[SW] Pagina tornata visibile, controllo aggiornamenti");
        checkForUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const applyUpdate = async () => {
    try {
      if (updateRef.current) {
        // calling with true asks the helper to skipWaiting and reload
        await updateRef.current(true);
      } else {
        // fallback: try to message waiting worker
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }

      // wait for the new controller to take over
      await new Promise<void>((resolve) => {
        const onControllerChange = () => {
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      });

      // clear caches to avoid stale assets
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        console.warn("Error clearing caches", e);
      }

      window.location.reload();
    } catch (e) {
      console.error("[SW] Errore applicazione aggiornamento:", e);
      // Forza reload anche in caso di errore
      window.location.reload();
    }
  };

  return { updateAvailable, applyUpdate, checkForUpdate } as const;
};

export default useSWUpdate;
