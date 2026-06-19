import { useEffect, useState } from 'react';
import { Users, CreditCard, HandCoins, Heart, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import api from '../../services/apiClient';
import ActivityLogService from '../../services/ActivityLogService';

const RESOURCE_ICONS = {
  member: Users,
  contribution: CreditCard,
  loan: HandCoins,
  aid: Heart,
};

const RESOURCE_LABELS = {
  member: 'Membre',
  contribution: 'Cotisation',
  loan: 'Prêt',
  aid: 'Aide',
};

const ACTION_BADGES = {
  create: { icon: PlusCircle, text: 'Création', className: 'bg-green-50 text-green-700' },
  update: { icon: Pencil, text: 'Modification', className: 'bg-blue-50 text-blue-700' },
  delete: { icon: Trash2, text: 'Suppression', className: 'bg-red-50 text-red-700' },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const ActivityLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const local = ActivityLogService.getLogs().map((l) => ({ ...l, resource: l.resource || 'member' }));
      try {
        const memberLogs = await api.get('/audit-logs');
        const normalized = memberLogs.map((l) => ({
          id: l._id,
          action: l.action,
          resource: l.resource || 'member',
          resourceLabel: l.resourceLabel,
          actorName: l.actorName,
          details: l.details,
          createdAt: l.createdAt,
        }));
        const merged = [...normalized, ...local].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEntries(merged.slice(0, 150));
      } catch (err) {
        setError(err.message || 'Impossible de charger le journal des membres');
        setEntries(local);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-navy">Journal d'activité</h2>
        <p className="text-sm text-gray-500 mt-1">
          Historique des actions sur les membres, cotisations, prêts et aides — pour la transparence.
        </p>
      </div>

      {error && (
        <div className="alert-info bg-yellow-50">
          <div className="bar" style={{ backgroundColor: '#eab308' }} />
          <p className="text-sm text-yellow-700">{error} (les actions sur les membres ne sont pas affichées)</p>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Aucune activité enregistrée</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const ResourceIcon = RESOURCE_ICONS[entry.resource] || Users;
              const badge = ACTION_BADGES[entry.action] || ACTION_BADGES.update;
              const BadgeIcon = badge.icon;
              return (
                <li key={entry.id} className="py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
                    <ResourceIcon size={16} className="text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        <BadgeIcon size={12} /> {badge.text}
                      </span>
                      <span className="text-xs text-gray-400">{RESOURCE_LABELS[entry.resource] || entry.resource}</span>
                    </div>
                    <p className="text-sm text-navy font-medium mt-1 truncate">{entry.resourceLabel}</p>
                    {entry.details && <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {entry.actorName ? `${entry.actorName} · ` : ''}{formatDate(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
