import { useState, useEffect, useCallback, useMemo } from 'react';
import ContributionTable from './ContributionTable';
import ContributionForm from './ContributionForm';
import ContributionProofForm from './ContributionProofForm';
import ContributionController from '../../controllers/ContributionController';
import MemberController from '../../controllers/MemberController';
import { Plus, Smartphone, Upload, CheckCircle, Clock, Filter } from 'lucide-react';
import { MONTHS_FULL } from '../../models/ContributionModel';
import { useAuth } from '../Auth/AuthContext';
import Modal from '../UI/Modal';

const FLOOZ_NUMBER = '79854438';

const VALIDATOR_ROLES = ['secretaire', 'tresorier', 'president'];
const ROLE_LABELS = { secretaire: 'Secrétaire', tresorier: 'Trésorier', president: 'Président' };

const ContributionList = ({ isSecretary }) => {
  const [contributions, setContributions] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [viewingProof, setViewingProof] = useState(null);
  const [showOnlyPendingForMe, setShowOnlyPendingForMe] = useState(false);

  const { user, accountRole, canValidateContribution } = useAuth();
  // Le membre réellement connecté, pour qu'il ne puisse importer une
  // preuve de paiement que pour son propre compte.
  const currentMember = useMemo(
    () => members.find((m) => m.accountId === user?.id),
    [members, user]
  );

  // Membres ayant au moins une cotisation avec preuve encore en attente du
  // vote de l'utilisateur connecté (secrétaire, trésorier ou président).
  const memberIdsPendingForMe = useMemo(() => {
    if (!canValidateContribution) return new Set();
    return new Set(
      contributions
        .filter((c) => c.status === 'pending' && c.proofImage && !c.validations?.[accountRole]?.validated)
        .map((c) => c.memberId)
    );
  }, [contributions, accountRole, canValidateContribution]);

  const visibleMembers = showOnlyPendingForMe
    ? members.filter((m) => memberIdsPendingForMe.has(m.accountId))
    : members;

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

  const handleSubmitProof = async (proofData) => {
    if (!currentMember) {
      return { success: false, error: 'Votre compte membre est introuvable. Rechargez la page et réessayez.' };
    }
    const result = await ContributionController.addContribution({ ...proofData, memberId: currentMember.accountId });
    if (result.success) {
      await loadData();
      setShowProofForm(false);
    }
    return result;
  };

  const handleValidateContribution = async (contribution) => {
    const result = await ContributionController.validateContribution(contribution.id);
    if (result.success) {
      await loadData();
      setViewingProof(result.contribution);
    } else {
      alert(result.error || 'Erreur lors de la validation');
    }
  };

  const handleUnvalidateContribution = async (contribution) => {
    if (!window.confirm('Annuler votre validation pour cette cotisation ?')) return;
    const result = await ContributionController.unvalidateContribution(contribution.id);
    if (result.success) {
      await loadData();
      setViewingProof(result.contribution);
    } else {
      alert(result.error || "Erreur lors de l'annulation de la validation");
    }
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
        <div className="flex items-center gap-3">
          {canValidateContribution && (
            <button
              onClick={() => setShowOnlyPendingForMe((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium border transition-colors ${
                showOnlyPendingForMe
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-navy border-navy/15 shadow-sm hover:bg-gray-50'
              }`}
            >
              <Filter size={18} /> À valider{memberIdsPendingForMe.size > 0 ? ` (${memberIdsPendingForMe.size})` : ''}
            </button>
          )}
          {currentMember && (
            <button
              onClick={() => setShowProofForm(true)}
              className="flex items-center gap-2 bg-white text-navy border border-navy/15 shadow-sm px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Upload size={18} /> Importer ma preuve de paiement
            </button>
          )}
          {isSecretary && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-gold flex items-center gap-2"
            >
              <Plus size={18} /> Enregistrer paiement
            </button>
          )}
        </div>
      </div>

      <div className="alert-info bg-gold/10">
        <div className="bar" style={{ backgroundColor: '#c48a21' }} />
        <p className="text-sm text-navy flex items-center gap-2 flex-wrap">
          <Smartphone size={16} className="text-gold shrink-0" />
          <span>
            Dépôt mensuel par Flooz au numéro <strong>{FLOOZ_NUMBER}</strong>. Informez le secrétaire une fois le
            dépôt effectué pour qu'il enregistre votre paiement.
          </span>
        </p>
      </div>

      {showOnlyPendingForMe && visibleMembers.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">Aucune cotisation n'attend votre validation.</div>
      ) : (
        <ContributionTable
          contributions={contributions}
          members={visibleMembers}
          isSecretary={isSecretary}
          canValidate={canValidateContribution}
          currentMemberId={currentMember?.accountId}
          onEditContribution={(c) => { setEditData(c); setShowForm(true); }}
          onDeleteContribution={handleDeleteContribution}
          onViewProof={setViewingProof}
        />
      )}

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

      {showProofForm && currentMember && (
        <ContributionProofForm
          onClose={() => setShowProofForm(false)}
          onSubmit={handleSubmitProof}
          member={currentMember}
          existingMonths={contributions.filter((c) => c.memberId === currentMember.accountId).map((c) => c.month)}
        />
      )}

      {viewingProof && (
        <Modal onClose={() => setViewingProof(null)} title="Preuve de paiement">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {members.find((m) => m.accountId === viewingProof.memberId)?.name || 'Membre'} —{' '}
              {MONTHS_FULL[viewingProof.month] || viewingProof.month} — {viewingProof.amount.toLocaleString('fr-FR')} FCFA
            </p>
            <img src={viewingProof.proofImage} alt="Preuve de paiement" className="w-full rounded-lg border" />

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">
                Validation ({VALIDATOR_ROLES.filter((r) => viewingProof.validations?.[r]?.validated).length}/3)
              </p>
              {VALIDATOR_ROLES.map((role) => {
                const v = viewingProof.validations?.[role];
                const validator = v?.by && members.find((m) => m.accountId === v.by);
                return (
                  <div key={role} className="flex items-center gap-2 text-sm">
                    {v?.validated
                      ? <CheckCircle size={14} className="text-green-600" />
                      : <Clock size={14} className="text-gray-300" />}
                    <span className={v?.validated ? 'text-navy' : 'text-gray-400'}>
                      {ROLE_LABELS[role]}{v?.validated && validator ? ` — ${validator.name}` : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingProof(null)} className="btn-outline">Fermer</button>
              {canValidateContribution && viewingProof.validations?.[accountRole]?.validated ? (
                <button
                  onClick={() => handleUnvalidateContribution(viewingProof)}
                  className="border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Annuler ma validation
                </button>
              ) : canValidateContribution && (
                <button onClick={() => handleValidateContribution(viewingProof)} className="btn-primary">
                  Valider en tant que {ROLE_LABELS[accountRole]}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContributionList;
