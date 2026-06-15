import { useState } from 'react';
import { Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { useAuth } from './AuthContext';
import logo from '../../assets/logo/2.jpeg';

const ChangePasswordPage = () => {
  const { changePassword, user, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    const result = await changePassword({ newPassword });
    if (!result.success) {
      setError(result.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-linear-to-br from-navy to-[#0a2233]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-main overflow-hidden">
          <div className="bg-navy px-8 py-8 flex flex-col items-center text-center">
            <img
              src={logo}
              alt="Caisse Émergence"
              className="w-full max-w-[220px] rounded-lg shadow-md"
            />
          </div>

          <div className="px-8 py-8">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <KeyRound size={22} className="text-gold" />
              </div>
            </div>

            <h2 className="font-playfair text-xl font-bold text-navy text-center mb-1">
              Bienvenue{user?.name ? `, ${user.name}` : ''} !
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Pour des raisons de sécurité, choisissez un nouveau mot de passe
              avant de continuer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="alert-info bg-red-50" role="alert">
                  <div className="bar" style={{ backgroundColor: '#f87171' }} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-gold w-full py-3 text-base disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : 'Valider le nouveau mot de passe'}
              </button>
            </form>

            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-navy text-center w-full mt-6"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
