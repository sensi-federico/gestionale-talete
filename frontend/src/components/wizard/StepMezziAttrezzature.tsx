// StepMezziAttrezzature.tsx
// Step 4: Selezione mezzi e attrezzature con ore di utilizzo
// Permette di aggiungere lo stesso mezzo/attrezzatura più volte

import { useCallback, useMemo, useState } from "react";
import { WizardFormState } from "./InterventoWizard";
import { ReferenceData } from "../../hooks/useOfflineCache";
import { MezzoUtilizzo, AttrezzaturaUtilizzo } from "@shared/types";
import NumberInput from "../ui/NumberInput";

interface StepMezziAttrezzatureProps {
  formState: WizardFormState;
  updateField: <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => void;
  referenceData: ReferenceData | undefined;
  isLoadingReference: boolean;
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const StepMezziAttrezzature = ({
  formState,
  updateField,
  referenceData,
  isLoadingReference
}: StepMezziAttrezzatureProps) => {
  const [selectedMezzoToAdd, setSelectedMezzoToAdd] = useState<string>("");
  const [selectedAttrezzaturaToAdd, setSelectedAttrezzaturaToAdd] = useState<string>("");

  // Aggiungi un mezzo (può essere aggiunto più volte)
  const addMezzo = useCallback((mezzoId: string, mezzoNome: string) => {
    const newMezzo: MezzoUtilizzo = {
      id: generateId(),
      mezzoId,
      mezzoNome,
      oreUtilizzo: 8
    };
    updateField("mezziUtilizzo", [...formState.mezziUtilizzo, newMezzo]);
    setSelectedMezzoToAdd("");
  }, [formState.mezziUtilizzo, updateField]);

  // Rimuovi un mezzo specifico
  const removeMezzo = useCallback((entryId: string) => {
    updateField("mezziUtilizzo", formState.mezziUtilizzo.filter(m => m.id !== entryId));
  }, [formState.mezziUtilizzo, updateField]);

  // Aggiorna ore mezzo
  const updateMezzoOre = useCallback((entryId: string, ore: number) => {
    updateField("mezziUtilizzo", formState.mezziUtilizzo.map(m =>
      m.id === entryId ? { ...m, oreUtilizzo: ore } : m
    ));
  }, [formState.mezziUtilizzo, updateField]);

  // Aggiungi un'attrezzatura (può essere aggiunta più volte)
  const addAttrezzatura = useCallback((attrezzaturaId: string, attrezzaturaNome: string) => {
    const newAttrezzatura: AttrezzaturaUtilizzo = {
      id: generateId(),
      attrezzaturaId,
      attrezzaturaNome,
      oreUtilizzo: 8
    };
    updateField("attrezzatureUtilizzo", [...formState.attrezzatureUtilizzo, newAttrezzatura]);
    setSelectedAttrezzaturaToAdd("");
  }, [formState.attrezzatureUtilizzo, updateField]);

  // Rimuovi un'attrezzatura specifica
  const removeAttrezzatura = useCallback((entryId: string) => {
    updateField("attrezzatureUtilizzo", formState.attrezzatureUtilizzo.filter(a => a.id !== entryId));
  }, [formState.attrezzatureUtilizzo, updateField]);

  // Aggiorna ore attrezzatura
  const updateAttrezzaturaOre = useCallback((entryId: string, ore: number) => {
    updateField("attrezzatureUtilizzo", formState.attrezzatureUtilizzo.map(a =>
      a.id === entryId ? { ...a, oreUtilizzo: ore } : a
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

  // Get mezzo info by id
  const getMezzoInfo = useCallback((mezzoId: string) => {
    return mezziAttivi.find(m => m.id === mezzoId);
  }, [mezziAttivi]);

  // Get attrezzatura info by id
  const getAttrezzaturaInfo = useCallback((attrezzaturaId: string) => {
    return attrezzatureAttive.find(a => a.id === attrezzaturaId);
  }, [attrezzatureAttive]);

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
          <>
            {/* Selettore per aggiungere nuovo mezzo */}
            <div className="step-mezzi__add-section">
              <select
                value={selectedMezzoToAdd}
                onChange={(e) => setSelectedMezzoToAdd(e.target.value)}
                className="step-mezzi__select"
              >
                <option value="">Seleziona mezzo da aggiungere...</option>
                {mezziAttivi.map(mezzo => (
                  <option key={mezzo.id} value={mezzo.id}>
                    {mezzo.icona || "🚗"} {mezzo.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button button--primary button--sm"
                disabled={!selectedMezzoToAdd}
                onClick={() => {
                  const mezzo = mezziAttivi.find(m => m.id === selectedMezzoToAdd);
                  if (mezzo) {
                    addMezzo(mezzo.id, mezzo.nome);
                  }
                }}
              >
                + Aggiungi
              </button>
            </div>

            {/* Lista mezzi selezionati */}
            {formState.mezziUtilizzo.length > 0 && (
              <div className="step-mezzi__list">
                {formState.mezziUtilizzo.map((entry, index) => {
                  const mezzoInfo = getMezzoInfo(entry.mezzoId);
                  const entryKey = entry.id || `mezzo-${index}`;
                  return (
                    <div key={entryKey} className="mezzo-entry">
                      <div className="mezzo-entry__header">
                        <span className="mezzo-entry__icon">{mezzoInfo?.icona || "🚗"}</span>
                        <span className="mezzo-entry__name">{entry.mezzoNome || mezzoInfo?.nome || "Mezzo"}</span>
                        <button
                          type="button"
                          className="mezzo-entry__remove"
                          onClick={() => entry.id && removeMezzo(entry.id)}
                          title="Rimuovi"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mezzo-entry__ore">
                        <label>Ore utilizzo:</label>
                        <NumberInput
                          value={entry.oreUtilizzo}
                          onChange={(val) => entry.id && updateMezzoOre(entry.id, Number(val) || 0)}
                          min={0.5}
                          max={24}
                          step={0.5}
                          unit="h"
                          allowEmpty={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
          <>
            {/* Selettore per aggiungere nuova attrezzatura */}
            <div className="step-mezzi__add-section">
              <select
                value={selectedAttrezzaturaToAdd}
                onChange={(e) => setSelectedAttrezzaturaToAdd(e.target.value)}
                className="step-mezzi__select"
              >
                <option value="">Seleziona attrezzatura da aggiungere...</option>
                {attrezzatureAttive.map(attrezzatura => (
                  <option key={attrezzatura.id} value={attrezzatura.id}>
                    {attrezzatura.icona || "🛠️"} {attrezzatura.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button button--primary button--sm"
                disabled={!selectedAttrezzaturaToAdd}
                onClick={() => {
                  const attrezzatura = attrezzatureAttive.find(a => a.id === selectedAttrezzaturaToAdd);
                  if (attrezzatura) {
                    addAttrezzatura(attrezzatura.id, attrezzatura.nome);
                  }
                }}
              >
                + Aggiungi
              </button>
            </div>

            {/* Lista attrezzature selezionate */}
            {formState.attrezzatureUtilizzo.length > 0 && (
              <div className="step-mezzi__list">
                {formState.attrezzatureUtilizzo.map((entry, index) => {
                  const attrezzaturaInfo = getAttrezzaturaInfo(entry.attrezzaturaId);
                  const entryKey = entry.id || `attr-${index}`;
                  return (
                    <div key={entryKey} className="mezzo-entry">
                      <div className="mezzo-entry__header">
                        <span className="mezzo-entry__icon">{attrezzaturaInfo?.icona || "🛠️"}</span>
                        <span className="mezzo-entry__name">{entry.attrezzaturaNome || attrezzaturaInfo?.nome || "Attrezzatura"}</span>
                        <button
                          type="button"
                          className="mezzo-entry__remove"
                          onClick={() => entry.id && removeAttrezzatura(entry.id)}
                          title="Rimuovi"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mezzo-entry__ore">
                        <label>Ore utilizzo:</label>
                        <NumberInput
                          value={entry.oreUtilizzo}
                          onChange={(val) => entry.id && updateAttrezzaturaOre(entry.id, Number(val) || 0)}
                          min={0.5}
                          max={24}
                          step={0.5}
                          unit="h"
                          allowEmpty={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
          Seleziona mezzi e attrezzature dal menu, poi clicca "Aggiungi". Puoi aggiungere lo stesso elemento più volte con ore diverse.
        </p>
      </div>
    </div>
  );
};

export default StepMezziAttrezzature;
