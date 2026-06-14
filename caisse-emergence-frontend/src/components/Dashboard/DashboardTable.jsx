// React import removed (not needed with new JSX transform)
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import MemberController from '../../controllers/MemberController';

const DashboardTable = ({ contributions }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return { icon: CheckCircle, text: 'Payé', class: 'text-green-600 bg-green-50' };
      case 'pending':
        return { icon: Clock, text: 'En attente', class: 'text-yellow-600 bg-yellow-50' };
      case 'late':
        return { icon: XCircle, text: 'En retard', class: 'text-red-600 bg-red-50' };
      default:
        return { icon: Clock, text: 'Inconnu', class: 'text-gray-600 bg-gray-50' };
    }
  };

  return (
    <div className="card overflow-hidden">
      <h3 className="font-playfair text-lg font-bold text-navy mb-4">État des cotisations récentes</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-navy text-white">
              <th className="text-left px-4 py-4 text-sm font-semibold">Membre</th>
              <th className="text-left px-4 py-4 text-sm font-semibold">Mois</th>
              <th className="text-left px-4 py-4 text-sm font-semibold">Statut</th>
              <th className="text-right px-4 py-4 text-sm font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map((contribution) => {
              const member = MemberController.getMemberById(contribution.memberId);
              const status = getStatusBadge(contribution.status);
              const StatusIcon = status.icon;
              return (
                <tr key={contribution.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{member?.name || 'Inconnu'}</td>
                  <td className="px-4 py-3 text-sm">{contribution.month}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${status.class}`}>
                      <StatusIcon size={12} /> {status.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {(contribution.amount + contribution.fees).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              );
            })}
            {contributions.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-400">
                  Aucune cotisation enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardTable;