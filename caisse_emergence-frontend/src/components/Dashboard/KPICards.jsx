// React import removed (not needed with new JSX transform)
import { Wallet, HandHeart, Users, Clock } from 'lucide-react';

const KPICards = ({ stats }) => {
  const cards = [
    {
      title: 'Caisse totale',
      value: `${stats.totalCaisse.toLocaleString('fr-FR')} FCFA`,
      icon: Wallet,
      color: 'blue',
      subtext: 'Cotisations collectées',
    },
    {
      title: 'Fonds solidarité',
      value: `${stats.solidarityFund.toLocaleString('fr-FR')} FCFA`,
      icon: HandHeart,
      color: 'green',
      subtext: 'Disponibles',
    },
    {
      title: 'Membres actifs',
      value: stats.memberCount,
      icon: Users,
      color: 'navy',
      subtext: 'inscrits',
    },
    {
      title: 'Paiements en attente',
      value: stats.pendingPayments,
      icon: Clock,
      color: 'red',
      subtext: 'cotisations à régler',
    },
  ];

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    navy: 'border-navy',
    red: 'border-red-500',
  };

  const iconColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    navy: 'text-navy',
    red: 'text-red-600',
  };

  return (
    <div className="kpi-grid">
      {cards.map((card, index) => (
        <div key={index} className={`kpi-card ${colorClasses[card.color]}`}>
          <div className="meta">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center bg-white/30`}> 
                <card.icon size={18} className={iconColor[card.color]} />
              </div>
              <div>
                <p className="sub">{card.subtext}</p>
                <p className="value">{card.value}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;