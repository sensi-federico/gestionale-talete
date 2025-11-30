import { useCallback, useEffect, useState } from "react";
import { offlineDB } from "../utils/offlineDB";
import { OfflineRilevamento } from "@shared/types";

export type SyncHandler = (payload: OfflineRilevamento) => Promise<void>;

export const useOfflineQueue = () => {
  const [pending, setPending] = useState<OfflineRilevamento[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    const records = await offlineDB.pendingRilevamenti.toArray();
    setPending(records);
  }, []);

  useEffect(() => {
    refreshPending();
    const handleHook = () => {
      void refreshPending();
    };

    offlineDB.pendingRilevamenti.hook("creating", handleHook);
    offlineDB.pendingRilevamenti.hook("updating", handleHook);
    offlineDB.pendingRilevamenti.hook("deleting", handleHook);

    return () => {
      offlineDB.pendingRilevamenti.hook("creating").unsubscribe(handleHook);
      offlineDB.pendingRilevamenti.hook("updating").unsubscribe(handleHook);
      offlineDB.pendingRilevamenti.hook("deleting").unsubscribe(handleHook);
    };
  }, [refreshPending]);

  const addToQueue = useCallback(async (payload: OfflineRilevamento) => {
    await offlineDB.pendingRilevamenti.put(payload);
    await refreshPending();
  }, [refreshPending]);

  const clearFromQueue = useCallback(async (localId: string) => {
    await offlineDB.pendingRilevamenti.delete(localId);
    await refreshPending();
  }, [refreshPending]);

  const syncQueue = useCallback(
    async (handler: SyncHandler) => {
      if (isSyncing) {
        return;
      }

      setIsSyncing(true);
      try {
        const records = await offlineDB.pendingRilevamenti.toArray();
        for (const record of records) {
          if (!navigator.onLine) {
            break;
          }

          await handler(record);
          await offlineDB.pendingRilevamenti.delete(record.localId);
        }
      } finally {
        setIsSyncing(false);
        await refreshPending();
      }
    },
    [isSyncing, refreshPending]
  );

  return { pending, isSyncing, addToQueue, clearFromQueue, syncQueue };
};
