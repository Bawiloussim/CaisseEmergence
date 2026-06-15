import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';
import logo from '../../assets/logo/2.jpeg';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-linear-to-br from-navy to-[#0a2233]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-main overflow-hidden">
          {/* En-tête avec logo */}
          <div className="bg-navy px-8 py-8 flex flex-col items-center text-center">
            <img
              src={logo}
              alt="Caisse Émergence"
              className="w-full max-w-[220px] rounded-lg shadow-md"
            />
          </div>

          {/* Formulaire */}
          <div className="px-8 py-8">
            <h2 className="font-playfair text-xl font-bold text-navy text-center mb-1">
              Connexion à l'espace membres
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Épargne · Crédit · Solidarité
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem' }}
                    placeholder="votre.email@exemple.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="••••••••"
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
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
              Le secrétaire dispose d'un accès complet (ajout, modification, suppression).
              <br />
              Les membres ont un accès en lecture pour suivre cotisations, prêts et solidarité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
