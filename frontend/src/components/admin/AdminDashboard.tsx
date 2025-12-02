import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import AdminStatusBanner from "./AdminStatusBanner";
import AdminActivityLog from "./AdminActivityLog";
import Pagination from "../ui/Pagination";

interface AdminComune {
  id: string;
  name: string;
  province: string;
  region: string;
}

interface AdminImpresa {
  id: string;
  name: string;
  partita_iva: string;
}

interface AdminRilevamento {
  id: string;
  comune?: { name: string } | null;
  impresa?: { name: string } | null;
  tipo?: { name: string } | null;
  via: string;
  numero_civico: string;
  numero_operai: number;
  rilevamento_date: string;
  rilevamento_time: string;
  sync_status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const ITEMS_PER_PAGE = 10;

const formatNumber = (value: number) => new Intl.NumberFormat("it-IT").format(value);

const AdminDashboard = () => {
  const { tokens } = useAuthStore();
  const { alerts, latestAlert, pushAlert } = useAdminAlerts();
  const healthStatusRef = useRef<"idle" | "success" | "error">("idle");
  const [currentPage, setCurrentPage] = useState(1);

  const adminFetch = async <T,>(path: string) => {
    if (!tokens) {
      throw new Error("Token mancante");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Richiesta fallita");
    }

    return (await response.json()) as T;
  };

  const healthQuery = useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Backend non raggiungibile");
      }
      return (await response.json()) as { status: string; timestamp: string };
    },
    refetchInterval: 30_000
  });

  useEffect(() => {
    if (healthQuery.status === "success" && healthStatusRef.current !== "success") {
      healthStatusRef.current = "success";
      pushAlert({
        type: "success",
        title: "Backend online",
        description: "Connessione con il server stabilita correttamente"
      });
    }

    if (healthQuery.status === "error" && healthStatusRef.current !== "error") {
      healthStatusRef.current = "error";
      const message = healthQuery.error instanceof Error ? healthQuery.error.message : "Errore";
      pushAlert({
        type: "error",
        title: "Backend non raggiungibile",
        description: message
      });
    }
  }, [healthQuery.status, healthQuery.error, pushAlert]);

  const { data: rilevamentiData } = useQuery<{ rilevamenti: AdminRilevamento[] }>({
    queryKey: ["admin", "rilevamenti"],
    queryFn: () => adminFetch<{ rilevamenti: AdminRilevamento[] }>("/admin/rilevamenti"),
    enabled: Boolean(tokens)
  });

  const { data: comuniData } = useQuery<{ comuni: AdminComune[] }>({
    queryKey: ["admin", "comuni"],
    queryFn: () => adminFetch<{ comuni: AdminComune[] }>("/admin/comuni"),
    enabled: Boolean(tokens)
  });

  const { data: impreseData } = useQuery<{ imprese: AdminImpresa[] }>({
    queryKey: ["admin", "imprese"],
    queryFn: () => adminFetch<{ imprese: AdminImpresa[] }>("/admin/imprese"),
    enabled: Boolean(tokens)
  });

  const stats = useMemo(() => {
    const records = rilevamentiData?.rilevamenti ?? [];
    const total = records.length;
    const synced = records.filter((row) => row.sync_status === "synced").length;
    const pending = total - synced;
    const syncRate = total ? Math.round((synced / total) * 100) : 0;
    const comuniCoinvolti = new Set(
      records
        .map((row) => row.comune?.name)
        .filter((name): name is string => Boolean(name))
    ).size;
    const impreseCoinvolte = new Set(
      records
        .map((row) => row.impresa?.name)
        .filter((name): name is string => Boolean(name))
    ).size;

    return {
      total,
      synced,
      pending,
      syncRate,
      comuniCoinvolti,
      impreseCoinvolte
    };
  }, [rilevamentiData]);

  const rilevamenti = rilevamentiData?.rilevamenti ?? [];
  const totalPages = Math.ceil(rilevamenti.length / ITEMS_PER_PAGE);
  const paginatedRilevamenti = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rilevamenti.slice(start, start + ITEMS_PER_PAGE);
  }, [rilevamenti, currentPage]);

  const comuneCount = comuniData?.comuni.length ?? 0;
  const impresaCount = impreseData?.imprese.length ?? 0;
  const comuniGestiti = stats.comuniCoinvolti || comuneCount;
  const impreseAttive = stats.impreseCoinvolte || impresaCount;

  const copyTable = async () => {
    try {
      if (!rilevamentiData?.rilevamenti) {
        pushAlert({
          type: "info",
          title: "Nessun rilevamento",
          description: "Non sono presenti dati da esportare"
        });
        return;
      }

      const headers = [
        "ID",
        "Comune",
        "Impresa",
        "Tipo",
        "Via",
        "Civico",
        "Operai",
        "Data",
        "Ora",
        "Stato"
      ];
      const rows = rilevamentiData.rilevamenti.map((row) => [
        row.id,
        row.comune?.name ?? "",
        row.impresa?.name ?? "",
        row.tipo?.name ?? "",
        row.via,
        row.numero_civico,
        row.numero_operai,
        row.rilevamento_date,
        row.rilevamento_time,
        row.sync_status
      ]);

      const csv = [headers, ...rows]
        .map((line) => line.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      await navigator.clipboard.writeText(csv);
      pushAlert({
        type: "success",
        title: "Esportazione completata",
        description: "Tabella copiata negli appunti in formato CSV"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore";
      pushAlert({
        type: "error",
        title: "Esportazione fallita",
        description: message
      });
    }
  };

  return (
    <div className="page-container admin-dashboard">
      <header className="page-heading">
        <div>
          <h1>Panoramica amministratore</h1>
          <p>Monitora lo stato degli interventi e delle anagrafiche condivise.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="button button--secondary" onClick={copyTable}>
            Copia CSV
          </button>
        </div>
      </header>

      <AdminStatusBanner alert={latestAlert} />

      <section className="stats-grid">
        <article className="card stat-card">
          <span className="stat-label">Interventi totali</span>
          <span className="stat-value">{formatNumber(stats.total)}</span>
          <span className="stat-meta">Sincronizzati: {formatNumber(stats.synced)}</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Sincronizzazione</span>
          <span className="stat-value">{stats.syncRate}%</span>
          <span
            className={`stat-chip ${
              stats.syncRate >= 85 ? "stat-chip--positive" : "stat-chip--warning"
            }`}
          >
            In attesa: {formatNumber(stats.pending)}
          </span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Comuni gestiti</span>
          <span className="stat-value">{formatNumber(comuniGestiti)}</span>
          <span className="stat-meta">In elenco: {formatNumber(comuneCount)}</span>
        </article>
        <article className="card stat-card">
          <span className="stat-label">Imprese partner</span>
          <span className="stat-value">{formatNumber(impreseAttive)}</span>
          <span className="stat-meta">Registrate: {formatNumber(impresaCount)}</span>
        </article>
      </section>

      <section className="card card--table">
        <div className="table-header">
          <div>
            <h2>Interventi</h2>
            <p>Panoramica degli interventi e del relativo stato di sincronizzazione.</p>
          </div>
          <button type="button" className="button button--ghost" onClick={copyTable}>
            Copia tabella
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Comune</th>
                <th>Impresa</th>
                <th>Tipo</th>
                <th>Via</th>
                <th>Civico</th>
                <th>Operai</th>
                <th>Data</th>
                <th>Ora</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRilevamenti.map((row) => (
                <tr key={row.id}>
                  <td data-label="Comune">{row.comune?.name ?? ""}</td>
                  <td data-label="Impresa">{row.impresa?.name ?? ""}</td>
                  <td data-label="Tipo">{row.tipo?.name ?? ""}</td>
                  <td data-label="Via">{row.via}</td>
                  <td data-label="Civico">{row.numero_civico}</td>
                  <td data-label="Operai">{row.numero_operai}</td>
                  <td data-label="Data">{row.rilevamento_date}</td>
                  <td data-label="Ora">{row.rilevamento_time}</td>
                  <td data-label="Stato">
                    <span className={`status-pill status-pill--${row.sync_status}`}>
                      {row.sync_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={rilevamenti.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </section>

      <section className="card card--info">
        <h2>Risorse</h2>
        <div className="info-grid">
          <div className="info-tile">
            <span className="info-label">Comuni caricati</span>
            <span className="info-value">{formatNumber(comuneCount)}</span>
          </div>
          <div className="info-tile">
            <span className="info-label">Imprese registrate</span>
            <span className="info-value">{formatNumber(impresaCount)}</span>
          </div>
          <div className="info-tile">
            <span className="info-label">Sync completati</span>
            <span className="info-value">{formatNumber(stats.synced)}</span>
          </div>
          <div className="info-tile">
            <span className="info-label">In attesa</span>
            <span className="info-value">{formatNumber(stats.pending)}</span>
          </div>
        </div>
      </section>

      <section className="card card--log">
        <div className="card-heading">
          <h2>Registro attività</h2>
          <p>Ultimi eventi e notifiche lato amministrazione.</p>
        </div>
        <AdminActivityLog alerts={alerts} />
      </section>
    </div>
  );
};

export default AdminDashboard;
