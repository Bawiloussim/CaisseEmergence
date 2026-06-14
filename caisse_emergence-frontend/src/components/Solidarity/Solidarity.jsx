import { useState, useMemo } from 'react';
import SolidarityFund from './SolidarityFund';
import AidHistory from './AidHistory';
import AidForm from './AidForm';
import SolidarityController from '../../controllers/SolidarityController';
import MemberController from '../../controllers/MemberController';
import { Plus } from 'lucide-react';

const Solidarity = ({ isSecretary }) => {
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const solidarityData = useMemo(() => {
    void refresh;
    return SolidarityController.getSolidarityFund();
  }, [refresh]);

  const aids = useMemo(() => {
    void refresh;
    return SolidarityController.getAllAids();
  }, [refresh]);

  const members = useMemo(() => {
    void refresh;
    return MemberController.getAllMembers();
  }, [refresh]);

  const handleAddAid = (aidData) => {
    const result = SolidarityController.addAid(aidData);
    if (result.success) {
      setRefresh(prev => prev + 1);
      setShowForm(false);
    }
    return result;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SolidarityFund data={solidarityData} />
        
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-playfair text-lg font-bold text-navy">Historique des aides</h3>
            {isSecretary && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-gold flex items-center gap-2"
              >
                <Plus size={16} /> Nouvelle aide
              </button>
            )}
          </div>
          <AidHistory aids={aids} members={members} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">Sources du fonds de solidarité</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">💰</div>
              <div>
                <p className="font-medium">Frais de gestion mensuels</p>
                <p className="text-sm text-gray-500">300 FCFA par cotisation</p>
              </div>
            </div>
            <span className="font-semibold">{solidarityData?.fees?.toLocaleString('fr-FR') || 0} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">📋</div>
              <div>
                <p className="font-medium">Frais d'adhésion</p>
                <p className="text-sm text-gray-500">2 000 FCFA par nouveau membre (dès 2027)</p>
              </div>
            </div>
            <span className="font-semibold">{solidarityData?.adhesion?.toLocaleString('fr-FR') || 0} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">⚠️</div>
              <div>
                <p className="font-medium">Pénalités de retard</p>
                <p className="text-sm text-gray-500">Cotisations en retard</p>
              </div>
            </div>
            <span className="font-semibold">{solidarityData?.penalties?.toLocaleString('fr-FR') || 0} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">🏦</div>
              <div>
                <p className="font-medium">Intérêts de prêts (30%)</p>
                <p className="text-sm text-gray-500">30% des intérêts collectés</p>
              </div>
            </div>
            <span className="font-semibold">{solidarityData?.loanInterests?.toLocaleString('fr-FR') || 0} FCFA</span>
          </div>
          <div className="border-t pt-3 mt-2">
            <div className="flex justify-between items-center p-3 bg-navy text-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">🤝</div>
                <p className="font-medium">Total disponible</p>
              </div>
              <span className="font-bold text-gold text-lg">{solidarityData?.total?.toLocaleString('fr-FR') || 0} FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <AidForm
          onClose={() => setShowForm(false)}
          onSubmit={handleAddAid}
          members={members}
          currentFund={solidarityData?.total || 0}
        />
      )}
    </div>
  );
};

export default Solidarity;