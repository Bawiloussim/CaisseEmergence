import { useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import ChangePasswordPage from './ChangePasswordPage';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, mustChangePassword } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (mustChangePassword) {
    return <ChangePasswordPage />;
  }

  return children;
};

export default RequireAuth;
