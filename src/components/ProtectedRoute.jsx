import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const routeFromOnboarding = (onboarding) => {
  if (!onboarding) return null;
  if (onboarding.next_step === 'onboarding_profile' || onboarding.next_step === 'budget_allocation') {
    return '/onboarding';
  }
  return null;
};

export function ProtectedRoute({ children }) {
  const { user, onboarding, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const onboardingRoute = routeFromOnboarding(onboarding);
  if (onboardingRoute && location.pathname !== '/onboarding') {
    return <Navigate to={onboardingRoute} replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { user, onboarding, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    const savedRedirect = sessionStorage.getItem('postAuthRedirect');
    const redirectTo = savedRedirect || routeFromOnboarding(onboarding) || (location.pathname === '/register' ? '/onboarding' : '/dashboard');
    sessionStorage.removeItem('postAuthRedirect');

    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
