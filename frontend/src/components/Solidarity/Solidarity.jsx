import { useState, useEffect, useCallback } from 'react';
import SolidarityFund from './SolidarityFund';
import AidHistory from './AidHistory';
import AidForm from './AidForm';
import SolidarityController from '../../controllers/SolidarityController';
import MemberController from '../../controllers/MemberController';
import { Plus } from 'lucide-react';

const Solidarity = ({ isSecretary }) => {
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [solidarityData, setSolidarityData] = useState(null);
  const [aids, setAids] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setMembers(MemberController.getAllMembers());
    const [fund, aidList] = await Promise.all([
      SolidarityController.getSolidarityFund(),
      SolidarityController.getAllAids(),
    ]);
    setSolidarityData(fund);
    setAids(aidList);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddAid = async (aidData) => {
    if (aidData.id) {
      const result = await SolidarityController.updateAid(aidData.id, aidData);
      if (result.success) {
        await loadData();
        setShowForm(false);
        setEditData(null);
      } else if (result.errors) {
        alert('Erreur: ' + result.errors.join('\n'));
      }
      return result;
    }

    const result = await SolidarityController.addAid(aidData);
    if (result.success) {
      await loadData();
      setShowForm(false);
    } else if (result.errors) {
      alert('Erreur: ' + result.errors.join('\n'));
    }
    return result;
  };

  const handleDeleteAid = async (aid) => {
    const member = members.find((m) => m.accountId === aid.memberId);
    if (!window.confirm(`Supprimer l'aide de ${aid.amount.toLocaleString('fr-FR')} FCFA pour ${member?.name || 'ce membre'} ?`)) {
      return;
    }
    const result = await SolidarityController.deleteAid(aid.id);
    if (result.success) {
      await loadData();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement de la solidarité…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SolidarityFund data={solidarityData} />

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-playfair text-lg font-bold text-navy">Historique des aides</h3>
            {isSecretary && (
              <button
                onClick={() => { setEditData(null); setShowForm(true); }}
                className="btn-gold flex items-center gap-2"
              >
                <Plus size={16} /> Nouvelle aide
              </button>
            )}
          </div>
          <AidHistory
            aids={aids}
            members={members}
            isSecretary={isSecretary}
            onEditAid={(aid) => { setEditData(aid); setShowForm(true); }}
            onDeleteAid={handleDeleteAid}
          />
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
          onClose={() => { setShowForm(false); setEditData(null); }}
          onSubmit={handleAddAid}
          members={members}
          currentFund={solidarityData?.total || 0}
          initialData={editData}
        />
      )}
    </div>
  );
};

export default Solidarity;
