import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import OfflineSyncBanner from "../offline/OfflineSyncBanner";

const basePath = import.meta.env.BASE_URL || "/";

const AppLayout = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    void logout();
  };

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  const toggleNav = () => {
    setIsNavOpen((prev) => !prev);
  };

  const displayName = user.fullName?.trim() ? user.fullName : user.email;
  const roleLabels: Record<string, string> = {
    admin: "Amministratore",
    operaio: "Tecnico",
    impresa: "Impresa"
  };
  const readableRole = roleLabels[user.role] ?? "Utente";

  // Costruisci il path del logo usando BASE_URL di Vite
  const logoPath = `${basePath}logo/logo_talete.png`;

  return (
    <div className="app-shell">
      <OfflineSyncBanner />
      <header className={`app-header${isNavOpen ? " is-expanded" : ""}`}>
        <div className="app-header__top">
          <div className="app-header__brand">
            <img src={logoPath} alt="Talete Spa" className="app-brand-logo" />
            <span className="app-subtitle">Gestionale Interventi</span>
          </div>
          <button
            type="button"
            className="app-header__toggle"
            onClick={toggleNav}
            aria-expanded={isNavOpen}
            aria-controls="primary-navigation"
            aria-label={isNavOpen ? "Chiudi il menu di navigazione" : "Apri il menu di navigazione"}
          >
            <span className="app-header__toggle-bar" />
            <span className="app-header__toggle-bar" />
            <span className="app-header__toggle-bar" />
          </button>
        </div>
        <div className={`app-header__collapsible${isNavOpen ? " is-open" : ""}`} id="primary-navigation">
          <nav className="app-header__nav">
            {user.role === "operaio" && (
              <>
                <NavLink to="/" end className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  Home
                </NavLink>
                <NavLink to="/nuovo" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  Nuovo
                </NavLink>
                <NavLink to="/miei-rilevamenti" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  I miei
                </NavLink>
                <NavLink to="/profilo" className={({ isActive }) => `top-nav-link top-nav-link--mobile-only${isActive ? " active" : ""}`}>
                  Profilo
                </NavLink>
              </>
            )}
            {user.role === "impresa" && (
              <>
                <NavLink to="/" end className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  Home
                </NavLink>
                <NavLink to="/nuovo-impresa" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  Nuovo
                </NavLink>
                <NavLink to="/miei-rilevamenti" className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
                  I miei
                </NavLink>
                <NavLink to="/profilo" className={({ isActive }) => `top-nav-link top-nav-link--mobile-only${isActive ? " active" : ""}`}>
                  Profilo
                </NavLink>
              </>
            )}
            {user.role === "admin" && (
              <>
                <NavLink
                  to="/admin/panoramica"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/rilevamenti"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Interventi
                </NavLink>
                <NavLink
                  to="/admin/utenti"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Utenti
                </NavLink>
                <NavLink
                  to="/admin/comuni"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Comuni
                </NavLink>
                <NavLink
                  to="/admin/imprese"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Imprese
                </NavLink>
                <NavLink
                  to="/profilo"
                  className={({ isActive }) => `top-nav-link top-nav-link--mobile-only${isActive ? " active" : ""}`}
                >
                  Profilo
                </NavLink>
              </>
            )}

            {user.role === "responsabile" && (
              <>
                <NavLink
                  to="/admin/panoramica"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/admin/rilevamenti"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Interventi
                </NavLink>
                <NavLink
                  to="/profilo"
                  className={({ isActive }) => `top-nav-link top-nav-link--mobile-only${isActive ? " active" : ""}`}
                >
                  Profilo
                </NavLink>
              </>
            )}
          </nav>
          <div className="app-header__user">
            <NavLink to="/profilo" className="app-header__profile-link" title="Il mio profilo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </NavLink>
            <div className="app-header__user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{readableRole}</span>
            </div>
            <button type="button" className="button button--ghost" onClick={handleLogout}>
              Esci
            </button>
          </div>
        </div>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="app-footer__content">
          <span className="app-footer__copyright">© {new Date().getFullYear()} Talete Spa</span>
          <span className="app-footer__separator">•</span>
          <span className="app-footer__version">v0.1.2</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
