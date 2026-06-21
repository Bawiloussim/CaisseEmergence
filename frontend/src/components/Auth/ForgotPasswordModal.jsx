import { useState } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';

const ForgotPasswordModal = ({ onClose }) => {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez renseigner votre email.');
      return;
    }
    setSubmitting(true);
    const result = await forgotPassword(email.trim());
    setSubmitting(false);
    if (result.success) {
      setStep('reset');
    } else {
      setError(result.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim() || code.trim().length !== 6) {
      setError('Le code reçu par email comporte 6 chiffres.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    const result = await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
    setSubmitting(false);
    if (result.success) {
      setStep('done');
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(7,15,20,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-navy z-10">
          <X size={20} />
        </button>

        <div className="px-8 py-8">
          <h2 className="font-playfair text-xl font-bold text-navy text-center mb-1">
            Mot de passe oublié
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            {step === 'request' && "Recevez un code par email pour réinitialiser votre mot de passe."}
            {step === 'reset' && 'Saisissez le code reçu par email et choisissez un nouveau mot de passe.'}
            {step === 'done' && 'Votre mot de passe a été réinitialisé.'}
          </p>

          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="alert-info bg-red-50">
                  <div className="bar" style={{ backgroundColor: '#f87171' }} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-base disabled:opacity-60">
                {submitting ? 'Envoi…' : 'Recevoir le code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code reçu par email</label>
                <div className="relative">
                  <KeyRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="input"
                    style={{ paddingLeft: '2.5rem', letterSpacing: '0.3em' }}
                    placeholder="123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="alert-info bg-red-50">
                  <div className="bar" style={{ backgroundColor: '#f87171' }} />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-gold w-full py-3 text-base disabled:opacity-60">
                {submitting ? 'Validation…' : 'Réinitialiser mon mot de passe'}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs text-gray-400 hover:text-navy text-center w-full"
              >
                Je n'ai pas reçu de code — recommencer
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-green-500 mx-auto" />
              <p className="text-sm text-gray-600">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <button onClick={onClose} className="btn-gold w-full py-3 text-base">
                Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
