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

  /**
   * Mot de passe oublié — étape 1 : demande l'envoi d'un code à 6 chiffres
   * par email. La réponse est toujours générique (ne révèle pas si
   * l'email correspond à un compte).
   */
  async function forgotPassword(email) {
    try {
      const data = await api.post('/auth/forgot-password', { email }, { auth: false });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message || "Erreur lors de l'envoi du code." };
    }
  }

  /**
   * Mot de passe oublié — étape 2 : vérifie le code et remplace le mot de
   * passe. Aucune suppression/recréation de compte n'est nécessaire : les
   * cotisations, prêts et avis du membre restent intacts.
   */
  async function resetPassword({ email, code, newPassword }) {
    try {
      await api.post('/auth/reset-password', { email, code, newPassword }, { auth: false });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Code invalide ou expiré.' };
    }
  }

  async function updateProfile({ name, email }) {
    try {
      const data = await api.put('/auth/profile', { name, email });
      const updated = { ...user, ...data.user };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Erreur lors de la mise à jour du profil.' };
    }
  }

  const value = {
    user,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    updateProfile,
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
