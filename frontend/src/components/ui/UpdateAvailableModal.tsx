import React from "react";

type Props = {
  open: boolean;
  isUpdating: boolean;
  isOffline: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

const UpdateAvailableModal: React.FC<Props> = ({ open, isUpdating, isOffline, onUpdate, onDismiss }) => {
  if (!open) return null;

  return (
    <div className="update-modal-backdrop" role="dialog" aria-modal="true">
      <div className="update-modal">
        <div className="update-modal__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        
        <h3 className="update-modal__title">Aggiornamento Disponibile</h3>
        
        {isOffline ? (
          <>
            <p className="update-modal__text">
              Una nuova versione dell'app è pronta per essere installata.
            </p>
            <div className="update-modal__warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
              <span>Connettiti a Internet per aggiornare</span>
            </div>
            <div className="update-modal__actions">
              <button 
                type="button" 
                className="update-modal__btn update-modal__btn--secondary" 
                onClick={onDismiss}
              >
                OK
              </button>
            </div>
          </>
        ) : isUpdating ? (
          <>
            <p className="update-modal__text">
              Installazione in corso...
            </p>
            <div className="update-modal__spinner">
              <div className="update-spinner"></div>
            </div>
            <p className="update-modal__info">
              L'app verrà ricaricata automaticamente
            </p>
          </>
        ) : (
          <>
            <p className="update-modal__text">
              Una nuova versione dell'app è disponibile con miglioramenti e correzioni.
            </p>
            <p className="update-modal__subtext">
              Ti consigliamo di aggiornare per avere la migliore esperienza.
            </p>
            <div className="update-modal__actions">
              <button 
                type="button" 
                className="update-modal__btn update-modal__btn--secondary" 
                onClick={onDismiss}
              >
                Più tardi
              </button>
              <button 
                type="button" 
                className="update-modal__btn update-modal__btn--primary" 
                onClick={onUpdate}
              >
                Aggiorna ora
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        .update-modal-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99999;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 1rem;
          animation: updateModalFadeIn 0.2s ease-out;
        }
        
        @keyframes updateModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .update-modal {
          background: white;
          padding: 2rem 1.5rem;
          border-radius: 20px;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          animation: updateModalSlideUp 0.3s ease-out;
        }
        
        @keyframes updateModalSlideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .update-modal__icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .update-modal__icon svg {
          width: 32px;
          height: 32px;
          color: #2563eb;
        }
        
        .update-modal__title {
          margin: 0 0 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
        }
        
        .update-modal__text {
          margin: 0 0 0.5rem;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #475569;
        }
        
        .update-modal__subtext {
          margin: 0;
          font-size: 0.85rem;
          color: #94a3b8;
        }
        
        .update-modal__warning {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: #fef3c7;
          border-radius: 10px;
          color: #92400e;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .update-modal__warning svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        
        .update-modal__info {
          margin: 0;
          font-size: 0.85rem;
          color: #94a3b8;
        }
        
        .update-modal__actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .update-modal__btn {
          flex: 1;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .update-modal__btn--primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        
        .update-modal__btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
        
        .update-modal__btn--primary:active {
          transform: translateY(0);
        }
        
        .update-modal__btn--secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .update-modal__btn--secondary:hover {
          background: #e2e8f0;
        }
        
        .update-modal__spinner {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
        }
        
        .update-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: updateSpin 0.8s linear infinite;
        }
        
        @keyframes updateSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UpdateAvailableModal;
