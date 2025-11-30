import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { offlineDB } from "../utils/offlineDB";

export const useLogout = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useCallback(async () => {
    await offlineDB.pendingRilevamenti.clear();
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);
};
