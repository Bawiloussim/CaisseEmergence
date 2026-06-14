/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { USERS, ROLES } from './auth.config';

const STORAGE_KEY = 'caisse_emergence_session';

const AuthContext = createContext(null);

function getStoredSession() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  // Initialisation paresseuse : on récupère une éventuelle session
  // précédente directement, sans passer par un effet.
  const [user, setUser] = useState(getStoredSession);

  function login(username, password) {
    const account = USERS.find(
      (u) =>
        u.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        u.password === password
    );

    if (!account) {
      return { success: false, message: 'Identifiant ou mot de passe incorrect.' };
    }

    const session = {
      username: account.username,
      name: account.name,
      role: account.role,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return { success: true };
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isSecretaire: user?.role === ROLES.SECRETAIRE,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  }
  return context;
}
