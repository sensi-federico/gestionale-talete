import React, { useEffect, useState } from "react";

type Props = {
  open: boolean;
  isUpdating: boolean;
  isOffline: boolean;
  onUpdate: () => void;
};

const UpdateAvailableModal: React.FC<Props> = ({ open, isUpdating, isOffline, onUpdate }) => {
  const [countdown, setCountdown] = useState(60);

  // Countdown automatico di 60 secondi
  useEffect(() => {
    if (!open || isUpdating) return;

    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Aggiornamento automatico allo scadere del countdown
          if (!isOffline) {
            onUpdate();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isUpdating, isOffline, onUpdate]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>⚠️ Aggiornamento Obbligatorio</h3>
        
        {isOffline ? (
          <>
            <p>È disponibile una nuova versione dell'applicazione.</p>
            <p className="modal__warning">⚠️ Connettiti a Internet per procedere con l'aggiornamento.</p>
          </>
        ) : isUpdating ? (
          <>
            <p>Aggiornamento in corso...</p>
            <div className="modal__spinner">
              <div className="spinner"></div>
            </div>
            <p className="modal__info">L'applicazione verrà ricaricata automaticamente.</p>
          </>
        ) : (
          <>
            <p>È disponibile una nuova versione dell'applicazione che verrà installata.</p>
            <p className="modal__countdown">
              Aggiornamento automatico tra <strong>{countdown}</strong> secondi
            </p>
            <div className="modal__actions">
              <button 
                type="button" 
                className="button button--primary" 
                onClick={onUpdate}
              >
                Aggiorna Ora
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:9999;backdrop-filter:blur(2px)}
        .modal{background:white;padding:1.5rem;border-radius:12px;max-width:420px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.3);text-align:center}
        .modal h3{margin:0 0 1rem;color:#1c7ed6;font-size:1.25rem}
        .modal p{margin:0.5rem 0;line-height:1.5}
        .modal__countdown{font-size:1.1rem;color:#495057;margin:1rem 0}
        .modal__countdown strong{color:#1c7ed6;font-size:1.3rem}
        .modal__warning{color:#fa5252;font-weight:600;background:#fff5f5;padding:0.75rem;border-radius:6px;border:1px solid #ffc9c9}
        .modal__info{color:#868e96;font-size:0.9rem;margin-top:1rem}
        .modal__actions{display:flex;gap:0.5rem;justify-content:center;margin-top:1.5rem}
        .modal__spinner{display:flex;justify-content:center;margin:1.5rem 0}
        .spinner{width:40px;height:40px;border:4px solid #e9ecef;border-top-color:#1c7ed6;border-radius:50%;animation:spin 0.8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .button{padding:0.65rem 1.5rem;border-radius:8px;border:none;background:#1c7ed6;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;transition:background 0.2s}
        .button:hover{background:#1864ab}
        .button:disabled{background:#adb5bd;cursor:not-allowed}
        .button--primary{background:#1c7ed6}
      `}</style>
    </div>
  );
};

export default UpdateAvailableModal;
