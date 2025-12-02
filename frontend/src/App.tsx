import { useCallback, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OfflineRilevamento } from "@shared/types";
import LoginForm from "./components/auth/LoginForm";
import TecnicoDashboard from "./components/operaio/TecnicoDashboard";
import NuovoRilevamentoPage from "./components/operaio/NuovoRilevamentoPage";
import MieiRilevamentiPage from "./components/operaio/MieiRilevamentiPage";
import ImpresaDashboard from "./components/impresa/ImpresaDashboard";
import NuovoInterventoImpresaPage from "./components/impresa/NuovoInterventoImpresaPage";
import ProfilePage from "./components/profile/ProfilePage";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminComuniPage from "./components/admin/AdminComuniPage";
import AdminImpresePage from "./components/admin/AdminImpresePage";
import AdminRilevazioniPage from "./components/admin/AdminRilevazioniPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/authStore";
import { useOfflineQueue } from "./hooks/useOfflineQueue";
import { api } from "./services/api";

const HomeRoute = () => {
  const role = useAuthStore((state) => state.user?.role);
  if (role === "admin") {
    return <Navigate to="/admin/panoramica" replace />;
  }
  if (role === "impresa") {
    return <ImpresaDashboard />;
  }
  // Tecnico: mostra dashboard
  return <TecnicoDashboard />;
};

const App = () => {
  const { user, tokens, restoreSession } = useAuthStore();
  const { syncQueue } = useOfflineQueue();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const processSync = useCallback(
    async (record: OfflineRilevamento) => {
      if (!tokens) {
        throw new Error("Token non disponibile");
      }
      const formData = new FormData();
      formData.append("comuneId", record.comuneId);
      formData.append("via", record.via);
      formData.append("numeroCivico", record.numeroCivico);
      formData.append("tipoLavorazioneId", record.tipoLavorazioneId);
      formData.append("impresaId", record.impresaId);
      formData.append("numeroOperai", String(record.numeroOperai));
      formData.append("gpsLat", String(record.gpsLat));
      formData.append("gpsLon", String(record.gpsLon));
      formData.append("manualLat", record.manualLat ? String(record.manualLat) : "");
      formData.append("manualLon", record.manualLon ? String(record.manualLon) : "");
      formData.append("rilevamentoDate", record.rilevamentoDate);
      formData.append("rilevamentoTime", record.rilevamentoTime);
      if (record.notes) {
        formData.append("notes", record.notes);
      }
      // Nuovi campi
      if (record.materialeTubo) {
        formData.append("materialeTubo", record.materialeTubo);
      }
      if (record.diametro) {
        formData.append("diametro", record.diametro);
      }
      if (record.altriInterventi) {
        formData.append("altriInterventi", record.altriInterventi);
      }
      if (record.submitTimestamp) {
        formData.append("submitTimestamp", record.submitTimestamp);
      }
      if (record.submitGpsLat) {
        formData.append("submitGpsLat", String(record.submitGpsLat));
      }
      if (record.submitGpsLon) {
        formData.append("submitGpsLon", String(record.submitGpsLon));
      }
      if (record.fileBlob) {
        formData.append("foto", record.fileBlob, `${record.localId}.webp`);
      }
      await api.createRilevamento(formData, tokens.accessToken);
    },
    [tokens]
  );

  useEffect(() => {
    if (!tokens) {
      return;
    }

    const attemptSync = () => {
      if (navigator.onLine) {
        syncQueue(processSync).catch((error: unknown) =>
          console.error("Sync fallita", error)
        );
      }
    };

    attemptSync();

    window.addEventListener("online", attemptSync);
    return () => {
      window.removeEventListener("online", attemptSync);
    };
  }, [tokens, syncQueue, processSync]);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      {/* Pagine CON header/footer */}
      <Route element={<ProtectedRoute allowedRoles={["operaio", "admin", "impresa"]} />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomeRoute />} />
          {/* Profilo - accessibile da tutti */}
          <Route path="profilo" element={<ProfilePage />} />
          {/* Rotte tecnico */}
          <Route element={<ProtectedRoute allowedRoles={["operaio"]} />}>
            <Route path="nuovo" element={<NuovoRilevamentoPage />} />
          </Route>
          {/* Rotte impresa */}
          <Route element={<ProtectedRoute allowedRoles={["impresa"]} />}>
            <Route path="nuovo-impresa" element={<NuovoInterventoImpresaPage />} />
          </Route>
          {/* Miei rilevamenti - accessibile da operaio e impresa */}
          <Route element={<ProtectedRoute allowedRoles={["operaio", "impresa"]} />}>
            <Route path="miei-rilevamenti" element={<MieiRilevamentiPage />} />
          </Route>
          {/* Rotte admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin">
              <Route index element={<Navigate to="panoramica" replace />} />
              <Route path="panoramica" element={<AdminDashboard />} />
              <Route path="rilevamenti" element={<AdminRilevazioniPage />} />
              <Route path="utenti" element={<AdminUsersPage />} />
              <Route path="comuni" element={<AdminComuniPage />} />
              <Route path="imprese" element={<AdminImpresePage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
};

export default App;
