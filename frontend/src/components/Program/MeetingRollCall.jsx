import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, X, Smile, Frown, Users, Mail } from 'lucide-react';
import MemberController from '../../controllers/MemberController';
import MeetingFeedbackController from '../../controllers/MeetingFeedbackController';
import { useAuth } from '../Auth/AuthContext';
import { useToast } from '../UI/Toast';
import { CYCLE_MONTHS, CYCLE_MONTHS_FULL, getCurrentCycleMonth } from '../../utils/cycleMonth';

const MeetingRollCall = ({ isSecretary }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [present, setPresent] = useState(true);
  const [satisfaction, setSatisfaction] = useState('satisfait');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  const currentMonth = getCurrentCycleMonth();

  const loadData = useCallback(async () => {
    setMembers(MemberController.getAllMembers());
    setFeedback(await MeetingFeedbackController.getAll());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myEntry = useMemo(
    () => feedback.find((f) => f.memberId === user?.id && f.month === currentMonth),
    [feedback, user, currentMonth]
  );

  useEffect(() => {
    if (myEntry) {
      setPresent(myEntry.present);
      setSatisfaction(myEntry.satisfaction || 'satisfait');
      setComment(myEntry.comment || '');
    }
  }, [myEntry]);

  const currentEntries = useMemo(
    () => feedback.filter((f) => f.month === currentMonth),
    [feedback, currentMonth]
  );

  const archiveMonths = useMemo(() => {
    const months = [...new Set(feedback.map((f) => f.month))].filter((m) => m !== currentMonth);
    return months.sort((a, b) => CYCLE_MONTHS.indexOf(a) - CYCLE_MONTHS.indexOf(b)).reverse();
  }, [feedback, currentMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await MeetingFeedbackController.submitMine({ present, satisfaction, comment });
    setSubmitting(false);
    if (result.success) {
      await loadData();
    } else {
      alert(result.error || "Erreur lors de l'enregistrement");
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    const result = await MeetingFeedbackController.sendReminders();
    setSendingReminders(false);
    if (result.success) {
      if (result.pendingCount === 0) {
        showToast('Tous les membres ont déjà signé ce mois-ci.', 'info');
      } else if (result.failed?.length) {
        showToast(
          `${result.sent}/${result.pendingCount} rappel(s) envoyé(s) — ${result.failed.length} échec(s) (configuration email).`,
          'warning',
          6000
        );
      } else {
        showToast(`${result.sent} rappel(s) envoyé(s) par email.`, 'success');
      }
    } else {
      showToast(result.error || "Erreur lors de l'envoi des rappels", 'error');
    }
  };

  const renderTable = (entries) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy text-white">
            <th className="px-4 py-3 text-left">Membre</th>
            <th className="px-4 py-3 text-center">Présence</th>
            <th className="px-4 py-3 text-center">Satisfaction</th>
            <th className="px-4 py-3 text-left">Avis</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const entry = entries.find((f) => f.memberId === m.accountId);
            return (
              <tr key={m.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-center">
                  {entry ? (
                    entry.present ? (
                      <span className="inline-flex items-center gap-1 text-green-600"><Check size={14} /> Présent</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500"><X size={14} /> Absent</span>
                    )
                  ) : (
                    <span className="text-gray-400">En attente</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {entry?.satisfaction === 'satisfait' && <Smile size={16} className="inline text-green-600" />}
                  {entry?.satisfaction === 'insatisfait' && <Frown size={16} className="inline text-red-500" />}
                  {!entry?.satisfaction && <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{entry?.comment || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des présences…</div>;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gold" />
          <h3 className="font-playfair text-lg font-bold text-navy">Présence & avis des réunions mensuelles</h3>
        </div>
        {isSecretary && currentMonth && (
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="btn-outline flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <Mail size={14} /> {sendingReminders ? 'Envoi…' : "Rappel par email"}
          </button>
        )}
      </div>

      {currentMonth ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Réunion de {CYCLE_MONTHS_FULL[currentMonth]} — chaque membre signe sa présence et donne son avis ci-dessous.
          </p>
          {renderTable(currentEntries)}

          <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t space-y-4">
            <h4 className="font-semibold text-navy">Votre présence & avis — {CYCLE_MONTHS_FULL[currentMonth]}</h4>
            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={present} onChange={(e) => setPresent(e.target.checked)} />
                J'étais présent(e) à la réunion en visioconférence
              </label>
              <div className="flex items-center gap-3 text-sm">
                <span>Satisfaction :</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="satisfaction"
                    value="satisfait"
                    checked={satisfaction === 'satisfait'}
                    onChange={() => setSatisfaction('satisfait')}
                  />
                  <Smile size={16} className="text-green-600" /> Satisfait(e)
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="satisfaction"
                    value="insatisfait"
                    checked={satisfaction === 'insatisfait'}
                    onChange={() => setSatisfaction('insatisfait')}
                  />
                  <Frown size={16} className="text-red-500" /> Insatisfait(e)
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Votre avis sur la réunion (optionnel)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input"
                rows={2}
                placeholder="Remarques, suggestions…"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-gold disabled:opacity-60">
              {submitting ? 'Enregistrement…' : myEntry ? 'Mettre à jour ma réponse' : 'Signer ma présence'}
            </button>
          </form>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Aucune réunion mensuelle ouverte actuellement (hors phase pilote juin–novembre).
        </p>
      )}

      {archiveMonths.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h4 className="font-semibold text-navy mb-4">Archives des mois précédents</h4>
          <div className="space-y-3">
            {archiveMonths.map((month) => (
              <details key={month} className="bg-gray-50 rounded-lg p-3">
                <summary className="cursor-pointer font-medium text-navy">{CYCLE_MONTHS_FULL[month]}</summary>
                <div className="mt-3">{renderTable(feedback.filter((f) => f.month === month))}</div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRollCall;
