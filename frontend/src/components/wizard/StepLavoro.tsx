// StepLavoro.tsx
// Step 2: Selezione tipo lavorazione, impresa (se tecnico), dati tubo esistente e nuovo

import { WizardFormState } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";
import NumberInput from "../ui/NumberInput";

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
      {/* Info box in alto */}
      <div className="info-box info-box--blue">
        <span className="info-box__icon">💡</span>
        <p>
          Seleziona il tipo di lavorazione e compila i dati tecnici dei tubi coinvolti.
        </p>
      </div>

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

      {/* Sezione Tubo Esistente */}
      <div className="tubo-section">
        <h4 className="tubo-section__title">🔧 Tubo Esistente</h4>
        <div className="tubo-section__grid">
          <div className="form-group">
            <label htmlFor="tuboEsistenteMateriale">Materiale</label>
            <select
              id="tuboEsistenteMateriale"
              value={formState.tuboEsistenteMateriale}
              onChange={(e) => updateField("tuboEsistenteMateriale", e.target.value)}
              disabled={isLoadingReference}
            >
              <option value="">Seleziona...</option>
              {referenceData?.materialiTubo?.map((m) => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tuboEsistenteDiametro">Diametro</label>
            <NumberInput
              id="tuboEsistenteDiametro"
              value={formState.tuboEsistenteDiametro}
              onChange={(val) => updateField("tuboEsistenteDiametro", String(val))}
              min={0}
              step={10}
              unit="mm"
              placeholder="Es: 100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tuboEsistentePn">PN</label>
            <input
              type="text"
              id="tuboEsistentePn"
              value={formState.tuboEsistentePn}
              onChange={(e) => updateField("tuboEsistentePn", e.target.value)}
              placeholder="Es: PN10"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tuboEsistenteProfondita">Profondità</label>
            <NumberInput
              id="tuboEsistenteProfondita"
              value={formState.tuboEsistenteProfondita}
              onChange={(val) => updateField("tuboEsistenteProfondita", String(val))}
              min={0}
              step={10}
              unit="cm"
              placeholder="Es: 120"
            />
          </div>
        </div>
      </div>

      {/* Sezione Tubo Nuovo */}
      <div className="tubo-section tubo-section--nuovo">
        <h4 className="tubo-section__title">✨ Tubo Nuovo</h4>
        <div className="tubo-section__grid">
          <div className="form-group">
            <label htmlFor="tuboNuovoMateriale">Materiale</label>
            <select
              id="tuboNuovoMateriale"
              value={formState.tuboNuovoMateriale}
              onChange={(e) => updateField("tuboNuovoMateriale", e.target.value)}
              disabled={isLoadingReference}
            >
              <option value="">Seleziona...</option>
              {referenceData?.materialiTubo?.map((m) => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tuboNuovoDiametro">Diametro</label>
            <NumberInput
              id="tuboNuovoDiametro"
              value={formState.tuboNuovoDiametro}
              onChange={(val) => updateField("tuboNuovoDiametro", String(val))}
              min={0}
              step={10}
              unit="mm"
              placeholder="Es: 100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tuboNuovoPn">PN</label>
            <input
              type="text"
              id="tuboNuovoPn"
              value={formState.tuboNuovoPn}
              onChange={(e) => updateField("tuboNuovoPn", e.target.value)}
              placeholder="Es: PN16"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tuboNuovoProfondita">Profondità</label>
            <NumberInput
              id="tuboNuovoProfondita"
              value={formState.tuboNuovoProfondita}
              onChange={(val) => updateField("tuboNuovoProfondita", String(val))}
              min={0}
              step={10}
              unit="cm"
              placeholder="Es: 120"
            />
          </div>
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
    </div>
  );
};

export default StepLavoro;
