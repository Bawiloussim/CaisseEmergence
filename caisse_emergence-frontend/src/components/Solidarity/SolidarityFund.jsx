// React import removed (not needed with new JSX transform)
import { HandHeart } from 'lucide-react';

const SolidarityFund = ({ data }) => {
  if (!data) return null;

  return (
    <div className="card bg-linear-to-r from-navy to-navy/90 text-gray-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-playfair text-lg font-bold">Fonds de solidarité</h3>
        <HandHeart size={28} className="text-gold" />
      </div>
      
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-gold">{data.total.toLocaleString('fr-FR')} FCFA</p>
        <p className="text-sm  text-gray-900 mt-1">Solde disponible</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className=" text-gray-900">Entrées totales</span>
          <span className="font-medium text-green-500">
            +{(data.fees + data.adhesion + data.penalties + data.loanInterests).toLocaleString('fr-FR')} FCFA
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-900">Aides versées</span>
          <span className="font-medium text-red-500">
            -{(data.aids || 0).toLocaleString('fr-FR')} FCFA
          </span>
        </div>
        <div className="border-t border-gray-300 my-2"></div>
        <div className="flex justify-between items-center pt-2">
          <span className="font-bold">Solde net</span>
            <span className="font-bold text-gold text-lg">{(data.total || 0).toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <p className="text-xs text-white/60 text-center">
          🤝 Le fonds de solidarité soutient les membres en situation d'urgence
        </p>
      </div>
    </div>
  );
};

export default SolidarityFund;