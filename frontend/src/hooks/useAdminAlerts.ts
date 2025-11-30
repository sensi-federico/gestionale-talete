import { useCallback, useState } from "react";

export type AdminAlertType = "success" | "error" | "info";

export interface AdminAlert {
  id: string;
  type: AdminAlertType;
  title: string;
  description?: string;
  isoTimestamp: string;
}

interface PushAlertPayload {
  type: AdminAlertType;
  title: string;
  description?: string;
}

export const useAdminAlerts = () => {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);

  const pushAlert = useCallback((entry: PushAlertPayload) => {
    setAlerts((current) => {
      const next: AdminAlert = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: entry.type,
        title: entry.title,
        description: entry.description,
        isoTimestamp: new Date().toISOString()
      };
      return [next, ...current].slice(0, 50);
    });
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return {
    alerts,
    latestAlert: alerts[0],
    pushAlert,
    clearAlerts
  };
};
