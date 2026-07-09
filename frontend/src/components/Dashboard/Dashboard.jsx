import { useState, useEffect } from 'react';
import KPICards from './KPICards';
import DashboardTable from './DashboardTable';
import SolidarityCard from './SolidarityCard';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import SolidarityController from '../../controllers/SolidarityController';
import MeetingFeedbackController from '../../controllers/MeetingFeedbackController';
import LoanController from '../../controllers/LoanController';
import { useAuth } from '../Auth/AuthContext';
import { CYCLE_MONTHS_FULL, getCurrentCycleMonth } from '../../utils/cycleMonth';
import { Calendar, Video } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner';

const Dashboard = ({ onNavigateToProgram }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContributions, setRecentContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [needsMeetingOpinion, setNeedsMeetingOpinion] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = getCurrentCycleMonth();

  useEffect(() => {
    (async () => {
      const memberList = MemberController.getAllMembers();
      const [contributions, solidarity, meetingFeedback, loans] = await Promise.all([
        ContributionController.getAllContributions(),
        SolidarityController.getSolidarityFund(),
        MeetingFeedbackController.getAll(),
        LoanController.getAllLoans(),
      ]);

      const paidContributions = contributions.filter((c) => c.status === 'paid');
      const totalCaisse = paidContributions.reduce((sum, c) => sum + c.amount, 0);
      const pendingCount = contributions.filter((c) => c.status === 'pending' || c.status === 'late').length;

      // Somme prêtée (capital uniquement) sur les prêts approuvés, et somme
      // déjà remboursée (capital + intérêts) sur ces mêmes prêts : l'argent
      // disponible remonte à chaque mensualité reçue, car les intérêts
      // remboursés viennent grossir la caisse au-delà des cotisations.
      const approvedLoans = loans.filter((l) => l.status === 'approved');
      const totalLoans = approvedLoans.reduce((sum, l) => sum + l.amount, 0);
      const totalRepaid = approvedLoans.reduce(
        (sum, l) => sum + (l.repayments || []).filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
        0
      );
      const availableAfterLoans = totalCaisse - totalLoans + totalRepaid;

      setMembers(memberList);
      setStats({
        totalCaisse,
        solidarityFund: solidarity.total,
        memberCount: memberList.length,
        pendingPayments: pendingCount,
        totalLoans,
        availableAfterLoans,
      });
      setRecentContributions(
        [...contributions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      );
      setNeedsMeetingOpinion(
        !!currentMonth &&
          !meetingFeedback.some((f) => f.memberId === user?.id && f.month === currentMonth && f.satisfaction != null)
      );
      setLoading(false);
    })();
  }, [currentMonth, user]);

  const MONTH_LABELS = ['Juin','Juil','Août','Sept','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai'];

  if (loading) {
    return <LoadingSpinner label="Chargement du tableau de bord…" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-xl shadow-main bg-white flex items-center gap-4">
        <div className="w-1.5 h-10 bg-gold rounded mr-2"></div>
        <div className="flex-1">
          <p className="text-sm text-navy"><strong>Phase pilote (Juin – Novembre 2026)</strong> — Cotisations actives. Aucun prêt ni aide accordé pendant cette période.</p>
        </div>
      </div>

      {needsMeetingOpinion && (
        <div className="p-4 rounded-xl shadow-main bg-gold/10 border border-gold/30 flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-lg bg-gold text-navy flex items-center justify-center shrink-0">
            <Video size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-navy">
              <strong>Réunion de {CYCLE_MONTHS_FULL[currentMonth]} :</strong> vous n'avez pas encore donné votre
              avis.
            </p>
          </div>
          {onNavigateToProgram && (
            <button onClick={onNavigateToProgram} className="btn-gold text-sm shrink-0">
              Donner mon avis
            </button>
          )}
        </div>
      )}

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
