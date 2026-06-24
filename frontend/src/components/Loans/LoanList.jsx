import { useState, useEffect, useCallback, useMemo } from 'react';
import LoanSimulator from './LoanSimilator';
import LoanForm from './LoanForm';
import LoanController from '../../controllers/LoanController';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import { Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import PDFService from '../../services/PDFService';
import StorageService from '../../services/StorageService';

const LoanList = ({ isSecretary }) => {
  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [ceilings, setCeilings] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  // Le membre réellement connecté (compte authentifié), pour que chaque
  // vote soit forcément celui de la personne derrière l'écran — personne
  // ne peut voter "à la place" d'un autre membre.
  const currentMember = useMemo(
    () => members.find((m) => m.accountId === user?.id),
    [members, user]
  );

  const loadData = useCallback(async () => {
    const memberList = MemberController.getAllMembers();
    setMembers(memberList);
    const loanList = await LoanController.getAllLoans();
    setLoans(loanList);

    const ceilingEntries = await Promise.all(
      memberList.map(async (m) => [m.accountId, await ContributionController.computeLoanCeiling(m.accountId)])
    );
    setCeilings(Object.fromEntries(ceilingEntries));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCastVote = async (loanId, vote) => {
    if (!currentMember) {
      alert('Votre compte membre est introuvable. Rechargez la page et réessayez.');
      return;
    }
    const res = await LoanController.addVote(loanId, vote);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || 'Erreur lors du vote');
    }
  };

  const handleToggleInstallment = async (loan, installment) => {
    const nextStatus = installment.status === 'paid' ? 'pending' : 'paid';
    const res = await LoanController.setInstallmentStatus(loan.id, installment.installmentNumber, nextStatus);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || 'Erreur lors de la mise à jour de la mensualité');
    }
  };

  const handleDeleteLoan = async (loan) => {
    const member = members.find((m) => m.accountId === loan.memberId);
    if (!window.confirm(`Supprimer la demande de prêt de ${member?.name || 'ce membre'} (${loan.amount.toLocaleString('fr-FR')} FCFA) ?`)) {
      return;
    }
    const res = await LoanController.deleteLoan(loan.id);
    if (res.success) {
      await loadData();
    }
  };

  const handleAddLoan = async (loanData) => {
    // Édition d'un prêt existant
    if (loanData.id) {
      const res = await LoanController.updateLoan(loanData.id, loanData);
      if (res.success) {
        await loadData();
        setShowForm(false);
        setEditLoan(null);
        return res;
      }
      if (res.errors) {
        alert('Erreur: ' + res.errors.join('\n'));
      } else {
        alert(res.message || res.error || 'Erreur lors de la mise à jour du prêt');
      }
      return res;
    }

    const member = MemberController.getMemberByAccountId(loanData.memberId);
    const result = await LoanController.addLoan(loanData);
    if (result.success) {
      await loadData();
      setShowForm(false);
      // génère le contrat PDF pour signature et un formulaire pré-rempli
      try {
        PDFService.generateLoanContract(result.loan, member, StorageService.getSettings());
      } catch (err) {
        console.error('Erreur génération contrat PDF', err);
      }
      try {
        PDFService.generateLoanForm(member, result.loan);
        alert('Demande enregistrée — contrat et formulaire PDF générés.');
      } catch (err) {
        console.error('Erreur génération formulaire prêt', err);
      }
      return result;
    }

    if (result.errors && result.errors.length) {
      alert('Erreur lors de l\'enregistrement du prêt:\n' + result.errors.join('\n'));
    } else if (result.message || result.error) {
      alert(result.message || result.error || 'Erreur lors de l\'enregistrement du prêt');
    }
    return result;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">✅ Approuvé</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">⏳ En attente</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">❌ Refusé</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">—</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des prêts…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-yellow-500" />
          <p className="text-sm text-yellow-700">
            <strong>Phase pilote (juin–novembre 2026)</strong> — Aucun prêt n'est accordé pendant cette période.
            Les prêts seront disponibles à partir de janvier 2027.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoanSimulator members={members} />

        <div className="card">
          <button
            onClick={() => {
              if (!isSecretary && !currentMember) {
                alert('Votre compte membre est introuvable. Rechargez la page et réessayez.');
                return;
              }
              setEditLoan(null);
              setShowForm(true);
            }}
            className="w-full bg-gold text-navy py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gold-light transition-all"
          >
            <Plus size={20} /> Nouvelle demande de prêt
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Registre des prêts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
                <tr className="bg-navy text-white">
                  <th className="px-4 py-3 text-left">Membre</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-right">Plafond (150%)</th>
                  <th className="px-4 py-3 text-right">Intérêts (10%)</th>
                  <th className="px-4 py-3 text-right">Total dû</th>
                  <th className="px-4 py-3 text-right">Mensualité</th>
                  <th className="px-4 py-3 text-center">Durée</th>
                  <th className="px-4 py-3 text-left">Motif</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-center">Remboursement</th>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const member = members.find(m => m.accountId === loan.memberId);
                return (
                  <tr key={loan.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{member?.name || 'Inconnu'}</td>
                      <td className="px-4 py-3 text-right">{loan.amount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{(ceilings[loan.memberId] || 0).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right">{loan.interests.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right font-semibold">{loan.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-right">{loan.monthlyPayment.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-center">{loan.duration} mois</td>
                    <td className="px-4 py-3">{loan.motif || '—'}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {loan.status === 'approved' && loan.repayments?.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">
                            {loan.repayments.filter((r) => r.status === 'paid').length}/{loan.repayments.length} mensualités
                          </span>
                          <div className="flex gap-1">
                            {loan.repayments.map((r) => (
                              <button
                                key={r.installmentNumber}
                                type="button"
                                disabled={!isSecretary}
                                onClick={() => isSecretary && handleToggleInstallment(loan, r)}
                                title={`Mensualité ${r.installmentNumber} : ${r.amount.toLocaleString('fr-FR')} FCFA${r.status === 'paid' ? ` (payée le ${r.paymentDate})` : ' (en attente)'}`}
                                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                  r.status === 'paid' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                } ${isSecretary ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                              >
                                {r.installmentNumber}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{loan.requestDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {loan.status === 'pending' && (
                            <>
                              {(() => {
                                const yesCount = loan.votes?.filter((v) => v.vote === 'yes').length || 0;
                                const noCount = loan.votes?.filter((v) => v.vote === 'no').length || 0;
                                return (
                                  <span className="text-xs text-gray-500 mr-1">
                                    {yesCount} oui · {noCount} non
                                  </span>
                                );
                              })()}
                              {(() => {
                                const existingVote = currentMember
                                  ? loan.votes?.find((v) => v.memberId === currentMember.accountId)
                                  : null;
                                const isOwnLoan = currentMember && currentMember.accountId === loan.memberId;

                                if (isOwnLoan) {
                                  return <span className="text-xs text-gray-400 italic">Vous ne pouvez pas voter sur votre propre demande</span>;
                                }
                                if (!currentMember) {
                                  return <span className="text-xs text-gray-400 italic">Connectez-vous avec un compte membre pour voter</span>;
                                }
                                return (
                                  <>
                                    <button
                                      onClick={() => handleCastVote(loan.id, 'yes')}
                                      className={`px-3 py-1 rounded ${existingVote?.vote === 'yes' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}
                                    >
                                      Oui
                                    </button>
                                    <button
                                      onClick={() => handleCastVote(loan.id, 'no')}
                                      className={`px-3 py-1 rounded ${existingVote?.vote === 'no' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
                                    >
                                      Non
                                    </button>
                                  </>
                                );
                              })()}
                              <button onClick={() => PDFService.generateLoanForm(member, loan)} className="px-3 py-1 bg-white text-navy border rounded">Générer formulaire</button>
                            </>
                          )}

                          {/* Le contrat et la modification restent disponibles quel que soit le statut,
                              pour corriger une erreur de saisie même après approbation/refus du prêt. */}
                          <button onClick={() => PDFService.generateLoanContract(loan, member, StorageService.getSettings())} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">Générer contrat</button>
                          {isSecretary && (
                            <>
                              <button onClick={() => { setEditLoan(loan); setShowForm(true); }} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">Modifier</button>
                              <button onClick={() => handleDeleteLoan(loan)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Supprimer</button>
                            </>
                          )}
                        </div>
                      </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-400">
                    Aucun prêt enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <LoanForm
          onClose={() => { setShowForm(false); setEditLoan(null); }}
          onSubmit={handleAddLoan}
          members={isSecretary ? members : [currentMember].filter(Boolean)}
          initialData={editLoan}
          isSecretary={isSecretary}
        />
      )}
    </div>
  );
};

export default LoanList;
