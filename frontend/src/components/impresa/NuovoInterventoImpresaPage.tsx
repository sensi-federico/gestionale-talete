// NuovoInterventoImpresaPage.tsx
// Pagina per imprese per inserire un nuovo intervento

import { useCallback, useState } from "react";
import InterventoWizard from "../wizard/InterventoWizard";

interface StartMetadata {
  startTimestamp: string;
  startGpsLat?: number | null;
  startGpsLon?: number | null;
}

const NuovoInterventoImpresaPage = () => {
  const [startData, setStartData] = useState<StartMetadata | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(true);

  const capturePosition = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }, []);

  const handleStart = useCallback(async () => {
    setIsStarting(true);
    setStartError(null);
    const timestamp = new Date().toISOString();

    const pos = await capturePosition();
    const gpsLat = pos?.coords.latitude ?? null;
    const gpsLon = pos?.coords.longitude ?? null;

    if (!pos) {
      setStartError("Posizione non disponibile: proseguirai comunque.");
    }

    setStartData({ startTimestamp: timestamp, startGpsLat: gpsLat, startGpsLon: gpsLon });
    setShowStartModal(false);
    setIsStarting(false);
  }, [capturePosition]);

  const handleReset = useCallback(() => {
    setStartData(null);
    setStartError(null);
    setShowStartModal(true);
  }, []);

  return (
    <div className="standalone-page">
      {startData && (
        <>
          <div className="impresa-start__toolbar">
            <div className="impresa-start__meta">
              <span>Avvio: {new Date(startData.startTimestamp).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</span>
              {startData.startGpsLat !== null && startData.startGpsLat !== undefined &&
                startData.startGpsLon !== null && startData.startGpsLon !== undefined && (
                <span>• GPS: {startData.startGpsLat.toFixed(5)}, {startData.startGpsLon.toFixed(5)}</span>
              )}
            </div>
            <button type="button" className="button button--ghost" onClick={handleReset}>
              ↺ Reimposta inizio
            </button>
          </div>

          <InterventoWizard 
            isImpresa={true} 
            startMetadata={startData}
            onAfterSubmit={handleReset}
          />
        </>
      )}

      {showStartModal && (
        <div className="impresa-start-modal__backdrop">
          <div className="impresa-start-modal" role="dialog" aria-modal="true" aria-label="Inizio inserimento intervento">
            <div className="impresa-start-modal__content">
              <h2>Inizio intervento</h2>
              <p className="impresa-start-modal__text">Premi per iniziare l'inserimento dell'intervento</p>
              {startError && <div className="impresa-start__alert">{startError}</div>}
              <button
                type="button"
                className="button button--primary impresa-start__cta"
                onClick={handleStart}
                disabled={isStarting}
              >
                {isStarting ? "Attendi..." : "INIZIA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuovoInterventoImpresaPage;
