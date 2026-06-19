import { useState, useEffect } from 'react';
import KPICards from './KPICards';
import DashboardTable from './DashboardTable';
import SolidarityCard from './SolidarityCard';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import SolidarityController from '../../controllers/SolidarityController';
import { Calendar } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentContributions, setRecentContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const memberList = MemberController.getAllMembers();
      const contributions = await ContributionController.getAllContributions();
      const solidarity = await SolidarityController.getSolidarityFund();

      const paidContributions = contributions.filter((c) => c.status === 'paid');
      const totalCaisse = paidContributions.reduce((sum, c) => sum + c.amount, 0);
      const pendingCount = contributions.filter((c) => c.status === 'pending' || c.status === 'late').length;

      setMembers(memberList);
      setStats({
        totalCaisse,
        solidarityFund: solidarity.total,
        memberCount: memberList.length,
        pendingPayments: pendingCount,
      });
      setRecentContributions(
        [...contributions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      );
      setLoading(false);
    })();
  }, []);

  const MONTH_LABELS = ['Juin','Juil','Août','Sept','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai'];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement du tableau de bord…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-xl shadow-main bg-white flex items-center gap-4">
        <div className="w-1.5 h-10 bg-gold rounded mr-2"></div>
        <div className="flex-1">
          <p className="text-sm text-navy"><strong>Phase pilote (Juin – Novembre 2026)</strong> — Cotisations actives. Aucun prêt ni aide accordé pendant cette période.</p>
        </div>
      </div>

      <KPICards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardTable contributions={recentContributions} members={members} />
        </div>
        <div>
          <SolidarityCard solidarityFund={stats.solidarityFund} />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-gold" />
          <h3 className="font-playfair text-lg font-bold text-navy">Calendrier annuel</h3>
        </div>
        <div className="month-pills">
          {MONTH_LABELS.map((m) => (
            <div key={m} className={`month-pill ${m === 'Déc' ? 'gold' : ''}`}>{m}<div className="block text-xs mt-1 text-white/80">Cotisation</div></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
