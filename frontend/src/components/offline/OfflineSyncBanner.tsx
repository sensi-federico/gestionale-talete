import { useEffect, useState } from "react";

const OfflineSyncBanner = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#f76707",
        color: "#fff",
        padding: "0.5rem 1rem",
        textAlign: "center",
        fontWeight: 600
      }}
    >
      Modalità offline attiva. I dati verranno sincronizzati appena possibile.
    </div>
  );
};

export default OfflineSyncBanner;
