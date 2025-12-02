import { useEffect } from "react";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onRequestPermission: () => void;
  onSkip?: () => void;
}

const LocationPermissionModal = ({ 
  isOpen, 
  onRequestPermission,
  onSkip 
}: LocationPermissionModalProps) => {
  
  // Blocca scroll quando aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal">
        <div className="location-modal__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        
        <h2 className="location-modal__title">Consenti accesso alla posizione</h2>
        
        <p className="location-modal__description">
          Per registrare correttamente gli interventi, l'app ha bisogno di accedere alla tua posizione GPS.
        </p>
        
        <ul className="location-modal__benefits">
          <li>
            <span className="benefit-icon">📍</span>
            <span>Geolocalizzazione automatica dell'intervento</span>
          </li>
          <li>
            <span className="benefit-icon">✅</span>
            <span>Verifica della posizione al momento dell'invio</span>
          </li>
          <li>
            <span className="benefit-icon">🔒</span>
            <span>I dati sono usati solo per la registrazione</span>
          </li>
        </ul>

        <div className="location-modal__actions">
          <button 
            type="button"
            className="location-modal__btn location-modal__btn--primary"
            onClick={onRequestPermission}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Attiva posizione
          </button>
          
          {onSkip && (
            <button 
              type="button"
              className="location-modal__btn location-modal__btn--ghost"
              onClick={onSkip}
            >
              Continua senza GPS
            </button>
          )}
        </div>

        <p className="location-modal__hint">
          Dopo aver cliccato, il browser chiederà conferma.
          <br />
          Clicca <strong>"Consenti"</strong> per attivare il GPS.
        </p>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
