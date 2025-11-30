import { AdminAlert } from "../../hooks/useAdminAlerts";

interface AdminActivityLogProps {
  alerts: AdminAlert[];
  limit?: number;
}

const AdminActivityLog = ({ alerts, limit = 8 }: AdminActivityLogProps) => (
  <ul className="activity-feed">
    {alerts.length === 0 && (
      <li className="activity-item activity-item--empty">Nessuna attività recente.</li>
    )}
    {alerts.slice(0, limit).map((entry) => (
      <li key={entry.id} className="activity-item">
        <div className="activity-item__meta">
          <span className={`badge badge--${entry.type}`}>{entry.type}</span>
          <time dateTime={entry.isoTimestamp}>
            {new Date(entry.isoTimestamp).toLocaleString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit"
            })}
          </time>
        </div>
        <div className="activity-item__body">
          <span className="activity-item__title">{entry.title}</span>
          {entry.description && (
            <span className="activity-item__description">{entry.description}</span>
          )}
        </div>
      </li>
    ))}
  </ul>
);

export default AdminActivityLog;
