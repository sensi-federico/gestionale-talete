import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

const UpdateAvailableModal: React.FC<Props> = ({ open, onClose, onUpdate }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>Nuova versione disponibile</h3>
        <p>È disponibile una nuova versione dell'app. Per applicarla è necessario aggiornare e ricaricare l'app.</p>
        <div className="modal__actions">
          <button type="button" className="button" onClick={onClose}>Ignora</button>
          <button type="button" className="button button--primary" onClick={onUpdate}>Aggiorna</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:1000}
        .modal{background:white;padding:1rem 1.25rem;border-radius:8px;max-width:400px;width:90%;box-shadow:0 6px 20px rgba(0,0,0,0.2)}
        .modal__actions{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem}
        .button{padding:0.5rem 0.75rem;border-radius:6px;border:1px solid #ccc;background:#fff}
        .button--primary{background:#1c7ed6;color:#fff;border-color:#1769c4}
      `}</style>
    </div>
  );
};

export default UpdateAvailableModal;
