import { ReactNode } from "react";

interface FormModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const FormModal = ({ isOpen, title, description, onClose, children }: FormModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="form-modal-overlay" onClick={onClose}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal__header">
          <button type="button" className="form-modal__back" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Indietro
          </button>
        </div>
        <div className="form-modal__content">
          <div className="form-modal__heading">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormModal;
