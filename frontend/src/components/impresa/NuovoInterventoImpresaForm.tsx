import { ChangeEvent, FormEvent, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useReferenceData } from "../../hooks/useOfflineCache";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useOfflineQueue } from "../../hooks/useOfflineQueue";
import MapPicker from "../map/MapPicker";
import SubmitModal, { SubmitStatus } from "../ui/SubmitModal";
import LocationPermissionModal from "../ui/LocationPermissionModal";
import { api } from "../../services/api";
import { OfflineRilevamento } from "@shared/types";

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
  numeroOperai: number;
  mezzi: string[];
  oraInizio: string;
  oraFine: string;
  notes: string;
};

const NuovoInterventoImpresaForm = () => {
  const navigate = useNavigate();
  const { tokens, user } = useAuthStore();
  const geolocation = useGeolocation(true);
  const { addToQueue } = useOfflineQueue();
  const [{ date }, setDateTime] = useState(() => formatDateTime());
  const [manualCoords, setManualCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [formState, setFormState] = useState<FormState>({
    comuneId: "",
    via: "",
    numeroCivico: "",
    tipoLavorazioneId: "",
    numeroOperai: 1,
    mezzi: [],
    oraInizio: "08:00",
    oraFine: "17:00",
    notes: ""
  });
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");

  const { data: referenceData, isLoading: isLoadingReference } = useReferenceData();

  const canSubmit = useMemo(() => {
    return (
      Boolean(formState.comuneId) &&
      Boolean(formState.tipoLavorazioneId) &&
      Boolean(formState.via) &&
      formState.mezzi.length > 0
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
    const { value } = event.target;
    setDateTime({ date: value, time: "" });
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

  const handleCloseModal = useCallback(() => {
    setSubmitStatus("idle");
    setSubmitMessage("");
  }, []);

  const handleNewIntervento = useCallback(() => {
    setSubmitStatus("idle");
    setFormState({
      comuneId: "",
      via: "",
      numeroCivico: "",
      tipoLavorazioneId: "",
      numeroOperai: 1,
      mezzi: [],
      oraInizio: "08:00",
      oraFine: "17:00",
      notes: ""
    });
    setDateTime(formatDateTime());
  }, []);

  const handleViewInterventi = useCallback(() => {
    setSubmitStatus("idle");
    navigate("/miei-rilevamenti");
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    setSubmitStatus("idle");
    navigate("/");
  }, [navigate]);

  const submitOffline = async () => {
    if (!user) throw new Error("Utente non autenticato");

    const extraInfo = `Mezzi: ${formState.mezzi.join(", ")}\nOra fine: ${formState.oraFine}`;
    const notes = formState.notes ? `${extraInfo}\n\n${formState.notes}` : extraInfo;

    const record: OfflineRilevamento = {
      comuneId: formState.comuneId,
      via: formState.via,
      numeroCivico: formState.numeroCivico || undefined,
      tipoLavorazioneId: formState.tipoLavorazioneId,
      impresaId: user.impresaId || undefined,
      numeroOperai: formState.numeroOperai,
      fotoUrl: undefined,
      gpsLat: manualCoords?.lat ?? geolocation.position?.latitude ?? 0,
      gpsLon: manualCoords?.lon ?? geolocation.position?.longitude ?? 0,
      manualLat: manualCoords?.lat ?? null,
      manualLon: manualCoords?.lon ?? null,
      rilevamentoDate: date,
      rilevamentoTime: formState.oraInizio,
      notes,
      submitTimestamp: new Date().toISOString(),
      submitGpsLat: geolocation.position?.latitude,
      submitGpsLon: geolocation.position?.longitude,
      localId: crypto.randomUUID(),
      isSynced: false,
      localCreatedAt: new Date().toISOString()
    };

    await addToQueue(record);
    setSubmitStatus("offline");
    setSubmitMessage("Salvato! Verrà sincronizzato automaticamente");
    handleNewIntervento();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !tokens || !user) return;

    setSubmitStatus("loading");

    try {
      const formData = new FormData();
      formData.append("comuneId", formState.comuneId);
      formData.append("via", formState.via);
      formData.append("numeroCivico", formState.numeroCivico);
      formData.append("tipoLavorazioneId", formState.tipoLavorazioneId);
      // L'impresaId viene preso dal token dell'utente sul backend
      formData.append("impresaId", user.impresaId ?? "");
      formData.append("numeroOperai", String(formState.numeroOperai));
      // GPS - usa coordinate manuali o geolocalizzazione
      const lat = manualCoords?.lat ?? geolocation.position?.latitude ?? 0;
      const lon = manualCoords?.lon ?? geolocation.position?.longitude ?? 0;
      formData.append("gpsLat", String(lat));
      formData.append("gpsLon", String(lon));
      if (manualCoords) {
        formData.append("manualLat", String(manualCoords.lat));
        formData.append("manualLon", String(manualCoords.lon));
      }
      formData.append("rilevamentoDate", date);
      formData.append("rilevamentoTime", formState.oraInizio);
      // Salva mezzi e ora fine nelle note
      const extraInfo = `Mezzi: ${formState.mezzi.join(", ")}\nOra fine: ${formState.oraFine}`;
      formData.append("notes", formState.notes ? `${extraInfo}\n\n${formState.notes}` : extraInfo);

      await api.createRilevamento(formData, tokens.accessToken);
      setSubmitStatus("success");
      setSubmitMessage("L'intervento è stato registrato correttamente");
      handleNewIntervento();
    } catch (error) {
      console.error("Errore invio intervento", error);
      // Fallback offline
      await submitOffline();
    }
  };

  return (
    <div className="nuovo-rilevamento">
      <div className="rilevamento-page__header">
        <h1>Nuovo Intervento Impresa</h1>
      </div>

      <SubmitModal
        status={submitStatus}
        message={submitMessage}
        onClose={handleCloseModal}
        onNewRilevamento={handleNewIntervento}
        onViewRilevamenti={handleViewInterventi}
        onGoHome={handleGoHome}
      />

      <LocationPermissionModal
        isOpen={geolocation.showPermissionModal}
        onRequestPermission={geolocation.confirmPermission}
        onSkip={geolocation.skipPermission}
      />

      <form className="rilevamento-form" onSubmit={handleSubmit}>
        {/* SEZIONE 1: DATA E ORARI */}
        <section className="form-card">
          <h2 className="form-card__title">📅 Data e Orari</h2>
          
          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Data intervento *</span>
              <input
                type="date"
                name="interventoDate"
                value={date}
                onChange={handleDateChange}
                required
              />
            </label>
          </div>
          
          <div className="form-row form-row--2cols">
            <label className="form-field">
              <span className="form-field__label">Ora inizio *</span>
              <input
                type="time"
                name="oraInizio"
                value={formState.oraInizio}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Ora fine *</span>
              <input
                type="time"
                name="oraFine"
                value={formState.oraFine}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        </section>

        {/* SEZIONE 2: LUOGO */}
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
              >
                <option value="">Seleziona comune...</option>
                {referenceData?.comuni.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.province})
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="form-row form-row--2cols">
            <label className="form-field form-field--wide">
              <span className="form-field__label">Via *</span>
              <input
                type="text"
                name="via"
                placeholder="Es. Via Roma"
                value={formState.via}
                onChange={handleChange}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">N. Civico</span>
              <input
                type="text"
                name="numeroCivico"
                placeholder="Es. 42"
                value={formState.numeroCivico}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        {/* SEZIONE: POSIZIONE */}
        <section className="form-card">
          <h2 className="form-card__title">📍 Posizione su mappa</h2>
          <p className="form-card__description">
            {geolocation.isLoading
              ? "Rilevamento posizione..."
              : geolocation.error
              ? `Errore GPS: ${geolocation.error}. Puoi selezionare manualmente.`
              : "Tocca la mappa per selezionare la posizione esatta dell'intervento."}
          </p>
          <MapPicker
            value={manualCoords ?? (geolocation.position ? { lat: geolocation.position.latitude, lon: geolocation.position.longitude } : null)}
            onChange={(coords: { lat: number; lon: number }) => setManualCoords(coords)}
          />
          {manualCoords && (
            <p className="form-card__coords">
              📍 Coordinate selezionate: {manualCoords.lat.toFixed(6)}, {manualCoords.lon.toFixed(6)}
            </p>
          )}
        </section>

        {/* SEZIONE 3: LAVORAZIONE */}
        <section className="form-card">
          <h2 className="form-card__title">🔧 Lavorazione</h2>
          
          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Tipo lavorazione *</span>
              <select
                name="tipoLavorazioneId"
                value={formState.tipoLavorazioneId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
              >
                <option value="">Seleziona tipo...</option>
                {referenceData?.tipiLavorazione.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="form-row">
            <label className="form-field">
              <span className="form-field__label">Numero operai</span>
              <input
                type="number"
                name="numeroOperai"
                min={1}
                max={50}
                value={formState.numeroOperai}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        {/* SEZIONE 4: MEZZI */}
        <section className="form-card">
          <h2 className="form-card__title">🚛 Mezzi a disposizione *</h2>
          
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

        {/* SEZIONE 5: NOTE */}
        <section className="form-card">
          <h2 className="form-card__title">📝 Note aggiuntive</h2>
          
          <div className="form-row">
            <label className="form-field">
              <textarea
                name="notes"
                placeholder="Eventuali note o osservazioni..."
                value={formState.notes}
                onChange={handleChange}
                rows={3}
              />
            </label>
          </div>
        </section>

        {/* SUBMIT */}
        <button
          type="submit"
          className="submit-button"
          disabled={!canSubmit || submitStatus === "loading"}
        >
          Registra intervento
        </button>
      </form>
    </div>
  );
};

export default NuovoInterventoImpresaForm;
