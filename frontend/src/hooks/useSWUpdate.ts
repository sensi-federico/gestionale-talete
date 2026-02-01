import { useEffect, useRef, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

// Intervallo controllo aggiornamenti (5 minuti)
const CHECK_INTERVAL = 5 * 60 * 1000;
// Intervallo per rimostrare il modal dopo "più tardi" (5 minuti)
const REMIND_LATER_INTERVAL = 5 * 60 * 1000;

export const useSWUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const remindLaterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Funzione per controllare manualmente gli aggiornamenti
  const checkForUpdate = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log("[SW] Controllo aggiornamenti...");
        await registration.update();
      }
    } catch (error) {
      console.error("[SW] Errore controllo aggiornamenti:", error);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log("[SW] Service Worker non supportato");
      return;
    }

    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("[SW] 🔄 Aggiornamento disponibile!");
        setUpdateAvailable(true);
        setShowModal(true);
      },
      onOfflineReady() {
        console.log("[SW] ✅ App pronta per uso offline");
      },
      onRegistered(registration) {
        console.log("[SW] ✅ Service Worker registrato");
        
        // Polling periodico per controllare aggiornamenti
        if (registration) {
          setInterval(() => {
            console.log("[SW] Controllo periodico");
            registration.update();
          }, CHECK_INTERVAL);
        }
      },
      onRegisterError(err: unknown) {
        console.error("[SW] ❌ Errore registrazione:", err);
      },
    });
    updateRef.current = update;

    // Controlla quando la pagina torna visibile
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (remindLaterTimeoutRef.current) {
        clearTimeout(remindLaterTimeoutRef.current);
      }
    };
  }, [checkForUpdate]);

  // Applica l'aggiornamento
  const applyUpdate = useCallback(async () => {
    if (updateRef.current) {
      await updateRef.current(true);
    }
  }, []);

  // Rimanda a più tardi - rimostrerà il modal dopo 5 minuti
  const remindLater = useCallback(() => {
    setShowModal(false);
    console.log("[SW] Aggiornamento rimandato, verrà richiesto tra 5 minuti");
    
    // Cancella eventuali timer precedenti
    if (remindLaterTimeoutRef.current) {
      clearTimeout(remindLaterTimeoutRef.current);
    }
    
    // Rimostra il modal dopo 5 minuti
    remindLaterTimeoutRef.current = setTimeout(() => {
      if (updateAvailable) {
        console.log("[SW] Richiesta aggiornamento (reminder)");
        setShowModal(true);
      }
    }, REMIND_LATER_INTERVAL);
  }, [updateAvailable]);

  return { 
    updateAvailable, 
    showModal,
    applyUpdate, 
    remindLater,
    checkForUpdate
  } as const;
};

export default useSWUpdate;
