// StepDocumenta.tsx
// Step 5: Data, ora inizio/fine, foto, note

import { ChangeEvent, RefObject } from "react";
import { WizardFormState } from "./InterventoWizard";

interface StepDocumentaProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
}

const StepDocumenta = ({
  formState,
  updateField,
  fileInputRef,
  handleFileChange,
  removePhoto
}: StepDocumentaProps) => {
  // Apri fotocamera/galleria
  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="step-documenta">
      {/* Data e Ora */}
      <div className="step-documenta__datetime">
        <div className="form-group">
          <label htmlFor="rilevamentoDate">Data Intervento *</label>
          <input
            type="date"
            id="rilevamentoDate"
            name="rilevamentoDate"
            value={formState.rilevamentoDate}
            onChange={(e) => updateField("rilevamentoDate", e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="oraInizio">Ora Inizio *</label>
            <input
              type="time"
              id="oraInizio"
              name="oraInizio"
              value={formState.oraInizio}
              onChange={(e) => updateField("oraInizio", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="oraFine">Ora Fine</label>
            <input
              type="time"
              id="oraFine"
              name="oraFine"
              value={formState.oraFine}
              onChange={(e) => updateField("oraFine", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sezione Foto */}
      <div className="step-documenta__photo">
        <h3 className="step-documenta__section-title">📸 Documentazione Fotografica</h3>
        
        {formState.fotoPreview ? (
          <div className="photo-preview">
            <img 
              src={formState.fotoPreview} 
              alt="Anteprima foto" 
              className="photo-preview__image"
            />
            <div className="photo-preview__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={openCamera}
              >
                📷 Sostituisci
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={removePhoto}
              >
                🗑️ Rimuovi
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="photo-upload-btn"
            onClick={openCamera}
          >
            <span className="photo-upload-btn__icon">📷</span>
            <span className="photo-upload-btn__text">Scatta foto o seleziona dalla galleria</span>
            <span className="photo-upload-btn__hint">Opzionale</span>
          </button>
        )}
      </div>

      {/* Note */}
      <div className="form-group">
        <label htmlFor="notes">Note Aggiuntive</label>
        <textarea
          id="notes"
          name="notes"
          value={formState.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Aggiungi eventuali note o osservazioni sull'intervento..."
          rows={4}
        />
      </div>

      {/* Info box */}
      <div className="info-box info-box--green">
        <span className="info-box__icon">📋</span>
        <p>
          La foto e le note sono opzionali ma aiutano a documentare meglio l'intervento.
        </p>
      </div>
    </div>
  );
};

export default StepDocumenta;
