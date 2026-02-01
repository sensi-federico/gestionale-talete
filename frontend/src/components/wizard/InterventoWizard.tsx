// InterventoWizard.tsx
// Wizard multi-step per inserimento interventi (Tecnici e Imprese)

import { useState, useCallback, useMemo, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useReferenceData, useRefreshReferenceData } from "../../hooks/useOfflineCache";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useOfflineQueue } from "../../hooks/useOfflineQueue";
import { api } from "../../services/api";
import SubmitModal, { SubmitStatus } from "../ui/SubmitModal";
import LocationPermissionModal from "../ui/LocationPermissionModal";
import StepLuogo from "./StepLuogo";
import StepLavoro from "./StepLavoro";
import StepOperai from "./StepOperai";
import StepMezziAttrezzature from "./StepMezziAttrezzature";
import StepDocumenta from "./StepDocumenta";
import StepRiepilogo from "./StepRiepilogo";
import { MezzoUtilizzo, AttrezzaturaUtilizzo, OperaioEntry, OfflineRilevamento } from "@shared/types";

// Tipi operaio disponibili
export const TIPI_OPERAIO = [
  { value: "specializzato", label: "Operaio Specializzato" },
  { value: "qualificato", label: "Operaio Qualificato" },
  { value: "comune", label: "Operaio Comune" }
] as const;

// Definizione step del wizard
const WIZARD_STEPS = [
  { id: 1, label: "Luogo", icon: "📍" },
  { id: 2, label: "Lavoro", icon: "🔧" },
  { id: 3, label: "Operai", icon: "👷" },
  { id: 4, label: "Mezzi", icon: "🚛" },
  { id: 5, label: "Documenta", icon: "📸" },
  { id: 6, label: "Riepilogo", icon: "✅" }
] as const;

// Stato iniziale del form
const getInitialFormState = () => {
  const now = new Date();
  return {
    // Step 1 - Luogo
    comuneId: "",
    via: "",
    numeroCivico: "",
    manualLat: null as number | null,
    manualLon: null as number | null,
    
    // Step 2 - Lavoro
    tipoLavorazioneId: "",
    impresaId: "",
    materialeTubo: "",
    diametro: "",
    altriInterventi: "",
    
    // Step 3 - Operai
    operai: [] as OperaioEntry[],
    
    // Step 4 - Mezzi e Attrezzature
    mezziUtilizzo: [] as MezzoUtilizzo[],
    attrezzatureUtilizzo: [] as AttrezzaturaUtilizzo[],
    
    // Step 5 - Documenta
    rilevamentoDate: now.toISOString().split("T")[0],
    oraInizio: now.toTimeString().slice(0, 5),
    oraFine: "",
    notes: "",
    fotoFile: null as File | null,
    fotoPreview: null as string | null
  };
};

export type WizardFormState = ReturnType<typeof getInitialFormState>;

interface InterventoWizardProps {
  isImpresa?: boolean;
}

const InterventoWizard = ({ isImpresa = false }: InterventoWizardProps) => {
  const navigate = useNavigate();
  const { tokens, user } = useAuthStore();
  const { addToQueue } = useOfflineQueue();
  const geolocation = useGeolocation(true);
  const { data: referenceData, isLoading: isLoadingReference } = useReferenceData();
  const refreshReferenceData = useRefreshReferenceData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stato wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<WizardFormState>(getInitialFormState);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitora connessione
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    refreshReferenceData();
  }, [refreshReferenceData]);

  const handleOffline = useCallback(() => setIsOnline(false), []);

  // Aggiorna singolo campo
  const updateField = useCallback(<K extends keyof WizardFormState>(
    field: K,
    value: WizardFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Aggiorna coordinate dalla mappa
  const updateCoords = useCallback((coords: { lat: number; lon: number }) => {
    setFormState(prev => ({
      ...prev,
      manualLat: coords.lat,
      manualLon: coords.lon
    }));
  }, []);

  // Gestione foto
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormState(prev => ({
          ...prev,
          fotoFile: file,
          fotoPreview: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removePhoto = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      fotoFile: null,
      fotoPreview: null
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Validazione step
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: // Luogo
        return Boolean(formState.comuneId && formState.via);
      case 2: // Lavoro
        if (isImpresa) {
          return Boolean(formState.tipoLavorazioneId);
        }
        return Boolean(formState.tipoLavorazioneId && formState.impresaId);
      case 3: // Operai
        return formState.operai.length > 0 && 
               formState.operai.every(o => o.numero > 0 && o.oreLavoro > 0);
      case 4: // Mezzi - almeno un mezzo o attrezzatura con ore
        const hasMezzi = formState.mezziUtilizzo.some(m => m.oreUtilizzo > 0);
        const hasAttrezzature = formState.attrezzatureUtilizzo.some(a => a.oreUtilizzo > 0);
        return hasMezzi || hasAttrezzature;
      case 5: // Documenta
        return Boolean(formState.rilevamentoDate && formState.oraInizio);
      case 6: // Riepilogo
        return true;
      default:
        return false;
    }
  }, [currentStep, formState, isImpresa]);

  // Navigazione step
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState(getInitialFormState());
    setCurrentStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Submit offline
  const submitOffline = useCallback(async () => {
    if (!user) throw new Error("Utente non autenticato");

    const record: OfflineRilevamento = {
      comuneId: formState.comuneId,
      via: formState.via,
      numeroCivico: formState.numeroCivico,
      tipoLavorazioneId: formState.tipoLavorazioneId,
      impresaId: isImpresa ? user.impresaId || "" : formState.impresaId,
      numeroOperai: formState.operai.reduce((sum, o) => sum + o.numero, 0),
      gpsLat: geolocation.position?.latitude ?? 0,
      gpsLon: geolocation.position?.longitude ?? 0,
      manualLat: formState.manualLat,
      manualLon: formState.manualLon,
      rilevamentoDate: formState.rilevamentoDate,
      rilevamentoTime: formState.oraInizio,
      notes: formState.notes,
      materialeTubo: formState.materialeTubo || undefined,
      diametro: formState.diametro || undefined,
      altriInterventi: formState.altriInterventi || undefined,
      oraFine: formState.oraFine || undefined,
      submitTimestamp: new Date().toISOString(),
      submitGpsLat: geolocation.position?.latitude,
      submitGpsLon: geolocation.position?.longitude,
      localId: crypto.randomUUID(),
      isSynced: false,
      localCreatedAt: new Date().toISOString(),
      // Dati aggiuntivi per la sincronizzazione
      mezziUtilizzo: formState.mezziUtilizzo.filter(m => m.oreUtilizzo > 0),
      attrezzatureUtilizzo: formState.attrezzatureUtilizzo.filter(a => a.oreUtilizzo > 0),
      operai: formState.operai
    };

    if (formState.fotoFile) {
      record.fileBlob = await formState.fotoFile.arrayBuffer()
        .then(buffer => new Blob([buffer], { type: formState.fotoFile!.type }));
    }

    await addToQueue(record);
    setSubmitStatus("offline");
    setSubmitMessage("Verrà sincronizzato automaticamente quando tornerai online");
    resetForm();
  }, [user, formState, geolocation.position, isImpresa, addToQueue, resetForm]);

  // Submit online
  const handleSubmit = useCallback(async () => {
    if (!tokens) {
      setSubmitStatus("error");
      setSubmitMessage("Sessione scaduta. Effettua nuovamente il login.");
      return;
    }

    // Offline mode
    if (!navigator.onLine) {
      try {
        await submitOffline();
      } catch (err) {
        setSubmitStatus("error");
        setSubmitMessage("Errore nel salvataggio offline");
      }
      return;
    }

    setSubmitStatus("loading");

    try {
      const formData = new FormData();
      formData.append("comuneId", formState.comuneId);
      formData.append("via", formState.via);
      formData.append("numeroCivico", formState.numeroCivico);
      formData.append("tipoLavorazioneId", formState.tipoLavorazioneId);
      formData.append("impresaId", isImpresa ? user?.impresaId || "" : formState.impresaId);
      formData.append("numeroOperai", String(formState.operai.reduce((sum, o) => sum + o.numero, 0)));
      formData.append("gpsLat", String(geolocation.position?.latitude ?? 0));
      formData.append("gpsLon", String(geolocation.position?.longitude ?? 0));
      formData.append("manualLat", formState.manualLat ? String(formState.manualLat) : "");
      formData.append("manualLon", formState.manualLon ? String(formState.manualLon) : "");
      formData.append("rilevamentoDate", formState.rilevamentoDate);
      formData.append("rilevamentoTime", formState.oraInizio);
      
      if (formState.notes) formData.append("notes", formState.notes);
      if (formState.materialeTubo) formData.append("materialeTubo", formState.materialeTubo);
      if (formState.diametro) formData.append("diametro", formState.diametro);
      if (formState.altriInterventi) formData.append("altriInterventi", formState.altriInterventi);
      if (formState.oraFine) formData.append("oraFine", formState.oraFine);
      if (formState.fotoFile) formData.append("foto", formState.fotoFile);

      // Dati strutturati come JSON
      formData.append("mezziUtilizzo", JSON.stringify(
        formState.mezziUtilizzo.filter(m => m.oreUtilizzo > 0)
      ));
      formData.append("attrezzatureUtilizzo", JSON.stringify(
        formState.attrezzatureUtilizzo.filter(a => a.oreUtilizzo > 0)
      ));
      formData.append("operai", JSON.stringify(formState.operai));

      // Timestamp e GPS reali
      formData.append("submitTimestamp", new Date().toISOString());
      if (geolocation.position) {
        formData.append("submitGpsLat", String(geolocation.position.latitude));
        formData.append("submitGpsLon", String(geolocation.position.longitude));
      }

      await api.createRilevamento(formData, tokens.accessToken);

      setSubmitStatus("success");
      setSubmitMessage("Intervento registrato con successo!");
      resetForm();
    } catch (error) {
      console.error("Errore invio:", error);
      
      // Fallback offline
      try {
        await submitOffline();
      } catch {
        setSubmitStatus("error");
        setSubmitMessage("Errore durante l'invio. Riprova più tardi.");
      }
    }
  }, [tokens, formState, geolocation.position, isImpresa, user, submitOffline, resetForm]);

  // Handler modal
  const handleCloseModal = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
  }, []);

  const handleNewRilevamento = useCallback(() => {
    handleCloseModal();
    window.scrollTo(0, 0);
  }, [handleCloseModal]);

  const handleViewRilevamenti = useCallback(() => {
    handleCloseModal();
    navigate("/miei-rilevamenti");
  }, [handleCloseModal, navigate]);

  const handleGoHome = useCallback(() => {
    handleCloseModal();
    navigate("/");
  }, [handleCloseModal, navigate]);

  // Render progress bar
  const renderProgressBar = () => (
    <div className="wizard-progress">
      <div className="wizard-progress__bar">
        <div 
          className="wizard-progress__fill" 
          style={{ width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <div className="wizard-progress__steps">
        {WIZARD_STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`wizard-progress__step ${
              step.id === currentStep ? "wizard-progress__step--active" : ""
            } ${step.id < currentStep ? "wizard-progress__step--completed" : ""}`}
            onClick={() => step.id <= currentStep && goToStep(step.id)}
            disabled={step.id > currentStep}
          >
            <span className="wizard-progress__icon">{step.icon}</span>
            <span className="wizard-progress__label">{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Render step corrente
  const renderCurrentStep = () => {
    const commonProps = {
      formState,
      updateField,
      referenceData,
      isLoadingReference
    };

    switch (currentStep) {
      case 1:
        return (
          <StepLuogo
            {...commonProps}
            updateCoords={updateCoords}
            geolocation={geolocation}
          />
        );
      case 2:
        return (
          <StepLavoro
            {...commonProps}
            isImpresa={isImpresa}
          />
        );
      case 3:
        return (
          <StepOperai
            {...commonProps}
          />
        );
      case 4:
        return (
          <StepMezziAttrezzature
            {...commonProps}
          />
        );
      case 5:
        return (
          <StepDocumenta
            {...commonProps}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            removePhoto={removePhoto}
          />
        );
      case 6:
        return (
          <StepRiepilogo
            {...commonProps}
            goToStep={goToStep}
            isImpresa={isImpresa}
          />
        );
      default:
        return null;
    }
  };

  // Render navigazione
  const renderNavigation = () => (
    <div className="wizard-nav">
      {currentStep > 1 && (
        <button
          type="button"
          className="wizard-nav__btn wizard-nav__btn--prev"
          onClick={prevStep}
        >
          ← Indietro
        </button>
      )}
      
      {currentStep < WIZARD_STEPS.length ? (
        <button
          type="button"
          className="wizard-nav__btn wizard-nav__btn--next"
          onClick={nextStep}
          disabled={!isStepValid}
        >
          Avanti →
        </button>
      ) : (
        <button
          type="button"
          className="wizard-nav__btn wizard-nav__btn--submit"
          onClick={handleSubmit}
          disabled={submitStatus === "loading"}
        >
          {submitStatus === "loading" ? "Invio in corso..." : "📤 Invia Intervento"}
        </button>
      )}
    </div>
  );

  return (
    <div className="intervento-wizard">
      {/* Modal permessi geolocalizzazione */}
      <LocationPermissionModal
        isOpen={geolocation.showPermissionModal}
        onRequestPermission={geolocation.confirmPermission}
        onSkip={geolocation.skipPermission}
      />

      {/* Progress bar */}
      {renderProgressBar()}

      {/* Titolo step */}
      <div className="wizard-header">
        <h2 className="wizard-header__title">
          {WIZARD_STEPS[currentStep - 1].icon} {WIZARD_STEPS[currentStep - 1].label}
        </h2>
        <span className="wizard-header__counter">
          Passo {currentStep} di {WIZARD_STEPS.length}
        </span>
      </div>

      {/* Contenuto step */}
      <div className="wizard-content">
        {renderCurrentStep()}
      </div>

      {/* Navigazione */}
      {renderNavigation()}

      {/* Modal submit */}
      <SubmitModal
        status={submitStatus}
        message={submitMessage}
        onClose={handleCloseModal}
        onNewRilevamento={handleNewRilevamento}
        onViewRilevamenti={handleViewRilevamenti}
        onGoHome={handleGoHome}
      />

      {/* Input file nascosto per foto */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default InterventoWizard;
