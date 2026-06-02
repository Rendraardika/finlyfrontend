import { createContext, useState, useContext, useEffect } from 'react';
import { clearLegacyInvestmentStorage } from '../utils/investmentViewModel';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedOnboarding = localStorage.getItem('onboarding');
    
    if (savedToken?.startsWith('test-token') || savedToken?.startsWith('mock-token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('onboarding');
      clearLegacyInvestmentStorage();
      setLoading(false);
      return;
    }

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedOnboarding) {
          setOnboarding(JSON.parse(savedOnboarding));
        }
        clearLegacyInvestmentStorage();
      } catch (_error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('onboarding');
        clearLegacyInvestmentStorage();
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, tokenData, onboardingData = null) => {
    clearLegacyInvestmentStorage();
    setUser(userData);
    setToken(tokenData);
    setOnboarding(onboardingData);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (onboardingData) {
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
    } else {
      localStorage.removeItem('onboarding');
    }
  };

  const updateOnboarding = (onboardingData) => {
    setOnboarding(onboardingData);
    if (onboardingData) {
      localStorage.setItem('onboarding', JSON.stringify(onboardingData));
    } else {
      localStorage.removeItem('onboarding');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setOnboarding(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('onboarding');
    clearLegacyInvestmentStorage();
  };

  return (
    <AuthContext.Provider value={{ user, token, onboarding, loading, login, logout, updateOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
