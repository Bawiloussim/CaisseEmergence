import { useState, useMemo } from 'react';
import ContributionTable from './ContributionTable';
import ContributionForm from './ContributionForm';
import ContributionController from '../../controllers/ContributionController';
import MemberController from '../../controllers/MemberController';
import { Plus } from 'lucide-react';
import { MONTHS_FULL } from '../../models/ContributionModel';
import { useAuth } from '../Auth/AuthContext';
import ActivityLogService from '../../services/ActivityLogService';

const ContributionList = ({ isSecretary }) => {
  const [refresh, setRefresh] = useState(0);
  const contributions = useMemo(() => {
    void refresh;
    return ContributionController.getAllContributions();
  }, [refresh]);

  const monthlyTotals = useMemo(() => {
    void refresh;
    return ContributionController.getMonthlyTotals();
  }, [refresh]);

  const members = useMemo(() => {
    void refresh;
    return MemberController.getAllMembers();
  }, [refresh]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const { user } = useAuth();

  const logContribution = (action, contributionData) => {
    const member = members.find((m) => m.id === parseInt(contributionData.memberId));
    ActivityLogService.log({
      action,
      resource: 'contribution',
      label: `${member?.name || 'Membre inconnu'} — ${MONTHS_FULL[contributionData.month] || contributionData.month} (${contributionData.amount} FCFA)`,
      actorName: user?.name,
    });
  };

  const handleAddContribution = (contributionData) => {
    // If editing (has id), update directly
    if (contributionData.id) {
      const upd = ContributionController.updateContribution(contributionData.id, contributionData);
      if (upd.success) {
        logContribution('update', contributionData);
        setRefresh(prev => prev + 1);
        setShowForm(false);
        setEditData(null);
      } else {
        alert(upd.error || 'Erreur lors de la mise à jour');
      }
      return upd;
    }

    // otherwise try add; if exists, offer update
    const result = ContributionController.addContribution(contributionData);
    if (result.success) {
      logContribution('create', contributionData);
      setRefresh(prev => prev + 1);
      setShowForm(false);
      return result;
    }

    if (result.error && result.error.toLowerCase().includes('déjà')) {
      const existing = ContributionController.getContributionByMemberAndMonth(contributionData.memberId, contributionData.month);
      if (existing) {
        if (window.confirm('Une cotisation existe déjà pour ce membre et ce mois. Voulez-vous la mettre à jour ?')) {
          const upd = ContributionController.updateContribution(existing.id, contributionData);
          if (upd.success) {
            logContribution('update', contributionData);
            setRefresh(prev => prev + 1);
            setShowForm(false);
          } else {
            alert(upd.error || 'Erreur lors de la mise à jour');
          }
          return upd;
        }
      }
    }

    return result;
  };

  const handleDeleteContribution = (contribution) => {
    const member = members.find((m) => m.id === parseInt(contribution.memberId));
    if (!window.confirm(`Supprimer la cotisation de ${member?.name || 'ce membre'} pour ${MONTHS_FULL[contribution.month] || contribution.month} (${contribution.amount.toLocaleString('fr-FR')} FCFA) ?`)) {
      return;
    }
    const result = ContributionController.deleteContribution(contribution.id);
    if (result.success) {
      ActivityLogService.log({
        action: 'delete',
        resource: 'contribution',
        label: `Cotisation de ${member?.name || 'Inconnu'} — ${MONTHS_FULL[contribution.month] || contribution.month} (${contribution.amount} FCFA) supprimée`,
        actorName: user?.name,
      });
      setRefresh(prev => prev + 1);
    }
  };

  // editing is handled by opening the form and passing `initialData` prop when needed

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="font-playfair text-2xl font-bold text-navy">Bulletin des cotisations</h2>
        {isSecretary && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-gold flex items-center gap-2"
          >
            <Plus size={18} /> Enregistrer paiement
          </button>
        )}
      </div>

      <ContributionTable
        contributions={contributions}
        members={members}
        isSecretary={isSecretary}
        onEditContribution={(c) => { setEditData(c); setShowForm(true); }}
        onDeleteContribution={handleDeleteContribution}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(monthlyTotals).map(month => {
          const m = monthlyTotals[month];
          return (
            <div key={month} className="p-3 rounded-lg bg-white border">
              <div className="text-sm text-gray-500">{MONTHS_FULL[month]}</div>
              <div className="text-lg font-bold text-navy">{m.totalAmount.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-gray-400">Attendu: {m.expectedAmount.toLocaleString('fr-FR')} FCFA</div>
              {m.missingAmount > 0 ? (
                <div className="text-sm text-red-600 mt-1">Manquant: {m.missingAmount.toLocaleString('fr-FR')} FCFA</div>
              ) : (
                <div className="text-sm text-green-600 mt-1">Complet</div>
              )}
            </div>
          );
        })}
      </div>

      {showForm && (
        <ContributionForm
          onClose={() => { setShowForm(false); setEditData(null); }}
          onSubmit={handleAddContribution}
          members={members}
          initialData={editData}
        />
      )}
    </div>
  );
};

export default ContributionList;