import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useLogout } from "../../hooks/useLogout";
import OfflineSyncBanner from "../offline/OfflineSyncBanner";

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
  const readableRole = user.role === "admin" ? "Amministratore" : "Operaio";

  return (
    <div className="app-shell">
      <OfflineSyncBanner />
      <header className={`app-header${isNavOpen ? " is-expanded" : ""}`}>
        <div className="app-header__top">
          <div className="app-header__brand">
            <img src="/logo/logo_talete.png" alt="Talete Spa" className="app-brand-logo" />
            <div className="app-header__brand-text">
              <span className="app-logo">Talete Spa</span>
              <span className="app-subtitle">Gestionale Rilevamenti</span>
            </div>
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
            <NavLink to="/" end className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}>
              Rilevamenti
            </NavLink>
            {user.role === "admin" && (
              <>
                <NavLink
                  to="/admin/panoramica"
                  className={({ isActive }) => `top-nav-link${isActive ? " active" : ""}`}
                >
                  Dashboard
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
              </>
            )}
          </nav>
          <div className="app-header__user">
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
    </div>
  );
};

export default AppLayout;
