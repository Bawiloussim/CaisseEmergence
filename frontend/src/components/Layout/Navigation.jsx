// React import removed (not needed with new JSX transform)
import { LayoutDashboard, Users, CreditCard, HandCoins, Heart, FileText, BarChart3, ScrollText, MessageCircle } from 'lucide-react';

const Navigation = ({ activeTab, onTabChange }) => {
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

  return (
    <nav className="bg-navy/95 border-b border-gold/20 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {navItems.map((item) => (
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
              <item.icon size={18} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;