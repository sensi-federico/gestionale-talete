import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OfflineRilevamento } from "@shared/types";
import LoginForm from "./components/auth/LoginForm";
import TecnicoDashboard from "./components/operaio/TecnicoDashboard";
import TecnicoImpresePage from "./components/operaio/TecnicoImpresePage";
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
import AdminMezziPage from "./components/admin/AdminMezziPage";
import AdminAttrezzaturePage from "./components/admin/AdminAttrezzaturePage";
import AdminTipiLavorazionePage from "./components/admin/AdminTipiLavorazionePage";
import AdminMaterialiTuboPage from "./components/admin/AdminMaterialiTuboPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { useAuthStore } from "./store/authStore";
import { useOfflineQueue } from "./hooks/useOfflineQueue";
import { api } from "./services/api";
import useSWUpdate from "./hooks/useSWUpdate";
import UpdateAvailableModal from "./components/ui/UpdateAvailableModal";
import { offlineDB } from "./utils/offlineDB";

const HomeRoute = () => {
  const role = useAuthStore((state) => state.user?.role);
  if (role === "admin" || role === "responsabile") {
    return <Navigate to="/admin/panoramica" replace />;
  }
  if (role === "impresa") {
    return <ImpresaDashboard />;
  }
  // Tecnico: mostra dashboard
  return <TecnicoDashboard />;
};

const App = () => {
  const { user, tokens, restoreSession, setSession } = useAuthStore();
  const { syncQueue } = useOfflineQueue();
  const { showModal, applyUpdate, remindLater, checkForUpdate } = useSWUpdate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitora lo stato della connessione
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const refreshSession = useCallback(async () => {
    if (!tokens?.refreshToken) {
      return;
    }

    try {
      const refreshed = await api.refresh(tokens.refreshToken);
      const nextUser = {
        id: refreshed.user.id || user?.id || "",
        email: refreshed.user.email || user?.email || "",
        fullName: refreshed.user.fullName || user?.fullName || "",
        role: refreshed.user.role || user?.role || "operaio",
        impresaId: refreshed.user.impresaId ?? user?.impresaId
      };
      setSession(nextUser, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken
      });
    } catch (err) {
      console.warn("[Refresh] Token refresh fallito", err);
    }
  }, [tokens?.refreshToken, setSession, user]);

  // Gestisce l'applicazione dell'aggiornamento con controllo dati offline
  const handleUpdate = useCallback(async () => {
    try {
      setIsUpdating(true);

      await refreshSession();

      // Verifica se ci sono dati in coda offline
      const pendingCount = await offlineDB.pendingRilevamenti.count();
      
      if (pendingCount > 0 && navigator.onLine) {
        console.log(`[Update] Tentativo sync di ${pendingCount} rilevamenti in coda prima dell'aggiornamento`);
        
        // Tenta una sincronizzazione veloce prima dell'update
        try {
          await syncQueue(processSync);
          console.log("[Update] Sincronizzazione completata");
        } catch (error) {
          console.warn("[Update] Sincronizzazione fallita, procedo comunque:", error);
          // Procedi con l'update anche se la sync fallisce
        }
      }

      if (navigator.onLine) {
        await checkForUpdate();
      }

      // Applica l'aggiornamento e forza il reload
      await applyUpdate();
      window.location.reload();
    } catch (error) {
      console.error("[Update] Errore durante l'aggiornamento:", error);
      // In caso di errore, forza comunque il reload
      window.location.reload();
    } finally {
      setIsUpdating(false);
    }
  }, [applyUpdate, checkForUpdate, refreshSession, syncQueue]);

  const processSync = useCallback(
    async (record: OfflineRilevamento) => {
      if (!tokens) {
        throw new Error("Token non disponibile");
      }
      const formData = new FormData();
      formData.append("comuneId", record.comuneId);
      formData.append("via", record.via);
      formData.append("numeroCivico", record.numeroCivico ?? "");
      formData.append("tipoLavorazioneId", record.tipoLavorazioneId);
      if (record.impresaId) {
        formData.append("impresaId", record.impresaId);
      }
      formData.append("numeroOperai", String(record.numeroOperai));
      formData.append("gpsLat", String(record.gpsLat));
      formData.append("gpsLon", String(record.gpsLon));
      formData.append("manualLat", record.manualLat ? String(record.manualLat) : "");
      formData.append("manualLon", record.manualLon ? String(record.manualLon) : "");
      if (record.startTimestamp) {
        formData.append("startTimestamp", record.startTimestamp);
      }
      if (record.startGpsLat !== undefined && record.startGpsLat !== null) {
        formData.append("startGpsLat", String(record.startGpsLat));
      }
      if (record.startGpsLon !== undefined && record.startGpsLon !== null) {
        formData.append("startGpsLon", String(record.startGpsLon));
      }
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
      // Supporto legacy per singola foto
      if (record.fileBlob) {
        formData.append("foto", record.fileBlob, `${record.localId}.webp`);
      }
      // 4 tipi di foto - offline sync completo
      if (record.fotoPanoramicaBlob) {
        formData.append("fotoPanoramica", record.fotoPanoramicaBlob, `${record.localId}_panoramica.webp`);
      }
      if (record.fotoInizioLavoriBlob) {
        formData.append("fotoInizioLavori", record.fotoInizioLavoriBlob, `${record.localId}_inizio.webp`);
      }
      if (record.fotoInterventoBlob) {
        formData.append("fotoIntervento", record.fotoInterventoBlob, `${record.localId}_intervento.webp`);
      }
      if (record.fotoFineLavoriBlob) {
        formData.append("fotoFineLavori", record.fotoFineLavoriBlob, `${record.localId}_fine.webp`);
      }
      // Dati strutturati
      if (record.mezziUtilizzo?.length) {
        formData.append("mezziUtilizzo", JSON.stringify(record.mezziUtilizzo));
      }
      if (record.attrezzatureUtilizzo?.length) {
        formData.append("attrezzatureUtilizzo", JSON.stringify(record.attrezzatureUtilizzo));
      }
      if (record.operai?.length) {
        formData.append("operai", JSON.stringify(record.operai));
      }
      // Dati tubo
      if (record.tuboEsistente && Object.values(record.tuboEsistente).some(v => v)) {
        formData.append("tuboEsistente", JSON.stringify(record.tuboEsistente));
      }
      if (record.tuboNuovo && Object.values(record.tuboNuovo).some(v => v)) {
        formData.append("tuboNuovo", JSON.stringify(record.tuboNuovo));
      }
      if (record.oraFine) {
        formData.append("oraFine", record.oraFine);
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
    <>
      <UpdateAvailableModal 
        open={showModal} 
        isUpdating={isUpdating}
        isOffline={isOffline}
        onUpdate={handleUpdate}
        onDismiss={remindLater}
      />
      <Routes>
      <Route path="/login" element={<LoginForm />} />
      {/* Pagine CON header/footer */}
      <Route element={<ProtectedRoute allowedRoles={["operaio", "admin", "impresa", "responsabile"]} />}>
        <Route path="/" element={<AppLayout onRefresh={handleUpdate} isRefreshing={isUpdating} />}>
          <Route index element={<HomeRoute />} />
          {/* Profilo - accessibile da tutti */}
          <Route path="profilo" element={<ProfilePage />} />
          {/* Rotte tecnico */}
          <Route element={<ProtectedRoute allowedRoles={["operaio"]} />}>
            <Route path="nuovo" element={<NuovoRilevamentoPage />} />
            <Route path="imprese" element={<TecnicoImpresePage />} />
          </Route>
          {/* Rotte impresa */}
          <Route element={<ProtectedRoute allowedRoles={["impresa"]} />}>
            <Route path="nuovo-impresa" element={<NuovoInterventoImpresaPage />} />
          </Route>
          {/* Miei rilevamenti - accessibile da operaio e impresa */}
          <Route element={<ProtectedRoute allowedRoles={["operaio", "impresa"]} />}>
            <Route path="miei-rilevamenti" element={<MieiRilevamentiPage />} />
          </Route>
          {/* Rotte admin - responsabili hanno pieno accesso come admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "responsabile"]} />}>
            <Route path="admin">
              <Route index element={<Navigate to="panoramica" replace />} />
              <Route path="panoramica" element={<AdminDashboard />} />
              <Route path="rilevamenti" element={<AdminRilevazioniPage />} />
              <Route path="utenti" element={<AdminUsersPage />} />
              <Route path="comuni" element={<AdminComuniPage />} />
              <Route path="imprese" element={<AdminImpresePage />} />
              <Route path="mezzi" element={<AdminMezziPage />} />
              <Route path="attrezzature" element={<AdminAttrezzaturePage />} />
              <Route path="tipi-lavorazione" element={<AdminTipiLavorazionePage />} />
              <Route path="materiali-tubo" element={<AdminMaterialiTuboPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
};

export default App;
