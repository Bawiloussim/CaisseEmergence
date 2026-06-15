import { useState, useRef } from 'react';
import { Users, Settings, Camera, Upload, LogOut } from 'lucide-react';
import CurrentUserSelector from './CurrentUserSelector';

const Header = ({ isSecretary, user, onLogout, settings, onUpdateSettings }) => {
  const [showSettings, setShowSettings] = useState(false);
  const logoInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="bg-linear-to-r from-navy to-navy/95 text-white sticky top-0 z-50 shadow-lg border-b border-navy/80">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {settings.logo ? (
                <div className="relative">
                  <img 
                    src={settings.logo} 
                    alt="Logo" 
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-gold"
                  />
                  {isSecretary && (
                    <button
                      onClick={() => logoInputRef.current.click()}
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Camera size={20} className="text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div 
                  className="w-14 h-14 rounded-full bg-linear-to-br from-gold to-gold-light flex items-center justify-center cursor-pointer"
                  onClick={() => logoInputRef.current.click()}
                >
                  {isSecretary ? <Upload size={24} className="text-navy" /> : <span className="text-navy font-bold text-xl">CE</span>}
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div>
              <h1 className="font-playfair text-2xl font-bold tracking-tight">{settings.associationName}</h1>
              <p className="text-xs text-gold-light mt-1">Caisse de Solidarité & Prêt</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <CurrentUserSelector />

            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Users size={16} className="text-gold" />
              <span className="text-sm">
                {user?.name} · {isSecretary ? '🔐 Secrétaire' : '👤 Membre'}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-gold text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-gold-light transition-all shadow-sm"
            >
              <LogOut size={16} />
              Déconnexion
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl text-navy p-4 z-50 animate-fade-in">
            <h3 className="font-semibold mb-3">Paramètres</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Nom de l'association</label>
                <input
                  type="text"
                  value={settings.associationName}
                  onChange={(e) => onUpdateSettings({ ...settings, associationName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nom du représentant</label>
                <input
                  type="text"
                  value={settings.representativeName || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, representativeName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-gold"
                  placeholder="Ex: Jean K. — Président"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Titre du représentant</label>
                <input
                  type="text"
                  value={settings.representativeTitle || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, representativeTitle: e.target.value })}
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
    </header>
  );
};

export default Header;