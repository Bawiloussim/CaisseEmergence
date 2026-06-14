import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';

/**
 * Enveloppe toute l'application : si personne n'est connecté, affiche la
 * page de connexion. Une fois connecté, affiche le contenu normalement.
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

export default RequireAuth;
