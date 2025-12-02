import { ChangeEvent, FormEvent, useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useOfflineQueue } from "../../hooks/useOfflineQueue";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useReferenceData, useRefreshReferenceData } from "../../hooks/useOfflineCache";
import MapPicker from "../map/MapPicker";
import SubmitModal, { SubmitStatus } from "../ui/SubmitModal";
import LocationPermissionModal from "../ui/LocationPermissionModal";
import { api } from "../../services/api";
import { OfflineRilevamento } from "@shared/types";

const formatDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].slice(0, 5);
  return { date, time };
};

// Opzioni predefinite per i nuovi campi
const MATERIALI_TUBO = [
  { value: "", label: "Seleziona..." },
  { value: "PVC", label: "PVC" },
  { value: "PE", label: "PE (Polietilene)" },
  { value: "PEAD", label: "PEAD" },
  { value: "Ghisa", label: "Ghisa" },
  { value: "Acciaio", label: "Acciaio" },
  { value: "Rame", label: "Rame" },
  { value: "Cemento", label: "Cemento Amianto" },
  { value: "Altro", label: "Altro" }
];

// Opzioni mezzi disponibili
const MEZZI_OPTIONS = [
  { value: "motocarro", label: "🚛 Motocarro" },
  { value: "fiorino", label: "🚐 Fiorino" },
  { value: "daily", label: "🚐 Daily" },
  { value: "camion", label: "🚚 Camion" },
  { value: "mini_escavatore", label: "🚧 Mini escavatore" },
  { value: "escavatore", label: "🚧 Escavatore" },
  { value: "terna", label: "🚜 Terna" },
  { value: "altro", label: "📦 Altro" }
];

type FormState = {
  comuneId: string;
  via: string;
  numeroCivico: string;
  tipoLavorazioneId: string;
  impresaId: string;
  numeroOperai: number;
  notes: string;
  // Nuovi campi
  materialeTubo: string;
  diametro: string;
  altriInterventi: string;
  mezzi: string[];
};

const NuovoRilevamentoForm = () => {
  const navigate = useNavigate();
  const { tokens, user } = useAuthStore();
  const { addToQueue } = useOfflineQueue();
  const geolocation = useGeolocation(true); // autoStart = true mostra il modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ date, time }, setDateTime] = useState(() => formatDateTime());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formState, setFormState] = useState<FormState>({
    comuneId: "",
    via: "",
    numeroCivico: "",
    tipoLavorazioneId: "",
    impresaId: "",
    numeroOperai: 1,
    notes: "",
    materialeTubo: "",
    diametro: "",
    altriInterventi: "",
    mezzi: []
  });
  const [manualCoords, setManualCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");

  // Usa hook con cache offline per i dati di riferimento
  const { data: referenceData, isLoading: isLoadingReference } = useReferenceData();
  const refreshReferenceData = useRefreshReferenceData();

  // Monitora stato connessione e aggiorna dati quando torna online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshReferenceData();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshReferenceData]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(formState.comuneId) &&
      Boolean(formState.tipoLavorazioneId) &&
      Boolean(formState.impresaId) &&
      Boolean(formState.via)
    );
  }, [formState]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === "numeroOperai") {
      setFormState((prev) => ({ ...prev, numeroOperai: Number(value) }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateTime((prev) => ({
      ...prev,
      [name === "rilevamentoDate" ? "date" : "time"]: value
    }));
  };

  const handleMezziChange = (mezzo: string) => {
    setFormState((prev) => {
      const isSelected = prev.mezzi.includes(mezzo);
      return {
        ...prev,
        mezzi: isSelected
          ? prev.mezzi.filter((m) => m !== mezzo)
          : [...prev.mezzi, mezzo]
      };
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFotoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setFotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFotoPreview(null);
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setFormState({
      comuneId: "",
      via: "",
      numeroCivico: "",
      tipoLavorazioneId: "",
      impresaId: "",
      numeroOperai: 1,
      notes: "",
      materialeTubo: "",
      diametro: "",
      altriInterventi: "",
      mezzi: []
    });
    setManualCoords(null);
    removePhoto();
    setDateTime(formatDateTime());
  };

  const submitOffline = async () => {
    if (!user) throw new Error("Utente non autenticato");

    const record: OfflineRilevamento = {
      comuneId: formState.comuneId,
      via: formState.via,
      numeroCivico: formState.numeroCivico,
      tipoLavorazioneId: formState.tipoLavorazioneId,
      impresaId: formState.impresaId,
      numeroOperai: formState.numeroOperai,
      fotoUrl: undefined,
      gpsLat: geolocation.position?.latitude ?? 0,
      gpsLon: geolocation.position?.longitude ?? 0,
      manualLat: manualCoords?.lat ?? null,
      manualLon: manualCoords?.lon ?? null,
      rilevamentoDate: date,
      rilevamentoTime: time,
      notes: formState.notes,
      // Nuovi campi
      materialeTubo: formState.materialeTubo || undefined,
      diametro: formState.diametro || undefined,
      altriInterventi: formState.altriInterventi || undefined,
      submitTimestamp: new Date().toISOString(),
      submitGpsLat: geolocation.position?.latitude,
      submitGpsLon: geolocation.position?.longitude,
      localId: crypto.randomUUID(),
      isSynced: false,
      localCreatedAt: new Date().toISOString()
    };

    if (fotoFile) {
      record.fileBlob = await fotoFile.arrayBuffer().then((buffer) => new Blob([buffer], { type: fotoFile.type }));
    }

    await addToQueue(record);
    setSubmitStatus("offline");
    setSubmitMessage("Verrà sincronizzato automaticamente quando tornerai online");
    resetForm();
  };

  const handleCloseModal = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
  }, []);

  const handleNewRilevamento = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
    // Il form è già resettato, scrolliamo in cima
    window.scrollTo(0, 0);
  }, []);

  const handleViewRilevamenti = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
    navigate("/miei-rilevamenti");
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
    navigate("/");
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tokens) {
      setSubmitStatus("error");
      setSubmitMessage("Sessione scaduta. Effettua nuovamente il login.");
      return;
    }

    const formData = new FormData();
    formData.append("comuneId", formState.comuneId);
    formData.append("via", formState.via);
    formData.append("numeroCivico", formState.numeroCivico);
    formData.append("tipoLavorazioneId", formState.tipoLavorazioneId);
    formData.append("impresaId", formState.impresaId);
    formData.append("numeroOperai", String(formState.numeroOperai));
    formData.append("gpsLat", String(geolocation.position?.latitude ?? 0));
    formData.append("gpsLon", String(geolocation.position?.longitude ?? 0));
    formData.append("manualLat", manualCoords?.lat ? String(manualCoords.lat) : "");
    formData.append("manualLon", manualCoords?.lon ? String(manualCoords.lon) : "");
    formData.append("rilevamentoDate", date);
    formData.append("rilevamentoTime", time);
    
    // Costruisci le note includendo i mezzi selezionati
    let notesContent = "";
    if (formState.mezzi.length > 0) {
      const mezziLabels = formState.mezzi.map(m => 
        MEZZI_OPTIONS.find(o => o.value === m)?.label ?? m
      ).join(", ");
      notesContent += `Mezzi: ${mezziLabels}`;
    }
    if (formState.notes) {
      notesContent += notesContent ? `\n\n${formState.notes}` : formState.notes;
    }
    if (notesContent) formData.append("notes", notesContent);
    
    if (fotoFile) formData.append("foto", fotoFile);
    
    // Nuovi campi
    if (formState.materialeTubo) formData.append("materialeTubo", formState.materialeTubo);
    if (formState.diametro) formData.append("diametro", formState.diametro);
    if (formState.altriInterventi) formData.append("altriInterventi", formState.altriInterventi);
    
    // Campi nascosti - timestamp e GPS reali
    formData.append("submitTimestamp", new Date().toISOString());
    if (geolocation.position) {
      formData.append("submitGpsLat", String(geolocation.position.latitude));
      formData.append("submitGpsLon", String(geolocation.position.longitude));
    }

    // Mostra il modal di caricamento
    setSubmitStatus("loading");

    try {
      await api.createRilevamento(formData, tokens.accessToken);
      setSubmitStatus("success");
      setSubmitMessage("I dati sono stati salvati correttamente");
      resetForm();
    } catch (error) {
      console.error("Errore invio rilevamento", error);
      // Fallback offline
      await submitOffline();
    }
  };

  return (
    <div className="nuovo-rilevamento">
      <div className="rilevamento-page__header">
        <h1>Nuovo Intervento</h1>
        <div className="rilevamento-page__status-badges">
          <div className="rilevamento-page__gps-status">
            {geolocation.isLoading ? (
              <span className="gps-badge gps-badge--loading">📡 Localizzazione...</span>
            ) : geolocation.error ? (
              <span className="gps-badge gps-badge--error">❌ GPS non disponibile</span>
            ) : (
              <span className="gps-badge gps-badge--ok">✓ GPS attivo</span>
            )}
          </div>
          {!isOnline && referenceData && (
            <span className="gps-badge gps-badge--offline" title="Stai usando dati salvati localmente">
              📴 Offline
            </span>
          )}
        </div>
      </div>

      <SubmitModal
        status={submitStatus}
        message={submitMessage}
        onClose={handleCloseModal}
        onNewRilevamento={handleNewRilevamento}
        onViewRilevamenti={handleViewRilevamenti}
        onGoHome={handleGoHome}
      />

      <LocationPermissionModal
        isOpen={geolocation.showPermissionModal}
        onRequestPermission={geolocation.confirmPermission}
        onSkip={geolocation.skipPermission}
      />

      <form className="rilevamento-form" onSubmit={handleSubmit}>
        {/* SEZIONE 1: LUOGO */}
        <section className="form-card">
          <h2 className="form-card__title">📍 Luogo</h2>
          
          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Comune *</span>
              <select
                name="comuneId"
                value={formState.comuneId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
                className="form-field__input"
              >
                <option value="">Seleziona...</option>
                {referenceData?.comuni.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row form-row--2col">
            <label className="form-field">
              <span className="form-field__label">Via *</span>
              <input
                type="text"
                name="via"
                value={formState.via}
                onChange={handleChange}
                required
                className="form-field__input"
                placeholder="es. Via Roma"
              />
            </label>
            <label className="form-field form-field--small">
              <span className="form-field__label">N° civico</span>
              <input
                type="text"
                name="numeroCivico"
                value={formState.numeroCivico}
                onChange={handleChange}
                className="form-field__input"
                placeholder="123"
              />
            </label>
          </div>

          <div className="form-field">
            <span className="form-field__label">Posizione sulla mappa</span>
            <MapPicker value={manualCoords} onChange={setManualCoords} height="250px" />
          </div>
        </section>

        {/* SEZIONE 2: LAVORO */}
        <section className="form-card">
          <h2 className="form-card__title">🔧 Dettagli lavoro</h2>
          
          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Tipo lavorazione *</span>
              <select
                name="tipoLavorazioneId"
                value={formState.tipoLavorazioneId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
                className="form-field__input"
              >
                <option value="">Seleziona...</option>
                {referenceData?.tipiLavorazione.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row form-row--2col">
            <label className="form-field">
              <span className="form-field__label">Impresa *</span>
              <select
                name="impresaId"
                value={formState.impresaId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
                className="form-field__input"
              >
                <option value="">Seleziona...</option>
                {referenceData?.imprese.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field form-field--small">
              <span className="form-field__label">N° operai</span>
              <input
                type="number"
                name="numeroOperai"
                min={0}
                value={formState.numeroOperai}
                onChange={handleChange}
                className="form-field__input"
              />
            </label>
          </div>

          {/* NUOVI CAMPI */}
          <div className="form-row form-row--2col">
            <label className="form-field">
              <span className="form-field__label">Materiale tubo</span>
              <select
                name="materialeTubo"
                value={formState.materialeTubo}
                onChange={handleChange}
                className="form-field__input"
              >
                {MATERIALI_TUBO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-field__label">Diametro (mm)</span>
              <input
                type="text"
                name="diametro"
                value={formState.diametro}
                onChange={handleChange}
                className="form-field__input"
                placeholder="es. 110"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Interventi precedenti</span>
              <select
                name="altriInterventi"
                value={formState.altriInterventi}
                onChange={handleChange}
                className="form-field__input"
              >
                <option value="">Seleziona...</option>
                <option value="SI">SI - Sono stati effettuati interventi precedenti</option>
                <option value="NO">NO - Primo intervento</option>
              </select>
            </label>
          </div>

          <div className="form-row form-row--2col">
            <label className="form-field">
              <span className="form-field__label">Data</span>
              <input
                type="date"
                name="rilevamentoDate"
                value={date}
                onChange={handleDateChange}
                className="form-field__input"
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Ora</span>
              <input
                type="time"
                name="rilevamentoTime"
                value={time}
                onChange={handleDateChange}
                className="form-field__input"
              />
            </label>
          </div>
        </section>

        {/* SEZIONE: MEZZI */}
        <section className="form-card">
          <h2 className="form-card__title">🚛 Mezzi a disposizione</h2>
          
          <div className="mezzi-grid">
            {MEZZI_OPTIONS.map((mezzo) => (
              <label key={mezzo.value} className="mezzi-checkbox">
                <input
                  type="checkbox"
                  checked={formState.mezzi.includes(mezzo.value)}
                  onChange={() => handleMezziChange(mezzo.value)}
                />
                <span className="mezzi-checkbox__label">{mezzo.label}</span>
              </label>
            ))}
          </div>
          
          {formState.mezzi.length > 0 && (
            <div className="mezzi-selected">
              <strong>Selezionati:</strong> {formState.mezzi.map(m => 
                MEZZI_OPTIONS.find(o => o.value === m)?.label
              ).join(", ")}
            </div>
          )}
        </section>

        {/* SEZIONE 3: FOTO */}
        <section className="form-card">
          <h2 className="form-card__title">📷 Documentazione</h2>
          
          {/* Rimosso capture="environment" per permettere anche la galleria */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="camera-section">
            {fotoPreview ? (
              <div className="photo-preview">
                <img src={fotoPreview} alt="Anteprima foto" className="photo-preview__img" />
                <button type="button" className="photo-preview__remove" onClick={removePhoto}>
                  ✕ Rimuovi
                </button>
              </div>
            ) : (
              <button type="button" className="camera-button" onClick={openCamera}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Aggiungi foto
              </button>
            )}
          </div>

          <label className="form-field">
            <span className="form-field__label">Note aggiuntive</span>
            <textarea
              name="notes"
              value={formState.notes}
              onChange={handleChange}
              rows={3}
              className="form-field__input"
              placeholder="Eventuali osservazioni..."
            />
          </label>
        </section>

        {/* SUBMIT */}
        <button
          type="submit"
          className="submit-button"
          disabled={!canSubmit || submitStatus === "loading"}
        >
          {navigator.onLine ? "Invia intervento" : "Salva offline"}
        </button>
      </form>
    </div>
  );
};

export default NuovoRilevamentoForm;
