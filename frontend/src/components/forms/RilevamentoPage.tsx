import { ChangeEvent, FormEvent, useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useOfflineQueue } from "../../hooks/useOfflineQueue";
import { useGeolocation } from "../../hooks/useGeolocation";
import MapPicker from "../map/MapPicker";
import { api } from "../../services/api";
import { OfflineRilevamento } from "@shared/types";

const formatDateTime = () => {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].slice(0, 5);
  return { date, time };
};

type FormState = {
  comuneId: string;
  via: string;
  numeroCivico: string;
  tipoLavorazioneId: string;
  impresaId: string;
  numeroOperai: number;
  notes: string;
};

const RilevamentoPage = () => {
  const { tokens, user } = useAuthStore();
  const { addToQueue } = useOfflineQueue();
  const geolocation = useGeolocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ date, time }, setDateTime] = useState(() => formatDateTime());
  const [formState, setFormState] = useState<FormState>({
    comuneId: "",
    via: "",
    numeroCivico: "",
    tipoLavorazioneId: "",
    impresaId: "",
    numeroOperai: 1,
    notes: ""
  });
  const [manualCoords, setManualCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: referenceData, isLoading: isLoadingReference } = useQuery({
    queryKey: ["reference-data"],
    queryFn: () => {
      if (!tokens) throw new Error("Token mancante");
      return api.fetchReferenceData(tokens.accessToken);
    },
    enabled: Boolean(tokens)
  });

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
      notes: ""
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
      localId: crypto.randomUUID(),
      isSynced: false,
      localCreatedAt: new Date().toISOString()
    };

    if (fotoFile) {
      record.fileBlob = await fotoFile.arrayBuffer().then((buffer) => new Blob([buffer], { type: fotoFile.type }));
    }

    await addToQueue(record);
    setStatusMessage({ type: "info", text: "Salvato offline. Verrà sincronizzato automaticamente." });
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!tokens) {
      setStatusMessage({ type: "error", text: "Sessione scaduta. Effettua nuovamente il login." });
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
    if (formState.notes) formData.append("notes", formState.notes);
    if (fotoFile) formData.append("foto", fotoFile);

    setIsSubmitting(true);

    try {
      await api.createRilevamento(formData, tokens.accessToken);
      setStatusMessage({ type: "success", text: "Rilevamento inviato con successo!" });
      resetForm();
    } catch (error) {
      console.error("Errore invio rilevamento", error);
      await submitOffline();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="rilevamento-page">
      <div className="rilevamento-page__header">
        <h1>Nuovo Rilevamento</h1>
        <div className="rilevamento-page__gps-status">
          {geolocation.isLoading ? (
            <span className="gps-badge gps-badge--loading">📡 Localizzazione...</span>
          ) : geolocation.error ? (
            <span className="gps-badge gps-badge--error">❌ GPS non disponibile</span>
          ) : (
            <span className="gps-badge gps-badge--ok">
              ✓ GPS attivo
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`rilevamento-alert rilevamento-alert--${statusMessage.type}`}>
          {statusMessage.type === "success" && "✓ "}
          {statusMessage.type === "error" && "✕ "}
          {statusMessage.type === "info" && "ℹ "}
          {statusMessage.text}
        </div>
      )}

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
                  <option key={c.id} value={c.id}>{c.name} ({c.province})</option>
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

        {/* SEZIONE 3: FOTO */}
        <section className="form-card">
          <h2 className="form-card__title">📷 Documentazione</h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

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
              Scatta foto
            </button>
          )}

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
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="submit-button__spinner" />
              Invio in corso...
            </>
          ) : navigator.onLine ? (
            "Invia rilevamento"
          ) : (
            "Salva offline"
          )}
        </button>
      </form>
    </main>
  );
};

export default RilevamentoPage;
