import { useState, useEffect } from 'react';
import {
  Wallet, HandHeart, Users, HandCoins,
  Video, TrendingUp, Calendar,
} from 'lucide-react';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import SolidarityController from '../../controllers/SolidarityController';
import MeetingFeedbackController from '../../controllers/MeetingFeedbackController';
import LoanController from '../../controllers/LoanController';
import { useAuth } from '../Auth/AuthContext';
import { CYCLE_MONTHS, CYCLE_MONTHS_FULL, getCurrentCycleMonth } from '../../utils/cycleMonth';
import LoadingSpinner from '../UI/LoadingSpinner';

/* ─── Formatage ─────────────────────────────────────────────── */
const fmtK = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
  return n.toLocaleString('fr-FR');
};

const SHORT = {
  JUIN: 'Juin', JUILLET: 'Juil', AOÛT: 'Août',
  SEPTEMBRE: 'Sept', OCTOBRE: 'Oct', NOVEMBRE: 'Nov',
};

/* ─── Sparkline SVG ─────────────────────────────────────────── */
function Sparkline({ data = [], color = '#c48a21', width = 90, height = 36 }) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = (height - 6) - ((v - min) / range) * (height - 10) + 3;
    return [x.toFixed(1), y.toFixed(1)];
  });
  const ptsStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area   = `2,${height} ${ptsStr} ${width - 2},${height}`;
  const uid    = color.replace('#', 'spk');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${uid})`} />
      <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.8" fill={color} />
    </svg>
  );
}

/* ─── Carte métrique ─────────────────────────────────────────── */
function MetricCard({ title, value, sub, sparkData, color, icon: Icon }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#98afc0' }}>{title}</p>
          <p className="font-bold text-white leading-none" style={{ fontSize: '1.2rem' }}>{value}</p>
          {sub && <p className="text-xs mt-1.5 font-medium" style={{ color }}>{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + '22' }}>
          <Icon size={19} style={{ color }} />
        </div>
      </div>
      <Sparkline data={sparkData} color={color} />
    </div>
  );
}

/* ─── Tuile stat (bas de page) ───────────────────────────────── */
function StatTile({ label, value, note, color = '#98afc0' }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: '#98afc0' }}>{label}</p>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      {note && <p className="text-xs mt-1 font-medium" style={{ color }}>{note}</p>}
    </div>
  );
}

/* ─── Badge statut cotisation ────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    paid:    { label: 'Payé',    bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
    pending: { label: 'Attente', bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
    late:    { label: 'Retard',  bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  };
  const s = cfg[status] || { label: status, bg: 'rgba(255,255,255,0.1)', color: '#fff' };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

/* ─── Dashboard principal ────────────────────────────────────── */
const Dashboard = ({ onNavigateToProgram }) => {
  const { user } = useAuth();
  const [stats, setStats]           = useState(null);
  const [contribs, setContribs]     = useState([]);
  const [recentList, setRecentList] = useState([]);
  const [members, setMembers]       = useState([]);
  const [needsOpinion, setNeedsOpinion] = useState(false);
  const [loading, setLoading]       = useState(true);

  const currentMonth = getCurrentCycleMonth();

  useEffect(() => {
    (async () => {
      const memberList = MemberController.getAllMembers();
      const [allContribs, solidarity, feedback, loans] = await Promise.all([
        ContributionController.getAllContributions(),
        SolidarityController.getSolidarityFund(),
        MeetingFeedbackController.getAll(),
        LoanController.getAllLoans(),
      ]);

      const paid         = allContribs.filter(c => c.status === 'paid');
      const totalCaisse  = paid.reduce((s, c) => s + c.amount, 0);
      const pendingCount = allContribs.filter(c => c.status === 'pending' || c.status === 'late').length;
      const approved     = loans.filter(l => l.status === 'approved');
      const totalLoans   = approved.reduce((s, l) => s + l.amount, 0);
      const totalRepaid  = approved.reduce(
        (s, l) => s + (l.repayments || []).filter(r => r.status === 'paid').reduce((a, r) => a + r.amount, 0), 0
      );

      setMembers(memberList);
      setContribs(allContribs);
      setStats({
        totalCaisse,
        solidarityFund: solidarity.total,
        memberCount: memberList.length,
        pendingPayments: pendingCount,
        totalLoans,
        availableAfterLoans: totalCaisse - totalLoans + totalRepaid,
      });
      setRecentList(
        [...allContribs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
      );
      setNeedsOpinion(
        !!currentMonth &&
        !feedback.some(f => f.memberId === user?.id && f.month === currentMonth && f.satisfaction != null)
      );
      setLoading(false);
    })();
  }, [currentMonth, user]);

  if (loading) return <LoadingSpinner label="Chargement du tableau de bord…" />;

  /* ── Calculs dérivés ── */
  const monthlyTotals = CYCLE_MONTHS.map(m =>
    contribs.filter(c => c.month === m && c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  );
  const monthlyPaidCount = CYCLE_MONTHS.map(m =>
    new Set(contribs.filter(c => c.month === m && c.status === 'paid').map(c => c.memberId)).size
  );
  const paidThisMonth = currentMonth
    ? new Set(contribs.filter(c => c.month === currentMonth && c.status === 'paid').map(c => c.memberId)).size
    : 0;
  const participationRate = stats.memberCount > 0
    ? Math.round((paidThisMonth / stats.memberCount) * 100)
    : 0;
  const currentMonthTotal = currentMonth
    ? contribs.filter(c => c.month === currentMonth && c.status === 'paid').reduce((s, c) => s + c.amount, 0)
    : 0;

  const memberMap = Object.fromEntries(members.map(m => [m.id || m._id, m]));
  const dateStr   = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 sm:-mt-8 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10"
      style={{ background: '#060f1a', minHeight: 'calc(100vh - 60px)' }}
    >

      {/* ── En-tête ── */}
      <div className="mb-6">
        <h2 className="font-playfair font-bold text-white text-xl sm:text-2xl">Vue d'ensemble</h2>
        <p className="text-xs mt-0.5 capitalize" style={{ color: '#56a7d2' }}>{dateStr}</p>
      </div>

      {/* ── Bannières ── */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(196,138,33,0.1)', border: '1px solid rgba(196,138,33,0.22)' }}>
          <TrendingUp size={14} style={{ color: '#c48a21' }} className="shrink-0" />
          <p className="text-sm" style={{ color: '#d4a040' }}>
            <strong>Phase pilote Juin – Novembre 2026</strong> — Cotisations actives. Aucun prêt ni aide pendant cette période.
          </p>
        </div>

        {needsOpinion && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-wrap"
            style={{ background: 'rgba(86,167,210,0.1)', border: '1px solid rgba(86,167,210,0.22)' }}>
            <Video size={14} style={{ color: '#56a7d2' }} className="shrink-0" />
            <p className="text-sm flex-1" style={{ color: '#7bbcd8' }}>
              <strong>Réunion de {CYCLE_MONTHS_FULL[currentMonth]} :</strong> votre avis n'a pas encore été soumis.
            </p>
            {onNavigateToProgram && (
              <button onClick={onNavigateToProgram}
                className="text-xs font-bold px-4 py-1.5 rounded-xl hover:opacity-80 transition-opacity"
                style={{ background: '#56a7d2', color: '#060f1a' }}>
                Donner mon avis
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4 Cartes métriques ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="CAISSE TOTALE"
          value={`${fmtK(stats.totalCaisse)} FCFA`}
          sub={`${paidThisMonth} paiement(s) ce mois`}
          sparkData={monthlyTotals}
          color="#c48a21"
          icon={Wallet}
        />
        <MetricCard
          title="MEMBRES ACTIFS"
          value={`${stats.memberCount} membres`}
          sub={`${participationRate}% de participation`}
          sparkData={monthlyPaidCount}
          color="#56a7d2"
          icon={Users}
        />
        <MetricCard
          title="PRÊTS EN COURS"
          value={`${fmtK(stats.totalLoans)} FCFA`}
          sub={stats.totalLoans === 0 ? 'Aucun prêt actif' : 'Capital approuvé'}
          sparkData={CYCLE_MONTHS.map((_, i) => i < 4 ? 0 : stats.totalLoans * (i - 3) * 0.25)}
          color="#a78bfa"
          icon={HandCoins}
        />
        <MetricCard
          title="FONDS SOLIDARITÉ"
          value={`${fmtK(stats.solidarityFund)} FCFA`}
          sub="Disponible"
          sparkData={monthlyTotals.map((_, i) =>
            monthlyTotals.slice(0, i + 1).reduce((s, x) => s + x * 0.05, 0)
          )}
          color="#4ade80"
          icon={HandHeart}
        />
      </div>

      {/* ── Contenu central ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* Activité récente */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-bold text-white">Activité récente</p>
            <p className="text-[11px]" style={{ color: '#56a7d2' }}>Dernières cotisations</p>
          </div>

          {recentList.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: '#98afc0' }}>
              Aucune cotisation enregistrée
            </p>
          ) : recentList.map((c, i) => {
            const member   = memberMap[c.memberId];
            const initials = member?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
            return (
              <div key={c.id || i}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] last:border-b-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(196,138,33,0.18)', color: '#c48a21' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{member?.name || c.memberId}</p>
                  <p className="text-xs" style={{ color: '#98afc0' }}>
                    {CYCLE_MONTHS_FULL[c.month] || c.month} 2026
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold mb-0.5"
                    style={{ color: c.status === 'paid' ? '#4ade80' : '#fbbf24' }}>
                    {(c.amount || 0).toLocaleString('fr-FR')} F
                  </p>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Résumé du mois courant */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} style={{ color: '#56a7d2' }} />
              <p className="text-sm font-bold text-white">
                {currentMonth ? CYCLE_MONTHS_FULL[currentMonth] : 'Mois en cours'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#98afc0' }}>Collecté ce mois</span>
                <span className="text-sm font-bold" style={{ color: '#c48a21' }}>
                  {fmtK(currentMonthTotal)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#98afc0' }}>Membres ayant payé</span>
                <span className="text-sm font-bold text-white">
                  {paidThisMonth} / {stats.memberCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#98afc0' }}>En attente</span>
                <span className="text-sm font-bold"
                  style={{ color: stats.pendingPayments > 0 ? '#fbbf24' : '#4ade80' }}>
                  {stats.pendingPayments}
                </span>
              </div>
              {/* Barre de progression */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: '#98afc0' }}>Participation</span>
                  <span className="text-xs font-bold" style={{ color: '#56a7d2' }}>{participationRate}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${participationRate}%`,
                      background: participationRate >= 80 ? '#4ade80' : participationRate >= 50 ? '#56a7d2' : '#fbbf24',
                    }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mini-calendrier du cycle */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-bold text-white mb-3 tracking-widest">CYCLE 2026</p>
            <div className="grid grid-cols-3 gap-2">
              {CYCLE_MONTHS.map((m, idx) => {
                const total  = monthlyTotals[idx];
                const isNow  = m === currentMonth;
                const hasPaid = total > 0;
                return (
                  <div key={m} className="rounded-xl px-2 py-2.5 text-center"
                    style={{
                      background: isNow ? 'rgba(196,138,33,0.18)' : hasPaid ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)',
                      border: isNow ? '1px solid rgba(196,138,33,0.45)' : hasPaid ? '1px solid rgba(74,222,128,0.18)' : '1px solid rgba(255,255,255,0.05)',
                    }}>
                    <p className="text-[10px] font-bold"
                      style={{ color: isNow ? '#c48a21' : hasPaid ? '#4ade80' : '#4b5563' }}>
                      {SHORT[m]}
                    </p>
                    <p className="text-[11px] font-semibold mt-0.5"
                      style={{ color: isNow ? '#e0a830' : hasPaid ? '#fff' : '#4b5563' }}>
                      {hasPaid ? fmtK(total) : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tuiles statistiques bas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="CAISSE DISPONIBLE"
          value={`${fmtK(stats.availableAfterLoans)} FCFA`}
          note="Après prêts + remboursements"
          color="#4ade80"
        />
        <StatTile
          label="TOTAL COLLECTÉ"
          value={`${fmtK(stats.totalCaisse)} FCFA`}
          note="Toutes cotisations payées"
          color="#c48a21"
        />
        <StatTile
          label="EN ATTENTE"
          value={stats.pendingPayments.toString()}
          note={stats.pendingPayments === 0 ? 'Tout à jour ✓' : 'cotisation(s) à régler'}
          color={stats.pendingPayments === 0 ? '#4ade80' : '#fbbf24'}
        />
        <StatTile
          label="SOLIDARITÉ"
          value={`${fmtK(stats.solidarityFund)} FCFA`}
          note="Fonds d'aide collective"
          color="#a78bfa"
        />
      </div>
    </div>
  );
};

export default Dashboard;
