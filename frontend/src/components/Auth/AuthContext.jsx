/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import api from '../../services/apiClient';

const USER_KEY = 'caisse_emergence_user';

const AuthContext = createContext(null);

function getStoredUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  // Initialisation paresseuse : on récupère une éventuelle session
  // précédente directement, sans passer par un effet.
  const [user, setUser] = useState(getStoredUser);

  async function login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password }, { auth: false });
      api.setToken(data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Identifiant ou mot de passe incorrect.' };
    }
  }

  function logout() {
    api.setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  /**
   * Change le mot de passe.
   * - Lors de la première connexion (mustChangePassword = true), currentPassword
   *   n'est pas nécessaire.
   * - Sinon, currentPassword est requis et vérifié côté serveur.
   */
  async function changePassword({ currentPassword, newPassword }) {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      const updated = { ...user, mustChangePassword: false };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur lors du changement de mot de passe.' };
    }
  }

  const value = {
    user,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user,
    isSecretaire: user?.accountRole === 'secretaire',
    mustChangePassword: !!user?.mustChangePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  }
  return context;
}
