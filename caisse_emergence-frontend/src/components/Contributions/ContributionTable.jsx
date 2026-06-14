// React import removed (not needed with new JSX transform)
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const ContributionTable = ({ contributions, members, isSecretary = false, onEditContribution }) => {
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

  const getMonthContribution = (memberId, month) => {
    return contributions.find(c => c.memberId === memberId && c.month === month);
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Payé</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-yellow-600"><Clock size={14} /> Attente</span>;
      case 'late':
        return <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={14} /> Retard</span>;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  const totals = members.reduce((acc, member) => {
    acc.amount += getMemberTotal(member.id);
    acc.fees += getMemberFees(member.id);
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
            const totalCot = getMemberTotal(member.id);
            return (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                {MONTHS.map(month => {
                  const contrib = getMonthContribution(member.id, month);
                  return (
                    <td key={month} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div>
                          {contrib ? getStatusDisplay(contrib.status) : '—'}
                        </div>
                        {isSecretary && contrib && (
                          <button
                            onClick={() => onEditContribution && onEditContribution(contrib)}
                            className="text-xs text-navy/80 hover:underline mt-1"
                          >Modifier</button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-semibold">{totalCot.toLocaleString('fr-FR')} FCFA</td>
                <td className="px-4 py-3 text-right">{getMemberFees(member.id).toLocaleString('fr-FR')} FCFA</td>
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