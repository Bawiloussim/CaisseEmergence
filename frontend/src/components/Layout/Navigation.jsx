import {
  LayoutDashboard, Users, CreditCard, HandCoins, Heart,
  FileText, BarChart3, ScrollText, MessageCircle, X, LogOut,
} from 'lucide-react';
import defaultLogo from '../../assets/logo/icon.png';

const ROLE_LABELS = {
  secretaire: 'Secrétaire',
  tresorier: 'Trésorier',
  president: 'Président',
  membre: 'Membre',
};

const NAV_GROUPS = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard',     label: 'Tableau de bord',   icon: LayoutDashboard },
      { id: 'members',       label: 'Membres',            icon: Users },
    ],
  },
  {
    label: 'FINANCES',
    items: [
      { id: 'contributions', label: 'Cotisations',        icon: CreditCard },
      { id: 'loans',         label: 'Prêts',              icon: HandCoins },
      { id: 'solidarity',    label: 'Solidarité',         icon: Heart },
    ],
  },
  {
    label: 'ANALYSES',
    items: [
      { id: 'statistics',   label: 'Statistiques',        icon: BarChart3 },
      { id: 'reports',      label: 'Rapports',            icon: FileText },
    ],
  },
  {
    label: 'ACTIVITÉS',
    items: [
      { id: 'program', label: 'Programme & Charte',       icon: ScrollText },
      { id: 'chat',    label: 'Chat',                     icon: MessageCircle },
    ],
  },
];

const Navigation = ({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  pendingContributionCount = 0,
  user,
  settings,
  onLogout,
  mobileOpen,
  onMobileClose,
}) => {
  const logoSrc = settings?.logo || defaultLogo;

  const badgeFor = (id) => {
    if (id === 'chat' && unreadChatCount > 0)
      return unreadChatCount > 9 ? '9+' : unreadChatCount;
    if (id === 'contributions' && pendingContributionCount > 0)
      return pendingContributionCount > 9 ? '9+' : pendingContributionCount;
    return null;
  };

  const handleSelect = (id) => {
    onTabChange(id);
    onMobileClose?.();
  };

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  /* ── Contenu identique desktop et mobile ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo / identité */}
      <div className="px-5 py-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-playfair font-bold text-white text-sm leading-tight truncate">
              Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
            </p>
            <p className="text-[11px] truncate" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold tracking-widest px-3 mb-1.5" style={{ color: '#56a7d2' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const badge = badgeFor(item.id);
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white shadow-sm'
                        : 'hover:bg-white/10'
                    }`}
                    style={{ color: isActive ? '#09324e' : 'rgba(255,255,255,0.72)' }}
                  >
                    <item.icon size={17} className="shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {badge && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied de page — utilisateur */}
      <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ background: '#c48a21', color: '#072434' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: '#98afc0' }}>
              {ROLE_LABELS[user?.accountRole] || 'Membre'}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Sidebar desktop (fixe, toujours visible) ── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full w-60 z-30"
        style={{ background: '#09324e' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Overlay mobile ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={onMobileClose}
        />
      )}

      {/* ── Tiroir mobile (slide depuis la gauche) ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#09324e' }}
      >
        {/* Bouton fermer */}
        <div className="flex justify-end px-4 pt-4 pb-2 shrink-0">
          <button onClick={onMobileClose} className="p-2 rounded-lg hover:bg-white/10 text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
};

export default Navigation;
