import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import ChangePasswordPage from './ChangePasswordPage';

/**
 * Enveloppe toute l'application :
 * - Personne non connectée → page de connexion
 * - Première connexion (mustChangePassword) → page de changement de mot de passe
 * - Sinon → contenu normal
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (mustChangePassword) {
    return <ChangePasswordPage />;
  }

  return children;
};

export default RequireAuth;
