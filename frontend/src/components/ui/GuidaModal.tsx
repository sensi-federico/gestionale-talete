// GuidaModal.tsx
// Modal con guida interattiva per ogni ruolo utente

import { useState, useCallback } from "react";
import { useAuthStore } from "../../store/authStore";

interface GuidaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Definizione delle guide per ruolo
interface GuideStep {
  icon: string;
  title: string;
  description: string;
}

interface RoleGuide {
  title: string;
  steps: GuideStep[];
}

const GUIDE_DATA: Record<string, RoleGuide> = {
  operaio: {
    title: "Guida Tecnico",
    steps: [
      {
        icon: "📍",
        title: "Passo 1: Scegli il Luogo",
        description: "Seleziona il comune, inserisci l'indirizzo e posiziona il marker sulla mappa cliccando nel punto esatto dell'intervento."
      },
      {
        icon: "🔧",
        title: "Passo 2: Dettagli Lavoro",
        description: "Seleziona il tipo di lavorazione, l'impresa per cui lavori e compila i dettagli tecnici come materiale del tubo e diametro."
      },
      {
        icon: "👷",
        title: "Passo 3: Operai",
        description: "Aggiungi gli operai coinvolti, specificando il tipo (specializzato, qualificato, comune), il numero e le ore lavorate."
      },
      {
        icon: "🚛",
        title: "Passo 4: Mezzi e Attrezzature",
        description: "Seleziona i mezzi e le attrezzature utilizzate durante l'intervento, indicando le ore di utilizzo per ciascuno."
      },
      {
        icon: "📸",
        title: "Passo 5: Documentazione",
        description: "Inserisci data e orario dell'intervento. Puoi aggiungere fino a 4 foto: Panoramica, Inizio Lavori, Intervento e Fine Lavori."
      },
      {
        icon: "✅",
        title: "Passo 6: Riepilogo e Invio",
        description: "Controlla tutti i dati inseriti nel riepilogo. Se tutto è corretto, premi 'Invia Intervento' per completare la registrazione."
      }
    ]
  },
  impresa: {
    title: "Guida Impresa",
    steps: [
      {
        icon: "📊",
        title: "Dashboard",
        description: "Dalla dashboard puoi vedere un riepilogo degli interventi della tua impresa, con statistiche mensili e stato sincronizzazione."
      },
      {
        icon: "➕",
        title: "Nuovo Intervento",
        description: "Clicca su 'Nuovo Intervento' per registrare un lavoro. Il wizard ti guiderà passo passo nella compilazione."
      },
      {
        icon: "📋",
        title: "I Miei Interventi",
        description: "Visualizza l'elenco completo degli interventi registrati dalla tua impresa, con possibilità di filtrare e cercare."
      },
      {
        icon: "🗺️",
        title: "Posizione sulla Mappa",
        description: "Nel wizard, clicca sulla mappa satellite per posizionare esattamente il punto dell'intervento. Il geocoding ti aiuterà a trovare l'indirizzo."
      },
      {
        icon: "📸",
        title: "Foto Documentazione",
        description: "Puoi allegare fino a 4 foto per ogni intervento: Panoramica, Inizio Lavori, Intervento e Fine Lavori. Le foto vengono compresse automaticamente."
      },
      {
        icon: "🔄",
        title: "Sincronizzazione Offline",
        description: "L'app funziona anche senza connessione. Gli interventi salvati offline verranno sincronizzati automaticamente quando torni online."
      }
    ]
  },
  admin: {
    title: "Guida Amministratore",
    steps: [
      {
        icon: "📊",
        title: "Dashboard Amministratore",
        description: "Panoramica completa con statistiche interventi, utenti attivi, comuni e imprese registrate."
      },
      {
        icon: "👥",
        title: "Gestione Utenti",
        description: "Crea, modifica ed elimina utenti. Puoi assegnare ruoli (tecnico, impresa, admin) e associare tecnici alle imprese."
      },
      {
        icon: "🏢",
        title: "Gestione Imprese",
        description: "Aggiungi nuove imprese, modifica le esistenti o disabilitale. Ogni impresa può avere più tecnici associati."
      },
      {
        icon: "🏙️",
        title: "Gestione Comuni",
        description: "Gestisci l'elenco dei comuni in cui si possono registrare interventi. Aggiungi o rimuovi comuni secondo necessità."
      },
      {
        icon: "📋",
        title: "Tutti gli Interventi",
        description: "Visualizza tutti gli interventi registrati nel sistema, con filtri avanzati per data, comune, impresa e tipo."
      },
      {
        icon: "📥",
        title: "Download Dati",
        description: "Esporta gli interventi in formato CSV o scarica un archivio ZIP con tutte le foto allegate per analisi e reportistica."
      }
    ]
  },
  responsabile: {
    title: "Guida Responsabile",
    steps: [
      {
        icon: "📊",
        title: "Dashboard",
        description: "Visualizza lo stato generale degli interventi e le statistiche principali della tua area di competenza."
      },
      {
        icon: "📋",
        title: "Visualizza Interventi",
        description: "Consulta l'elenco degli interventi registrati, con possibilità di filtrare per data, tipo e stato."
      },
      {
        icon: "🔍",
        title: "Dettagli Intervento",
        description: "Clicca su un intervento per visualizzare tutti i dettagli, comprese foto, operai coinvolti e mezzi utilizzati."
      }
    ]
  }
};

const GuidaModal = ({ isOpen, onClose }: GuidaModalProps) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  
  const role = user?.role || "operaio";
  const guide = GUIDE_DATA[role] || GUIDE_DATA.operaio;

  const nextStep = useCallback(() => {
    if (currentStep < guide.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, guide.steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const step = guide.steps[currentStep];

  return (
    <div className="guida-modal-overlay" onClick={handleClose}>
      <div className="guida-modal" onClick={e => e.stopPropagation()}>
        <button className="guida-modal__close" onClick={handleClose}>
          ✕
        </button>

        <div className="guida-modal__header">
          <h2>{guide.title}</h2>
          <div className="guida-modal__progress">
            {guide.steps.map((_, idx) => (
              <span 
                key={idx} 
                className={`guida-modal__dot ${idx === currentStep ? "guida-modal__dot--active" : ""} ${idx < currentStep ? "guida-modal__dot--done" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="guida-modal__content">
          <div className="guida-modal__icon">{step.icon}</div>
          <h3 className="guida-modal__step-title">{step.title}</h3>
          <p className="guida-modal__step-desc">{step.description}</p>
        </div>

        <div className="guida-modal__nav">
          <button
            className="guida-modal__btn guida-modal__btn--prev"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            ← Precedente
          </button>
          
          <span className="guida-modal__counter">
            {currentStep + 1} / {guide.steps.length}
          </span>

          {currentStep < guide.steps.length - 1 ? (
            <button
              className="guida-modal__btn guida-modal__btn--next"
              onClick={nextStep}
            >
              Successivo →
            </button>
          ) : (
            <button
              className="guida-modal__btn guida-modal__btn--finish"
              onClick={handleClose}
            >
              Ho capito ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidaModal;
