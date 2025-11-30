import { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { UserRole } from "@shared/types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactElement;
}

const ProtectedRoute = ({
  allowedRoles,
  redirectTo = "/login",
  fallback
}: ProtectedRouteProps) => {
  const { user, isRestoring } = useAuthStore();

  if (isRestoring) {
    return fallback ?? <div>Caricamento sessione...</div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
