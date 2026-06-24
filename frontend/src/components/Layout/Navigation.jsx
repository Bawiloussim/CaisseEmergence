import { useState } from 'react';
import { LayoutDashboard, Users, CreditCard, HandCoins, Heart, FileText, BarChart3, ScrollText, MessageCircle, Menu, X } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange, unreadChatCount = 0, pendingContributionCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'members', label: 'Membres', icon: Users },
    { id: 'contributions', label: 'Cotisations', icon: CreditCard },
    { id: 'loans', label: 'Prêts', icon: HandCoins },
    { id: 'solidarity', label: 'Solidarité', icon: Heart },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3 },
    { id: 'reports', label: 'Rapports', icon: FileText },
    { id: 'program', label: 'Programme & Charte', icon: ScrollText },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  const badgeFor = (id) => {
    if (id === 'chat' && unreadChatCount > 0) return unreadChatCount > 9 ? '9+' : unreadChatCount;
    if (id === 'contributions' && pendingContributionCount > 0) return pendingContributionCount > 9 ? '9+' : pendingContributionCount;
    return null;
  };

  const activeItem = navItems.find((item) => item.id === activeTab);

  const handleSelect = (id) => {
    onTabChange(id);
    setIsOpen(false);
  };

  return (
    <nav className="bg-navy/95 border-b border-gold/20 relative">
      {/* Desktop/tablette : barre horizontale complète */}
      <div className="hidden md:block overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const badge = badgeFor(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                    ${activeTab === item.id
                      ? 'text-gold border-b-2 border-gold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <span className="relative">
                    <item.icon size={18} />
                    {badge && (
                      <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile : bouton hamburger + onglet actif, ouvre un tiroir vertical */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center justify-center w-9 h-9 -ml-1 text-white rounded-lg hover:bg-white/10 active:bg-white/15 transition-colors"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        {activeItem && (
          <span className="flex items-center gap-2 text-gold font-medium text-sm">
            <activeItem.icon size={18} /> {activeItem.label}
          </span>
        )}
        <span className="w-9" aria-hidden="true" />
      </div>

      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="md:hidden absolute top-full left-0 right-0 bg-navy shadow-xl z-50 border-t border-gold/20 max-h-[70vh] overflow-y-auto animate-fade-in">
            {navItems.map((item) => {
              const badge = badgeFor(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b border-white/5 transition-colors ${
                    activeTab === item.id ? 'text-gold bg-white/5' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="relative">
                    <item.icon size={18} />
                    {badge && (
                      <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {badge}
                      </span>
                    )}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation;
