import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const LoginForm = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.login(email, password);
      setSession(response.user, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      });

      navigate(response.user.role === "admin" ? "/admin/panoramica" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore inatteso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-panel__info">
          <img src="/logo/logo_talete.png" alt="Talete Spa" className="auth-panel__logo" />
          <h1>Benvenuto in Talete Spa</h1>
          <p>
            Accedi per coordinare squadre, monitorare i rilevamenti e mantenere il territorio
            sotto controllo.
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__heading">
            <h2>Area riservata</h2>
            <span>Inserisci le tue credenziali aziendali</span>
          </div>
          <label>
            Email aziendale
            <input
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="nome.cognome@talete.it"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="button button--primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
