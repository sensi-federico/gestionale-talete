import { useState, FormEvent } from "react";
import { useAuthStore } from "../../store/authStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const ProfilePage = () => {
  const { user, tokens, setSession } = useAuthStore();
  
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!tokens) {
      setMessage({ type: "error", text: "Sessione scaduta. Effettua nuovamente il login." });
      return;
    }
    
    // Validazione password
    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setMessage({ type: "error", text: "Inserisci la password corrente" });
        return;
      }
      if (newPassword.length < 8) {
        setMessage({ type: "error", text: "La nuova password deve essere di almeno 8 caratteri" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "Le password non corrispondono" });
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const body: { fullName?: string; currentPassword?: string; newPassword?: string } = {};
      
      if (fullName !== user?.fullName) {
        body.fullName = fullName;
      }
      
      if (showPasswordSection && newPassword && currentPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      
      // Se non c'è nulla da aggiornare
      if (Object.keys(body).length === 0) {
        setMessage({ type: "error", text: "Nessuna modifica da salvare" });
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Errore durante l'aggiornamento");
      }
      
      const data = await response.json();
      
      // Aggiorna lo store con i nuovi dati
      setSession(
        { ...user!, fullName: data.profile.fullName },
        tokens
      );
      
      setMessage({ type: "success", text: "Profilo aggiornato con successo!" });
      
      // Reset campi password
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabel = user?.role === "admin" ? "Amministratore" : user?.role === "impresa" ? "Impresa" : user?.role === "responsabile" ? "Responsabile" : "Tecnico";

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1>Il mio profilo</h1>
        <span className="profile-page__role">{roleLabel}</span>
      </div>
      
      {message && (
        <div className={`profile-message profile-message--${message.type}`}>
          {message.type === "success" ? "✓" : "⚠"} {message.text}
        </div>
      )}
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <section className="profile-section">
          <h2 className="profile-section__title">Informazioni personali</h2>
          
          <div className="profile-field">
            <label className="profile-field__label">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="profile-field__input profile-field__input--disabled"
            />
            <span className="profile-field__hint">L'email non può essere modificata</span>
          </div>
          
          <div className="profile-field">
            <label className="profile-field__label">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="profile-field__input"
              placeholder="Il tuo nome"
            />
          </div>
        </section>
        
        <section className="profile-section">
          <div className="profile-section__header">
            <h2 className="profile-section__title">Sicurezza</h2>
            {!showPasswordSection && (
              <button
                type="button"
                className="profile-section__toggle"
                onClick={() => setShowPasswordSection(true)}
              >
                Cambia password
              </button>
            )}
          </div>
          
          {showPasswordSection && (
            <div className="profile-password-fields">
              <div className="profile-field">
                <label className="profile-field__label">Password corrente</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="profile-field__input"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="profile-field">
                <label className="profile-field__label">Nuova password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="profile-field__input"
                  placeholder="Minimo 8 caratteri"
                />
              </div>
              
              <div className="profile-field">
                <label className="profile-field__label">Conferma nuova password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="profile-field__input"
                  placeholder="Ripeti la nuova password"
                />
              </div>
              
              <button
                type="button"
                className="profile-cancel-password"
                onClick={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Annulla cambio password
              </button>
            </div>
          )}
        </section>
        
        <button
          type="submit"
          className="profile-submit"
          disabled={isLoading}
        >
          {isLoading ? "Salvataggio..." : "Salva modifiche"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
