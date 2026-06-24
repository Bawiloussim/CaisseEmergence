// React import removed (not needed with new JSX transform)
import { CheckCircle, Clock, XCircle, Image as ImageIcon } from 'lucide-react';

const ContributionTable = ({
  contributions,
  members,
  isSecretary = false,
  canValidate = false,
  currentMemberId,
  onEditContribution,
  onDeleteContribution,
  onViewProof,
}) => {
  const MONTHS = ['JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE'];
  const MONTH_LABELS = ['Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov'];

  const getMemberContributions = (memberId) => {
    return contributions.filter(c => c.memberId === memberId);
  };

  const getMemberTotal = (memberId) => {
    return getMemberContributions(memberId)
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const getMemberFees = (memberId) => {
    return getMemberContributions(memberId)
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.fees, 0);
  };

  // Un membre peut avoir plusieurs versements pour le même mois (paiements
  // fractionnés) : on les retourne tous, empilés dans la cellule.
  const getMonthContributions = (memberId, month) => {
    return contributions.filter(c => c.memberId === memberId && c.month === month);
  };

  const getValidationCount = (contribution) => {
    if (!contribution?.validations) return 0;
    return ['secretaire', 'tresorier', 'president'].filter((role) => contribution.validations[role]?.validated).length;
  };

  const getStatusDisplay = (contribution) => {
    switch (contribution.status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Payé</span>;
      case 'pending': {
        const count = getValidationCount(contribution);
        return (
          <span className="inline-flex items-center gap-1 text-yellow-600">
            <Clock size={14} /> Attente{count > 0 ? ` (${count}/3)` : ''}
          </span>
        );
      }
      case 'late':
        return <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={14} /> Retard</span>;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  const totals = members.reduce((acc, member) => {
    acc.amount += getMemberTotal(member.accountId);
    acc.fees += getMemberFees(member.accountId);
    return acc;
  }, { amount: 0, fees: 0 });

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm table-header-rounded">
        <thead>
          <tr className="bg-navy text-white">
            <th className="px-4 py-4 text-left">Membre</th>
            {MONTH_LABELS.map(month => (
              <th key={month} className="px-3 py-4 text-center">{month}</th>
            ))}
            <th className="px-4 py-4 text-right">Total cotisé</th>
            <th className="px-4 py-4 text-right">Frais gestion</th>
            <th className="px-4 py-4 text-right">Solde prêt (150%)</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => {
            const totalCot = getMemberTotal(member.accountId);
            return (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                {MONTHS.map(month => {
                  const monthContribs = getMonthContributions(member.accountId, month);
                  return (
                    <td key={month} className="px-3 py-3 text-center">
                      {monthContribs.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="flex flex-col items-stretch gap-2 divide-y divide-gray-100">
                          {monthContribs.map((contrib) => (
                            <div key={contrib.id} className="flex flex-col items-center gap-1 pt-1 first:pt-0">
                              <div className="flex flex-col items-center">
                                {getStatusDisplay(contrib)}
                                <span className="text-[11px] text-gray-400">{contrib.amount.toLocaleString('fr-FR')} FCFA</span>
                              </div>
                              {contrib.proofImage && (isSecretary || canValidate || contrib.memberId === currentMemberId) && (
                                <button
                                  onClick={() => onViewProof && onViewProof(contrib)}
                                  title="Voir la preuve de paiement"
                                  className="text-xs text-navy/80 hover:underline inline-flex items-center gap-1"
                                >
                                  <ImageIcon size={12} /> Preuve
                                </button>
                              )}
                              {isSecretary && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onEditContribution && onEditContribution(contrib)}
                                    className="text-xs text-navy/80 hover:underline"
                                  >Modifier</button>
                                  <button
                                    onClick={() => onDeleteContribution && onDeleteContribution(contrib)}
                                    className="text-xs text-red-600 hover:underline"
                                  >Supprimer</button>
                                </div>
                              )}
                            </div>
                          ))}
                          {monthContribs.length > 1 && (
                            <p className="text-[10px] text-gray-400 pt-1">
                              Total : {monthContribs.reduce((s, c) => s + c.amount, 0).toLocaleString('fr-FR')} FCFA
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-semibold">{totalCot.toLocaleString('fr-FR')} FCFA</td>
                <td className="px-4 py-3 text-right">{getMemberFees(member.accountId).toLocaleString('fr-FR')} FCFA</td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">{(totalCot * 1.5).toLocaleString('fr-FR')} FCFA</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-navy text-white font-bold">
            <td colSpan={MONTHS.length + 1} className="px-4 py-3">TOTAUX</td>
            <td className="px-4 py-3 text-right">{totals.amount.toLocaleString('fr-FR')} FCFA</td>
            <td className="px-4 py-3 text-right">{totals.fees.toLocaleString('fr-FR')} FCFA</td>
            <td className="px-4 py-3 text-right">{(totals.amount * 1.5).toLocaleString('fr-FR')} FCFA</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ContributionTable;