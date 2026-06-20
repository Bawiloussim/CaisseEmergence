import { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, CalendarDays } from 'lucide-react';
import ContributionController from '../../controllers/ContributionController';
import LoanController from '../../controllers/LoanController';
import MemberController from '../../controllers/MemberController';
import MeetingFeedbackController from '../../controllers/MeetingFeedbackController';
import { MONTHS, MONTHS_FULL } from '../../models/ContributionModel';

const COLORS = ['#c48a21', '#0f3751', '#4ade80', '#56a7d2', '#f87171', '#a78bfa', '#fb923c', '#34d399'];

// MONTHS couvre la phase pilote (juin à novembre 2026) ; on associe chaque
// mois à l'index retourné par Date#getMonth() pour rattacher les prêts
// (datés librement) au bon mois du graphique.
const MONTH_KEY_BY_DATE_INDEX = { 5: 'JUIN', 6: 'JUILLET', 7: 'AOÛT', 8: 'SEPTEMBRE', 9: 'OCTOBRE', 10: 'NOVEMBRE' };

const fcfa = (n) => `${Math.round(n || 0).toLocaleString('fr-FR')} FCFA`;
const compact = (n) => `${Math.round((n || 0) / 1000).toLocaleString('fr-FR')}k`;

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    navy: 'bg-navy/10 text-navy',
    gold: 'bg-gold/10 text-gold',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-navy truncate">{value}</p>
      </div>
    </div>
  );
};

const Statistics = () => {
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [meetingFeedback, setMeetingFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const memberList = MemberController.getAllMembers();
      const [totals, loanList, contribList, feedbackList] = await Promise.all([
        ContributionController.getMonthlyTotals(),
        LoanController.getAllLoans(),
        ContributionController.getAllContributions(),
        MeetingFeedbackController.getAll(),
      ]);
      setMembers(memberList);
      setMonthlyTotals(totals);
      setLoans(loanList);
      setContributions(contribList);
      setMeetingFeedback(feedbackList);
      setLoading(false);
    })();
  }, []);

  const capitalEvolution = useMemo(() => {
    let cumulative = 0;
    return MONTHS.map((month) => {
      cumulative += monthlyTotals[month]?.totalAmount || 0;
      return { month: MONTHS_FULL[month], capital: cumulative };
    });
  }, [monthlyTotals]);

  const contributionsVsLoans = useMemo(() => {
    const loanTotals = {};
    MONTHS.forEach((m) => { loanTotals[m] = 0; });
    loans
      .filter((l) => l.status === 'approved')
      .forEach((l) => {
        const date = new Date(l.approvalDate || l.requestDate);
        const key = MONTH_KEY_BY_DATE_INDEX[date.getMonth()];
        if (key) loanTotals[key] += l.amount || 0;
      });
    return MONTHS.map((month) => ({
      month: MONTHS_FULL[month],
      Cotisations: monthlyTotals[month]?.totalAmount || 0,
      Prêts: loanTotals[month],
    }));
  }, [monthlyTotals, loans]);

  const memberBreakdown = useMemo(() => {
    const data = members
      .map((m) => ({
        name: m.name,
        value: contributions
          .filter((c) => c.memberId === m.accountId && c.status === 'paid')
          .reduce((s, c) => s + (c.amount || 0), 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    if (data.length <= 8) return data;
    const top = data.slice(0, 7);
    const rest = data.slice(7).reduce((s, d) => s + d.value, 0);
    return [...top, { name: 'Autres', value: rest }];
  }, [members, contributions]);

  const meetingStats = useMemo(() => {
    return MONTHS.map((month) => {
      const entries = meetingFeedback.filter((f) => f.month === month);
      return {
        month: MONTHS_FULL[month],
        Présents: entries.filter((f) => f.present === true).length,
        Absents: entries.filter((f) => f.present === false).length,
        Satisfaits: entries.filter((f) => f.satisfaction === 'satisfait').length,
        Insatisfaits: entries.filter((f) => f.satisfaction === 'insatisfait').length,
      };
    });
  }, [meetingFeedback]);

  const hasMeetingData = meetingFeedback.length > 0;

  const stats = useMemo(() => {
    const monthsWithData = MONTHS.filter((m) => (monthlyTotals[m]?.totalAmount || 0) > 0);
    const totalAnnuel = MONTHS.reduce((s, m) => s + (monthlyTotals[m]?.totalAmount || 0), 0);
    const totalAttendu = MONTHS.reduce((s, m) => s + (monthlyTotals[m]?.expectedAmount || 0), 0);
    const moyenneMensuelle = monthsWithData.length ? totalAnnuel / monthsWithData.length : 0;
    const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalAnnuel / totalAttendu) * 100) : 0;
    const totalPrets = loans.filter((l) => l.status === 'approved').reduce((s, l) => s + (l.amount || 0), 0);
    return { totalAnnuel, moyenneMensuelle, tauxRecouvrement, totalPrets };
  }, [monthlyTotals, loans]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des statistiques…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-navy">Statistiques</h2>
        <p className="text-sm text-gray-500 mt-1">Analyse en temps réel des cotisations, prêts et de l'évolution du capital</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Capital total cotisé" value={fcfa(stats.totalAnnuel)} color="navy" />
        <StatCard icon={CalendarDays} label="Moyenne mensuelle" value={fcfa(stats.moyenneMensuelle)} color="gold" />
        <StatCard icon={BarChart3} label="Taux de recouvrement" value={`${stats.tauxRecouvrement}%`} color="green" />
        <StatCard icon={PieChartIcon} label="Total prêts accordés" value={fcfa(stats.totalPrets)} color="blue" />
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Évolution du capital</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={capitalEvolution} margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={compact} width={50} />
            <Tooltip formatter={(v) => fcfa(v)} />
            <Line type="monotone" dataKey="capital" name="Capital cumulé" stroke="#c48a21" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Cotisations vs prêts accordés par mois</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={contributionsVsLoans} margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={compact} width={50} />
            <Tooltip formatter={(v) => fcfa(v)} />
            <Legend />
            <Bar dataKey="Cotisations" fill="#0f3751" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Prêts" fill="#c48a21" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Répartition des contributions par membre</h3>
        {memberBreakdown.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Aucune cotisation enregistrée</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={memberBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {memberBreakdown.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fcfa(v)} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2">
              {memberBreakdown.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between text-sm gap-3">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{d.name}</span>
                  </span>
                  <span className="font-semibold text-navy shrink-0">{fcfa(d.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Participation & satisfaction aux réunions mensuelles</h3>
        {!hasMeetingData ? (
          <p className="text-center text-gray-400 py-12">Aucune réunion signée pour le moment</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={meetingStats} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={30} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Présents" fill="#0f3751" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absents" fill="#fb923c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Satisfaits" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Insatisfaits" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Statistics;
