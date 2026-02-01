// StepDocumenta.tsx
// Step 5: Data, ora inizio/fine, 4 foto (panoramica, inizio, intervento, fine), note

import { ChangeEvent, RefObject } from "react";
import { WizardFormState } from "./InterventoWizard";

type PhotoType = "fotoPanoramica" | "fotoInizioLavori" | "fotoIntervento" | "fotoFineLavori";

interface StepDocumentaProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  fotoPanoramicaRef: RefObject<HTMLInputElement>;
  fotoInizioLavoriRef: RefObject<HTMLInputElement>;
  fotoInterventoRef: RefObject<HTMLInputElement>;
  fotoFineLavoriRef: RefObject<HTMLInputElement>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>, photoType: PhotoType) => void;
  removePhoto: (photoType: PhotoType) => void;
}

// Configurazione dei 4 tipi di foto
const PHOTO_TYPES = [
  { 
    type: "fotoPanoramica" as PhotoType, 
    label: "Panoramica",
    description: "Vista generale dell'area",
    icon: "🌄"
  },
  { 
    type: "fotoInizioLavori" as PhotoType, 
    label: "Inizio Lavori",
    description: "Stato del cantiere all'inizio",
    icon: "🚧"
  },
  { 
    type: "fotoIntervento" as PhotoType, 
    label: "Intervento",
    description: "Dettaglio del lavoro",
    icon: "⚒️"
  },
  { 
    type: "fotoFineLavori" as PhotoType, 
    label: "Fine Lavori",
    description: "Stato finale",
    icon: "✅"
  }
];

const StepDocumenta = ({
  formState,
  updateField,
  fotoPanoramicaRef,
  fotoInizioLavoriRef,
  fotoInterventoRef,
  fotoFineLavoriRef,
  handleFileChange,
  removePhoto
}: StepDocumentaProps) => {
  // Mappa refs per tipo
  const refMap: Record<PhotoType, RefObject<HTMLInputElement>> = {
    fotoPanoramica: fotoPanoramicaRef,
    fotoInizioLavori: fotoInizioLavoriRef,
    fotoIntervento: fotoInterventoRef,
    fotoFineLavori: fotoFineLavoriRef
  };

  // Ottieni preview per tipo
  const getPreview = (type: PhotoType): string | null => {
    return formState[`${type}Preview` as keyof WizardFormState] as string | null;
  };

  // Render singola area foto
  const renderPhotoArea = (config: typeof PHOTO_TYPES[0]) => {
    const { type, label, description, icon } = config;
    const preview = getPreview(type);
    const inputRef = refMap[type];

    return (
      <div key={type} className="photo-area">
        {/* Hidden file input */}
        <input
          type="file"
          ref={inputRef}
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(e, type)}
        />

        {preview ? (
          <div className="photo-area__preview">
            <img 
              src={preview} 
              alt={label} 
              className="photo-area__image"
            />
            <div className="photo-area__overlay">
              <span className="photo-area__overlay-label">{icon} {label}</span>
            </div>
            <div className="photo-area__actions">
              <button
                type="button"
                className="photo-area__btn photo-area__btn--change"
                onClick={() => inputRef.current?.click()}
              >
                📷
              </button>
              <button
                type="button"
                className="photo-area__btn photo-area__btn--remove"
                onClick={() => removePhoto(type)}
              >
                🗑️
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="photo-area__upload"
            onClick={() => inputRef.current?.click()}
          >
            <span className="photo-area__upload-icon">{icon}</span>
            <span className="photo-area__upload-label">{label}</span>
            <span className="photo-area__upload-desc">{description}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="step-documenta">
      {/* Info box in alto */}
      <div className="info-box info-box--blue">
        <span className="info-box__icon">📸</span>
        <p>
          Documenta l'intervento con foto e note. Le foto sono opzionali ma raccomandate.
        </p>
      </div>

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

      {/* Sezione 4 Foto */}
      <div className="step-documenta__photos">
        <h3 className="step-documenta__section-title">📸 Documentazione Fotografica</h3>
        
        <div className="photos-grid">
          {PHOTO_TYPES.map(config => renderPhotoArea(config))}
        </div>
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
    </div>
  );
};

export default StepDocumenta;
