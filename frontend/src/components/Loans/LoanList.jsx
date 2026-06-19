import { useState, useMemo } from 'react';
import LoanSimulator from './LoanSimilator';
import LoanForm from './LoanForm';
import LoanController from '../../controllers/LoanController';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import { Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import PDFService from '../../services/PDFService';
import StorageService from '../../services/StorageService';
import ActivityLogService from '../../services/ActivityLogService';

const LoanList = ({ isSecretary }) => {
  const [showForm, setShowForm] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const loans = useMemo(() => {
    void refresh;
    return LoanController.getAllLoans();
  }, [refresh]);

  const members = useMemo(() => {
    void refresh;
    return MemberController.getAllMembers();
  }, [refresh]);

  // loans and members are derived via useMemo on `refresh`

  const { user } = useAuth();
  // Le membre réellement connecté (compte authentifié), pour que chaque
  // vote soit forcément celui de la personne derrière l'écran — personne
  // ne peut voter "à la place" d'un autre membre.
  const currentMember = useMemo(
    () => members.find((m) => m.accountId === user?.id),
    [members, user]
  );

  const handleCastVote = (loanId, vote) => {
    if (!currentMember) {
      alert('Votre compte membre est introuvable. Rechargez la page et réessayez.');
      return;
    }
    const res = LoanController.addVote(loanId, currentMember.id, vote);
    if (res.success) {
      const loan = loans.find((l) => l.id === parseInt(loanId));
      const member = members.find((m) => m.id === loan?.memberId);
      ActivityLogService.log({
        action: 'update',
        resource: 'loan',
        label: `Vote "${vote === 'yes' ? 'Oui' : 'Non'}" de ${currentMember.name} sur le prêt de ${member?.name || 'Inconnu'}`,
        actorName: user?.name,
      });
      setRefresh(prev => prev + 1);
    } else {
      alert(res.message || 'Erreur lors du vote');
    }
  };

  const handleAddLoan = (loanData) => {
    // If editing existing loan
    if (loanData.id) {
      const res = LoanController.updateLoan(loanData.id, loanData);
      if (res.success) {
        const member = members.find((m) => m.id === res.loan.memberId);
        ActivityLogService.log({
          action: 'update',
          resource: 'loan',
          label: `Prêt de ${member?.name || 'Inconnu'} — ${res.loan.amount} FCFA`,
          actorName: user?.name,
        });
        setRefresh(prev => prev + 1);
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

    const member = MemberController.getMemberById(loanData.memberId);
    const summary = ContributionController.getMemberContributionSummary(member.id) || { totalPaid: 0 };
    const totalCotised = Number(summary.totalPaid || 0);
    const result = LoanController.addLoan(loanData, totalCotised);
    if (result.success) {
      ActivityLogService.log({
        action: 'create',
        resource: 'loan',
        label: `Prêt de ${member?.name || 'Inconnu'} — ${result.loan.amount} FCFA`,
        actorName: user?.name,
      });
      setRefresh(prev => prev + 1);
      setShowForm(false);
      // generate loan contract PDF for signature and a prefilled form
      try {
        PDFService.generateLoanContract(result.loan, member, StorageService.getSettings());
      } catch (err) {
        console.error('Erreur génération contrat PDF', err);
      }
      try {
        PDFService.generateLoanForm(member, StorageService.getSettings(), result.loan);
        alert('Demande enregistrée — contrat et formulaire PDF générés.');
      } catch (err) {
        console.error('Erreur génération formulaire prêt', err);
      }
      return result;
    }

    // show errors to user
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
        
        {isSecretary && (
          <div className="card">
            <button
              onClick={() => { setEditLoan(null); setShowForm(true); }}
              className="w-full bg-gold text-navy py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gold-light transition-all"
            >
              <Plus size={20} /> Nouvelle demande de prêt
            </button>
          </div>
        )}
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
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                return (
                  <tr key={loan.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{member?.name || 'Inconnu'}</td>
                      <td className="px-4 py-3 text-right">{loan.amount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{ContributionController.computeLoanCeiling(loan.memberId).toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right">{loan.interests.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-right font-semibold">{loan.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-right">{loan.monthlyPayment.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-center">{loan.duration} mois</td>
                    <td className="px-4 py-3">{loan.motif || '—'}</td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="px-4 py-3 text-center">{loan.requestDate}</td>
                      <td className="px-4 py-3">
                        {loan.status === 'pending' && (
                          <div className="flex items-center gap-2 flex-wrap">
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
                                ? loan.votes?.find((v) => parseInt(v.memberId) === currentMember.id)
                                : null;
                              const isOwnLoan = currentMember && currentMember.id === loan.memberId;

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

                            {isSecretary && (
                              <button onClick={() => { setEditLoan(loan); setShowForm(true); }} className="px-3 py-1 bg-gray-100 text-gray-700 rounded">Modifier</button>
                            )}
                            <button onClick={() => PDFService.generateLoanContract(loan, member, StorageService.getSettings())} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">Générer contrat</button>
                            <button onClick={() => PDFService.generateLoanForm(member, StorageService.getSettings(), loan)} className="px-3 py-1 bg-white text-navy border rounded">Générer formulaire</button>
                          </div>
                        )}
                        {loan.status === 'approved' && (
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => PDFService.generateLoanContract(loan, member, StorageService.getSettings())}
                              className="px-3 py-1 bg-navy text-white rounded"
                            >
                              Contrat PDF
                            </button>
                          </div>
                        )}
                      </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-gray-400">
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
          members={members}
          initialData={editLoan}
        />
      )}
    </div>
  );
};

export default LoanList;