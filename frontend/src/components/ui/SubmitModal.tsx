import { useEffect } from "react";

export type SubmitStatus = "idle" | "loading" | "success" | "offline" | "error";

export interface SubmitModalProps {
  status: SubmitStatus;
  message?: string;
  onClose: () => void;
  onNewRilevamento?: () => void;
  onViewRilevamenti?: () => void;
}

const SubmitModal = ({ status, message, onClose, onNewRilevamento, onViewRilevamenti }: SubmitModalProps) => {
  useEffect(() => {
    if (status !== "idle") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (status === "idle" || status === "loading") return;
      if (event.key === "Escape" || event.key === "Enter") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [status, onClose]);

  // Auto-close after success/offline/error after 5 seconds (solo se non ci sono callback)
  useEffect(() => {
    if (status === "success" || status === "offline") {
      // Non auto-chiudere se ci sono opzioni
      if (onNewRilevamento || onViewRilevamenti) return;
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (status === "error") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose, onNewRilevamento, onViewRilevamenti]);

  if (status === "idle") return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (status === "loading") return; // Non chiudere durante il caricamento
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="submit-modal-overlay" onClick={handleBackdropClick}>
      <div className={`submit-modal submit-modal--${status}`} role="dialog" aria-modal="true">
        {status === "loading" && (
          <>
            <div className="submit-modal__spinner" />
            <p className="submit-modal__text">Invio in corso...</p>
            <p className="submit-modal__subtext">Attendere prego</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="submit-modal__icon submit-modal__icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="submit-modal__text">Rilevamento inviato!</p>
            <p className="submit-modal__subtext">{message || "I dati sono stati salvati correttamente"}</p>
            {(onNewRilevamento || onViewRilevamenti) ? (
              <div className="submit-modal__actions">
                <p className="submit-modal__question">Cosa vuoi fare ora?</p>
                {onNewRilevamento && (
                  <button type="button" className="submit-modal__btn submit-modal__btn--primary" onClick={onNewRilevamento}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Nuovo rilevamento
                  </button>
                )}
                {onViewRilevamenti && (
                  <button type="button" className="submit-modal__btn submit-modal__btn--secondary" onClick={onViewRilevamenti}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                    </svg>
                    Vedi i miei rilevamenti
                  </button>
                )}
              </div>
            ) : (
              <button type="button" className="submit-modal__btn" onClick={onClose}>
                Chiudi
              </button>
            )}
          </>
        )}

        {status === "offline" && (
          <>
            <div className="submit-modal__icon submit-modal__icon--offline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="submit-modal__text">Salvato offline</p>
            <p className="submit-modal__subtext">{message || "Verrà sincronizzato automaticamente quando tornerai online"}</p>
            {(onNewRilevamento || onViewRilevamenti) ? (
              <div className="submit-modal__actions">
                <p className="submit-modal__question">Cosa vuoi fare ora?</p>
                {onNewRilevamento && (
                  <button type="button" className="submit-modal__btn submit-modal__btn--primary" onClick={onNewRilevamento}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Nuovo rilevamento
                  </button>
                )}
                {onViewRilevamenti && (
                  <button type="button" className="submit-modal__btn submit-modal__btn--secondary" onClick={onViewRilevamenti}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                    </svg>
                    Vedi i miei rilevamenti
                  </button>
                )}
              </div>
            ) : (
              <button type="button" className="submit-modal__btn submit-modal__btn--offline" onClick={onClose}>
                OK, capito
              </button>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="submit-modal__icon submit-modal__icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="submit-modal__text">Errore</p>
            <p className="submit-modal__subtext">{message || "Si è verificato un problema"}</p>
            <button type="button" className="submit-modal__btn submit-modal__btn--error" onClick={onClose}>
              Chiudi
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmitModal;
