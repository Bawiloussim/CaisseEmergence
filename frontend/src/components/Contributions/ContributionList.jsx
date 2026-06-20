import { useState, useEffect, useCallback } from 'react';
import ContributionTable from './ContributionTable';
import ContributionForm from './ContributionForm';
import ContributionController from '../../controllers/ContributionController';
import MemberController from '../../controllers/MemberController';
import { Plus } from 'lucide-react';
import { MONTHS_FULL } from '../../models/ContributionModel';

const ContributionList = ({ isSecretary }) => {
  const [contributions, setContributions] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadData = useCallback(async () => {
    setMembers(MemberController.getAllMembers());
    const [contribs, totals] = await Promise.all([
      ContributionController.getAllContributions(),
      ContributionController.getMonthlyTotals(),
    ]);
    setContributions(contribs);
    setMonthlyTotals(totals);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddContribution = async (contributionData) => {
    // Édition (a un id) : mise à jour directe
    if (contributionData.id) {
      const upd = await ContributionController.updateContribution(contributionData.id, contributionData);
      if (upd.success) {
        await loadData();
        setShowForm(false);
        setEditData(null);
      } else {
        alert(upd.error || 'Erreur lors de la mise à jour');
      }
      return upd;
    }

    // Sinon on tente la création ; si elle existe déjà, on propose la mise à jour
    const result = await ContributionController.addContribution(contributionData);
    if (result.success) {
      await loadData();
      setShowForm(false);
      return result;
    }

    if (result.error && result.error.toLowerCase().includes('déjà')) {
      const existing = await ContributionController.getContributionByMemberAndMonth(contributionData.memberId, contributionData.month);
      if (existing) {
        if (window.confirm('Une cotisation existe déjà pour ce membre et ce mois. Voulez-vous la mettre à jour ?')) {
          const upd = await ContributionController.updateContribution(existing.id, contributionData);
          if (upd.success) {
            await loadData();
            setShowForm(false);
          } else {
            alert(upd.error || 'Erreur lors de la mise à jour');
          }
          return upd;
        }
      }
    } else {
      alert(result.error || (result.errors && result.errors.join('\n')) || 'Erreur lors de l\'enregistrement');
    }

    return result;
  };

  const handleDeleteContribution = async (contribution) => {
    const member = members.find((m) => m.accountId === contribution.memberId);
    if (!window.confirm(`Supprimer la cotisation de ${member?.name || 'ce membre'} pour ${MONTHS_FULL[contribution.month] || contribution.month} (${contribution.amount.toLocaleString('fr-FR')} FCFA) ?`)) {
      return;
    }
    const result = await ContributionController.deleteContribution(contribution.id);
    if (result.success) {
      await loadData();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des cotisations…</div>;
  }

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
