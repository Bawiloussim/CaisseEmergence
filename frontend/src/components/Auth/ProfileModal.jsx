import { useState } from 'react';
import { X, User, Mail, Lock, Save } from 'lucide-react';
import { useAuth } from './AuthContext';

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setProfileMsg({ type: 'error', text: 'Le nom est requis.' });
    setProfileLoading(true);
    setProfileMsg(null);
    const result = await updateProfile({ name, email });
    setProfileLoading(false);
    setProfileMsg(result.success
      ? { type: 'success', text: 'Profil mis à jour.' }
      : { type: 'error', text: result.message }
    );
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setPasswordMsg({ type: 'error', text: 'Minimum 6 caractères.' });
    if (newPassword !== confirmPassword) return setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    setPasswordLoading(true);
    setPasswordMsg(null);
    const result = await changePassword({ currentPassword, newPassword });
    setPasswordLoading(false);
    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Mot de passe modifié.' });
    } else {
      setPasswordMsg({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-navy text-white">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User size={18} /> Mon profil
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <form onSubmit={handleProfileSave} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informations personnelles</h3>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1">
                <User size={14} /> Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1">
                <Mail size={14} /> Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                required
              />
            </div>

            {profileMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-60"
            >
              <Save size={15} />
              {profileLoading ? 'Enregistrement…' : 'Enregistrer le profil'}
            </button>
          </form>

          <hr className="border-gray-100" />

          {/* Changement de mot de passe */}
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Lock size={14} /> Changer le mot de passe
            </h3>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                placeholder="••••••••"
              />
            </div>

            {passwordMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {passwordMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 bg-gold text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gold/90 transition-colors disabled:opacity-60"
            >
              <Lock size={15} />
              {passwordLoading ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
