import { useState, useRef } from 'react';
import { Menu, Settings, Camera, Cake, X } from 'lucide-react';
import ProfileModal from '../Auth/ProfileModal';

const TAB_LABELS = {
  dashboard:     'Tableau de bord',
  members:       'Membres',
  contributions: 'Cotisations',
  loans:         'Prêts',
  solidarity:    'Solidarité',
  statistics:    'Statistiques',
  reports:       'Rapports',
  program:       'Programme & Charte',
  chat:          'Chat',
};

const Header = ({
  isSecretary,
  user,
  onLogout,
  settings,
  onUpdateSettings,
  activeTab,
  onMenuToggle,
  birthdaysToday = [],
  birthdayBannerDismissed,
  onDismissBirthday,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const logoInputRef = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onUpdateSettings({ ...settings, logo: reader.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-20 shrink-0"
      style={{ background: '#072434', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Barre principale */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">

        {/* Hamburger (mobile seulement) */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white transition-colors shrink-0"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        {/* Titre de la page active */}
        <h1 className="font-playfair font-bold text-white text-base sm:text-lg truncate">
          {TAB_LABELS[activeTab] || 'Tableau de bord'}
        </h1>

        {/* Séparateur flex */}
        <div className="flex-1" />

        {/* Paramètres */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(v => !v)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            title="Paramètres"
          >
            <Settings size={18} />
          </button>

          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl text-navy p-4 z-50 animate-fade-in">
              <h3 className="font-semibold mb-3 text-navy">Paramètres</h3>
              <div className="space-y-3">
                {isSecretary && (
                  <div>
                    <label className="text-sm font-medium block mb-1">Logo de l'association</label>
                    <button
                      onClick={() => logoInputRef.current.click()}
                      className="flex items-center gap-1.5 text-sm text-navy/70 hover:text-navy border border-navy/20 px-3 py-1.5 rounded-lg hover:bg-navy/5 transition-colors"
                    >
                      <Camera size={14} /> Changer le logo
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1">Nom de l'association</label>
                  <input
                    type="text"
                    value={settings.associationName}
                    onChange={e => onUpdateSettings({ ...settings, associationName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Nom du représentant</label>
                  <input
                    type="text"
                    value={settings.representativeName || ''}
                    onChange={e => onUpdateSettings({ ...settings, representativeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold"
                    placeholder="Ex: Jean K. — Président"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Titre du représentant</label>
                  <input
                    type="text"
                    value={settings.representativeTitle || ''}
                    onChange={e => onUpdateSettings({ ...settings, representativeTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold"
                    placeholder="Ex: Président / Trésorier"
                  />
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-navy text-white py-2 rounded-lg text-sm hover:bg-navy/90"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar utilisateur → ouvre profil */}
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
          title="Mon profil"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
            style={{ background: '#c48a21', color: '#072434' }}
          >
            {initials}
          </div>
          <span className="text-white text-sm font-medium hidden sm:inline truncate max-w-32">
            {user?.name}
          </span>
        </button>
      </div>

      {/* Bannière anniversaire */}
      {!birthdayBannerDismissed && birthdaysToday.length > 0 && (
        <div
          className="flex items-center justify-center gap-2 text-sm font-medium relative px-10 py-2"
          style={{ background: 'rgba(196,138,33,0.15)', borderTop: '1px solid rgba(196,138,33,0.25)' }}
        >
          <Cake size={15} className="shrink-0" style={{ color: '#c48a21' }} />
          <span style={{ color: '#c48a21' }}>
            🎉 Aujourd'hui, c'est l'anniversaire de{' '}
            <strong>{birthdaysToday.map(m => m.name).join(', ')}</strong> !
          </span>
          <button
            onClick={onDismissBirthday}
            className="absolute right-3 hover:opacity-70 transition-opacity"
            style={{ color: '#c48a21' }}
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </header>
  );
};

export default Header;
