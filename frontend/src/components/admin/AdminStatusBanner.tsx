import { AdminAlert } from "../../hooks/useAdminAlerts";

interface AdminStatusBannerProps {
  alert?: AdminAlert;
  fallbackVariant?: AdminAlert["type"];
}

const AdminStatusBanner = ({ alert, fallbackVariant = "info" }: AdminStatusBannerProps) => {
  if (!alert) {
    return null;
  }

  const variant = alert.type ?? fallbackVariant;

  return (
    <div className={`status-banner status-banner--${variant}`}>
      <div className="status-banner__content">
        <span className="status-banner__title">{alert.title}</span>
        {alert.description && (
          <span className="status-banner__description">{alert.description}</span>
        )}
      </div>
      <time className="status-banner__time" dateTime={alert.isoTimestamp}>
        {new Date(alert.isoTimestamp).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </time>
    </div>
  );
};

export default AdminStatusBanner;
