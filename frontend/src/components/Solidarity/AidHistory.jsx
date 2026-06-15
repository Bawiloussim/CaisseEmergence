// React import removed (not needed with new JSX transform)
import { Heart } from 'lucide-react';

const AidHistory = ({ aids, members }) => {
  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || 'Inconnu';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-header-rounded">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 text-left">Membre</th>
            <th className="py-3 text-right">Montant</th>
            <th className="py-3 text-left">Motif</th>
            <th className="py-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {aids.map(aid => (
            <tr key={aid.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 font-medium">{getMemberName(aid.memberId)}</td>
              <td className="py-3 text-right text-red-600 font-semibold">
                {aid.amount.toLocaleString('fr-FR')} FCFA
              </td>
              <td className="py-3">{aid.motif}</td>
              <td className="py-3 text-gray-500">{aid.date}</td>
            </tr>
          ))}
          {aids.length === 0 && (
            <tr>
              <td colSpan="4" className="py-8 text-center text-gray-400">
                <Heart size={24} className="mx-auto mb-2 text-gray-300" />
                Aucune aide enregistrée
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AidHistory;