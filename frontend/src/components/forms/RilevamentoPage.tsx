import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useOfflineQueue } from "../../hooks/useOfflineQueue";
import { useGeolocation } from "../../hooks/useGeolocation";
import Map3D from "../map/Map3D";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: referenceData, isLoading: isLoadingReference } = useQuery({
    queryKey: ["reference-data"],
    queryFn: () => {
      if (!tokens) {
        throw new Error("Token mancante");
      }
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
      setFormState((prev: FormState) => ({ ...prev, numeroOperai: Number(value) }));
    } else {
      setFormState((prev: FormState) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateTime((prev: { date: string; time: string }) => ({
      ...prev,
      [name === "rilevamentoDate" ? "date" : "time"]: value
    }));
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
    setFotoFile(null);
    setDateTime(formatDateTime());
  };

  const submitOffline = async () => {
    if (!user) {
      throw new Error("Utente non autenticato");
    }

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
      record.fileBlob = await fotoFile.arrayBuffer().then((buffer: ArrayBuffer) => new Blob([buffer], { type: fotoFile.type }));
    }

    await addToQueue(record);
    setStatusMessage("Rilevamento salvato offline. Verrà sincronizzato appena possibile.");
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!tokens) {
      setStatusMessage("Sessione non valida. Effettuare nuovamente il login.");
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
    if (formState.notes) {
      formData.append("notes", formState.notes);
    }
    if (fotoFile) {
      formData.append("foto", fotoFile);
    }

    setIsSubmitting(true);

    try {
      await api.createRilevamento(formData, tokens.accessToken);
      setStatusMessage("Rilevamento inviato con successo.");
      resetForm();
    } catch (error) {
      console.error("Errore invio rilevamento", error);
      await submitOffline();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container">
      <section className="form-section">
        <header className="section-header">
          <div>
            <h1>Nuovo rilevamento</h1>
            <p>Compila il form anche offline, sincronizzeremo noi i dati.</p>
          </div>
          <div className="status">
            {geolocation.isLoading ? "Localizzazione..." : geolocation.error ? geolocation.error : `📍 ${geolocation.position?.latitude?.toFixed(4) ?? "-"}, ${geolocation.position?.longitude?.toFixed(4) ?? "-"}`}
          </div>
        </header>
        <form className="rilevamento-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Comune
              <select
                name="comuneId"
                value={formState.comuneId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
              >
                <option value="">Seleziona comune</option>
                {referenceData?.comuni.map((comune) => (
                  <option key={comune.id} value={comune.id}>
                    {comune.name} ({comune.province})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Via
              <input name="via" value={formState.via} onChange={handleChange} required />
            </label>
            <label>
              Numero civico
              <input name="numeroCivico" value={formState.numeroCivico} onChange={handleChange} required />
            </label>
            <label>
              Tipo lavorazione
              <select
                name="tipoLavorazioneId"
                value={formState.tipoLavorazioneId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
              >
                <option value="">Seleziona tipologia</option>
                {referenceData?.tipiLavorazione.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Impresa
              <select
                name="impresaId"
                value={formState.impresaId}
                onChange={handleChange}
                required
                disabled={isLoadingReference}
              >
                <option value="">Seleziona impresa</option>
                {referenceData?.imprese.map((impresa) => (
                  <option key={impresa.id} value={impresa.id}>
                    {impresa.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Numero operai
              <input
                type="number"
                min={0}
                name="numeroOperai"
                value={formState.numeroOperai}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Data
              <input type="date" name="rilevamentoDate" value={date} onChange={handleDateChange} />
            </label>
            <label>
              Ora
              <input type="time" name="rilevamentoTime" value={time} onChange={handleDateChange} />
            </label>
          </div>
          <label>
            Note
            <textarea name="notes" rows={3} value={formState.notes} onChange={handleChange} />
          </label>
          <label className="file-upload">
            Foto (opzionale)
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0] ?? null;
                setFotoFile(file);
              }}
            />
          </label>
          <div className="map-wrapper">
            <div className="map-header">
              <h2>Coordinate manuali</h2>
              <span>{manualCoords ? `${manualCoords.lat.toFixed(5)}, ${manualCoords.lon.toFixed(5)}` : "Seleziona un punto"}</span>
            </div>
            <Map3D value={manualCoords} onChange={setManualCoords} />
          </div>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
          <button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Invio..." : navigator.onLine ? "Invia rilevamento" : "Salva offline"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default RilevamentoPage;
