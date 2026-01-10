import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export const useSWUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onRegistered() {
        // registered
      },
      onRegisterError(err: unknown) {
        console.error("SW register error", err);
      },
    });
    updateRef.current = update;
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
      console.error("Error applying update", e);
      window.location.reload();
    }
  };

  return { updateAvailable, setUpdateAvailable, applyUpdate } as const;
};

export default useSWUpdate;
