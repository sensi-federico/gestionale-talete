// StepLavoro.tsx
// Step 2: Selezione tipo lavorazione, impresa (se tecnico), materiale tubo, ecc.

import { WizardFormState } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";

interface StepLavoroProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  referenceData: ReferenceData | undefined;
  isLoadingReference: boolean;
  isImpresa: boolean;
}

const StepLavoro = ({
  formState,
  updateField,
  referenceData,
  isLoadingReference,
  isImpresa
}: StepLavoroProps) => {
  return (
    <div className="step-lavoro">
      {/* Tipo Lavorazione */}
      <div className="form-group">
        <label htmlFor="tipoLavorazioneId">Tipo Lavorazione *</label>
        <select
          id="tipoLavorazioneId"
          name="tipoLavorazioneId"
          value={formState.tipoLavorazioneId}
          onChange={(e) => updateField("tipoLavorazioneId", e.target.value)}
          required
          disabled={isLoadingReference}
        >
          <option value="">Seleziona tipo lavorazione...</option>
          {referenceData?.tipiLavorazione?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        {referenceData?.tipiLavorazione?.find(t => t.id === formState.tipoLavorazioneId)?.descrizione && (
          <small className="form-hint">
            {referenceData.tipiLavorazione.find(t => t.id === formState.tipoLavorazioneId)?.descrizione}
          </small>
        )}
      </div>

      {/* Impresa - solo per tecnici */}
      {!isImpresa && (
        <div className="form-group">
          <label htmlFor="impresaId">Impresa *</label>
          <select
            id="impresaId"
            name="impresaId"
            value={formState.impresaId}
            onChange={(e) => updateField("impresaId", e.target.value)}
            required
            disabled={isLoadingReference}
          >
            <option value="">Seleziona impresa...</option>
            {referenceData?.imprese?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.ragione_sociale}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Materiale Tubo - da database */}
      <div className="form-group">
        <label htmlFor="materialeTubo">Materiale Tubo</label>
        <select
          id="materialeTubo"
          name="materialeTubo"
          value={formState.materialeTubo}
          onChange={(e) => updateField("materialeTubo", e.target.value)}
          disabled={isLoadingReference}
        >
          <option value="">Seleziona materiale...</option>
          {referenceData?.materialiTubo?.map((m) => (
            <option key={m.id} value={m.nome}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Diametro */}
      <div className="form-group">
        <label htmlFor="diametro">Diametro Tubo</label>
        <div className="input-with-unit">
          <input
            type="text"
            id="diametro"
            name="diametro"
            value={formState.diametro}
            onChange={(e) => updateField("diametro", e.target.value)}
            placeholder="Es: 100"
          />
          <span className="input-unit">mm</span>
        </div>
      </div>

      {/* Altri Interventi */}
      <div className="form-group">
        <label htmlFor="altriInterventi">Altri Interventi</label>
        <textarea
          id="altriInterventi"
          name="altriInterventi"
          value={formState.altriInterventi}
          onChange={(e) => updateField("altriInterventi", e.target.value)}
          placeholder="Descrivi eventuali altri interventi effettuati..."
          rows={3}
        />
      </div>

      {/* Info box */}
      <div className="info-box info-box--blue">
        <span className="info-box__icon">💡</span>
        <p>
          Seleziona il tipo di lavorazione principale. Se hai effettuato altri interventi,
          descrivili nel campo "Altri Interventi".
        </p>
      </div>
    </div>
  );
};

export default StepLavoro;
