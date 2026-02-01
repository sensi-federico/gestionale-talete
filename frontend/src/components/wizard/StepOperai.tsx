// StepOperai.tsx
// Step 3: Inserimento operai per tipo (Specializzato, Qualificato, Comune) con numero e ore

import { useCallback } from "react";
import { WizardFormState, TIPI_OPERAIO } from "./InterventoWizard";
import { OperaioEntry } from "@shared/types";

interface StepOperaiProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
}

const StepOperai = ({ formState, updateField }: StepOperaiProps) => {
  // Aggiungi nuovo tipo operaio
  const addOperaio = useCallback(() => {
    // Trova il primo tipo non ancora aggiunto
    const usedTypes = formState.operai.map(o => o.tipoOperaio);
    const availableType = TIPI_OPERAIO.find(t => !usedTypes.includes(t.value as OperaioEntry["tipoOperaio"]));
    
    if (!availableType) return; // Tutti i tipi già aggiunti
    
    const newOperaio: OperaioEntry = {
      tipoOperaio: availableType.value as OperaioEntry["tipoOperaio"],
      numero: 1,
      oreLavoro: 8
    };
    
    updateField("operai", [...formState.operai, newOperaio]);
  }, [formState.operai, updateField]);

  // Rimuovi operaio
  const removeOperaio = useCallback((index: number) => {
    updateField("operai", formState.operai.filter((_, i) => i !== index));
  }, [formState.operai, updateField]);

  // Aggiorna campo operaio
  const updateOperaio = useCallback((index: number, field: keyof OperaioEntry, value: string | number) => {
    const updated = [...formState.operai];
    updated[index] = { ...updated[index], [field]: value };
    updateField("operai", updated);
  }, [formState.operai, updateField]);

  // Calcola totale ore
  const totaleOre = formState.operai.reduce((sum, o) => sum + (o.numero * o.oreLavoro), 0);
  const totaleOperai = formState.operai.reduce((sum, o) => sum + o.numero, 0);

  return (
    <div className="step-operai">
      <div className="step-operai__header">
        <h3 className="step-operai__title">Operai Impiegati</h3>
        <p className="step-operai__subtitle">
          Aggiungi gli operai per tipo, indicando numero e ore lavorate
        </p>
      </div>

      {/* Lista operai */}
      <div className="step-operai__list">
        {formState.operai.map((operaio, index) => {
          // Trova i tipi già usati (escluso quello corrente)
          const usedTypes = formState.operai
            .filter((_, i) => i !== index)
            .map(o => o.tipoOperaio);
          
          return (
            <div key={index} className="operaio-card">
              <div className="operaio-card__header">
                <span className="operaio-card__icon">👷</span>
                <button
                  type="button"
                  className="operaio-card__remove"
                  onClick={() => removeOperaio(index)}
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
              
              <div className="operaio-card__fields">
                {/* Tipo operaio */}
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={operaio.tipoOperaio}
                    onChange={(e) => updateOperaio(index, "tipoOperaio", e.target.value)}
                  >
                    {TIPI_OPERAIO.map(tipo => (
                      <option 
                        key={tipo.value} 
                        value={tipo.value}
                        disabled={usedTypes.includes(tipo.value as OperaioEntry["tipoOperaio"])}
                      >
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="operaio-card__row">
                  {/* Numero operai */}
                  <div className="form-group">
                    <label>Numero</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={operaio.numero}
                      onChange={(e) => updateOperaio(index, "numero", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Ore lavoro */}
                  <div className="form-group">
                    <label>Ore</label>
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={operaio.oreLavoro}
                      onChange={(e) => updateOperaio(index, "oreLavoro", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Subtotale */}
                <div className="operaio-card__subtotal">
                  Subtotale: <strong>{operaio.numero * operaio.oreLavoro}</strong> ore/uomo
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottone aggiungi */}
      {formState.operai.length < TIPI_OPERAIO.length && (
        <button
          type="button"
          className="btn btn--secondary btn--full-width step-operai__add"
          onClick={addOperaio}
        >
          + Aggiungi tipo operaio
        </button>
      )}

      {/* Nessun operaio */}
      {formState.operai.length === 0 && (
        <div className="step-operai__empty">
          <span className="step-operai__empty-icon">👷</span>
          <p>Nessun operaio aggiunto</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={addOperaio}
          >
            Aggiungi primo operaio
          </button>
        </div>
      )}

      {/* Riepilogo totali */}
      {formState.operai.length > 0 && (
        <div className="step-operai__summary">
          <div className="step-operai__summary-item">
            <span className="step-operai__summary-label">Totale operai:</span>
            <span className="step-operai__summary-value">{totaleOperai}</span>
          </div>
          <div className="step-operai__summary-item">
            <span className="step-operai__summary-label">Totale ore/uomo:</span>
            <span className="step-operai__summary-value">{totaleOre}</span>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="info-box info-box--yellow">
        <span className="info-box__icon">ℹ️</span>
        <p>
          Le ore/uomo sono calcolate come numero operai × ore lavorate per ciascun tipo.
        </p>
      </div>
    </div>
  );
};

export default StepOperai;
