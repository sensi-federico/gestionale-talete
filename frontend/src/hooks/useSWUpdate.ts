import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// Intervallo di polling configurabile (default 5 minuti)
const CHECK_INTERVAL = Number(import.meta.env.VITE_SW_CHECK_INTERVAL) || 300000;

export const useSWUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Funzione per controllare manualmente gli aggiornamenti
  const checkForUpdate = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log("[SW] Controllo aggiornamenti completato");
      }
    } catch (error) {
      console.error("[SW] Errore controllo aggiornamenti:", error);
    }
  };

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        console.log("[SW] Aggiornamento disponibile");
        setUpdateAvailable(true);
      },
      onRegistered(registration) {
        console.log("[SW] Service Worker registrato");
        registrationRef.current = registration || null;
      },
      onRegisterError(err: unknown) {
        console.error("[SW] Errore registrazione:", err);
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
  }, []);

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
