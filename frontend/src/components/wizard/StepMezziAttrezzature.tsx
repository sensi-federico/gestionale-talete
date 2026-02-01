// StepMezziAttrezzature.tsx
// Step 4: Selezione mezzi e attrezzature con ore di utilizzo

import { useCallback, useMemo } from "react";
import { WizardFormState } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";
import { MezzoUtilizzo, AttrezzaturaUtilizzo } from "@shared/types";

interface StepMezziAttrezzatureProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  referenceData: ReferenceData | undefined;
  isLoadingReference: boolean;
}

const StepMezziAttrezzature = ({
  formState,
  updateField,
  referenceData,
  isLoadingReference
}: StepMezziAttrezzatureProps) => {
  // Toggle mezzo selezionato
  const toggleMezzo = useCallback((mezzoId: string, mezzoNome: string) => {
    const existing = formState.mezziUtilizzo.find(m => m.mezzoId === mezzoId);
    
    if (existing) {
      // Rimuovi
      updateField("mezziUtilizzo", formState.mezziUtilizzo.filter(m => m.mezzoId !== mezzoId));
    } else {
      // Aggiungi con ore default
      const newMezzo: MezzoUtilizzo = {
        mezzoId,
        mezzoNome,
        oreUtilizzo: 8
      };
      updateField("mezziUtilizzo", [...formState.mezziUtilizzo, newMezzo]);
    }
  }, [formState.mezziUtilizzo, updateField]);

  // Aggiorna ore mezzo
  const updateMezzoOre = useCallback((mezzoId: string, ore: number) => {
    updateField("mezziUtilizzo", formState.mezziUtilizzo.map(m =>
      m.mezzoId === mezzoId ? { ...m, oreUtilizzo: ore } : m
    ));
  }, [formState.mezziUtilizzo, updateField]);

  // Toggle attrezzatura selezionata
  const toggleAttrezzatura = useCallback((attrezzaturaId: string, attrezzaturaNome: string) => {
    const existing = formState.attrezzatureUtilizzo.find(a => a.attrezzaturaId === attrezzaturaId);
    
    if (existing) {
      // Rimuovi
      updateField("attrezzatureUtilizzo", 
        formState.attrezzatureUtilizzo.filter(a => a.attrezzaturaId !== attrezzaturaId)
      );
    } else {
      // Aggiungi con ore default
      const newAttrezzatura: AttrezzaturaUtilizzo = {
        attrezzaturaId,
        attrezzaturaNome,
        oreUtilizzo: 8
      };
      updateField("attrezzatureUtilizzo", [...formState.attrezzatureUtilizzo, newAttrezzatura]);
    }
  }, [formState.attrezzatureUtilizzo, updateField]);

  // Aggiorna ore attrezzatura
  const updateAttrezzaturaOre = useCallback((attrezzaturaId: string, ore: number) => {
    updateField("attrezzatureUtilizzo", formState.attrezzatureUtilizzo.map(a =>
      a.attrezzaturaId === attrezzaturaId ? { ...a, oreUtilizzo: ore } : a
    ));
  }, [formState.attrezzatureUtilizzo, updateField]);

  // Mezzi attivi dal database
  const mezziAttivi = useMemo(() => 
    referenceData?.mezzi?.filter(m => m.attivo) || [], 
    [referenceData?.mezzi]
  );

  // Attrezzature attive dal database
  const attrezzatureAttive = useMemo(() => 
    referenceData?.attrezzature?.filter(a => a.attivo) || [], 
    [referenceData?.attrezzature]
  );

  // Calcola totali
  const totaleOreMezzi = formState.mezziUtilizzo.reduce((sum, m) => sum + m.oreUtilizzo, 0);
  const totaleOreAttrezzature = formState.attrezzatureUtilizzo.reduce((sum, a) => sum + a.oreUtilizzo, 0);

  if (isLoadingReference) {
    return (
      <div className="step-mezzi__loading">
        <span className="spinner" /> Caricamento dati...
      </div>
    );
  }

  return (
    <div className="step-mezzi">
      {/* Sezione Mezzi */}
      <div className="step-mezzi__section">
        <h3 className="step-mezzi__section-title">
          🚛 Mezzi di Lavoro
        </h3>
        
        {mezziAttivi.length === 0 ? (
          <div className="step-mezzi__empty">
            Nessun mezzo disponibile. Contatta l'amministratore.
          </div>
        ) : (
          <div className="step-mezzi__grid">
            {mezziAttivi.map(mezzo => {
              const selected = formState.mezziUtilizzo.find(m => m.mezzoId === mezzo.id);
              const isSelected = !!selected;
              
              return (
                <div 
                  key={mezzo.id} 
                  className={`mezzo-card ${isSelected ? "mezzo-card--selected" : ""}`}
                >
                  <button
                    type="button"
                    className="mezzo-card__toggle"
                    onClick={() => toggleMezzo(mezzo.id, mezzo.nome)}
                  >
                    <span className="mezzo-card__icon">{mezzo.icona || "🚗"}</span>
                    <span className="mezzo-card__name">{mezzo.nome}</span>
                    <span className={`mezzo-card__check ${isSelected ? "mezzo-card__check--visible" : ""}`}>
                      ✓
                    </span>
                  </button>
                  
                  {isSelected && (
                    <div className="mezzo-card__ore">
                      <label>Ore utilizzo:</label>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={selected.oreUtilizzo}
                        onChange={(e) => updateMezzoOre(mezzo.id, parseFloat(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {formState.mezziUtilizzo.length > 0 && (
          <div className="step-mezzi__subtotal">
            Totale ore mezzi: <strong>{totaleOreMezzi}</strong>
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="step-mezzi__divider" />

      {/* Sezione Attrezzature */}
      <div className="step-mezzi__section">
        <h3 className="step-mezzi__section-title">
          🔧 Attrezzature
        </h3>
        
        {attrezzatureAttive.length === 0 ? (
          <div className="step-mezzi__empty">
            Nessuna attrezzatura disponibile. Contatta l'amministratore.
          </div>
        ) : (
          <div className="step-mezzi__grid">
            {attrezzatureAttive.map(attrezzatura => {
              const selected = formState.attrezzatureUtilizzo.find(a => a.attrezzaturaId === attrezzatura.id);
              const isSelected = !!selected;
              
              return (
                <div 
                  key={attrezzatura.id} 
                  className={`mezzo-card ${isSelected ? "mezzo-card--selected" : ""}`}
                >
                  <button
                    type="button"
                    className="mezzo-card__toggle"
                    onClick={() => toggleAttrezzatura(attrezzatura.id, attrezzatura.nome)}
                  >
                    <span className="mezzo-card__icon">{attrezzatura.icona || "🛠️"}</span>
                    <span className="mezzo-card__name">{attrezzatura.nome}</span>
                    <span className={`mezzo-card__check ${isSelected ? "mezzo-card__check--visible" : ""}`}>
                      ✓
                    </span>
                  </button>
                  
                  {isSelected && (
                    <div className="mezzo-card__ore">
                      <label>Ore utilizzo:</label>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={selected.oreUtilizzo}
                        onChange={(e) => updateAttrezzaturaOre(attrezzatura.id, parseFloat(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {formState.attrezzatureUtilizzo.length > 0 && (
          <div className="step-mezzi__subtotal">
            Totale ore attrezzature: <strong>{totaleOreAttrezzature}</strong>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="info-box info-box--blue">
        <span className="info-box__icon">💡</span>
        <p>
          Seleziona i mezzi e le attrezzature utilizzate, quindi indica le ore di utilizzo per ciascuno.
        </p>
      </div>
    </div>
  );
};

export default StepMezziAttrezzature;
