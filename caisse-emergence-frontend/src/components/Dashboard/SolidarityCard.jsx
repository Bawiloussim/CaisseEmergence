// React import removed (not needed with new JSX transform)
import { HandHeart } from 'lucide-react';

const SolidarityCard = ({ solidarityFund }) => {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-playfair text-lg font-bold text-navy">Fonds de solidarité</h3>
        <HandHeart size={24} className="text-gold" />
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="bg-linear-to-r from-navy to-navy/90 text-gray-100 p-6">
          <p className="text-4xl font-bold text-gold text-center">{solidarityFund.toLocaleString('fr-FR')} FCFA</p>
          <p className="text-center text-white/70 mt-2">Solde du fonds de solidarité</p>
        </div>
        <div className="bg-gray-40 p-4">
          <div className="space-y-2 text-sm text-navy">
            <div className="flex justify-between items-center">
              <span>Frais de gestion</span>
              <span className="font-medium">0 FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Aides versées</span>
              <span className="font-medium text-red-500">0 FCFA</span>
            </div>
            <div className="border-t border-gray-100 my-2"></div>
            <div className="flex justify-between items-center font-bold">
              <span>Total disponible</span>
              <span className="text-gold">{solidarityFund.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolidarityCard;