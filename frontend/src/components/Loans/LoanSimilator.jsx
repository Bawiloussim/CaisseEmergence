import { useState, useMemo } from 'react';
import ContributionController from '../../controllers/ContributionController';

const LoanSimulator = ({ members }) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState(50000);
  const [duration, setDuration] = useState(3);
  const result = useMemo(() => {
    if (!selectedMemberId || amount <= 0) return null;
    const summary = ContributionController.getMemberContributionSummary(parseInt(selectedMemberId)) || { totalPaid: 0 };
    const totalCotised = Number(summary.totalPaid || 0);
    const maxLoan = totalCotised * 1.5;
    const isValid = amount <= maxLoan;
    const interests = Math.round(amount * 0.1);
    const total = amount + interests;
    const monthly = Math.round(total / duration);

    return {
      totalCotised,
      maxLoan,
      isValid,
      interests,
      total,
      monthly,
    };
  }, [selectedMemberId, amount, duration]);

  // result is computed via useMemo above

  return (
    <div className="bg-linear-to-r from-navy to-navy/90 text-white rounded-xl p-6 shadow-lg">
      <h3 className="font-playfair text-lg font-bold mb-4">🧮 Simulateur de prêt</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/80 mb-1">Membre</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            <option value="" className="text-navy">Sélectionner un membre</option>
            {members.map(member => (
              <option key={member.id} value={member.id} className="text-navy">{member.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-1">Montant demandé (FCFA)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            min="5000"
            step="5000"
          />
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-1">Durée (mois, max 3)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            min="1"
            max="3"
          />
        </div>

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-gold/10 border border-gold">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/80">Solde cotisé</span>
                <span className="font-semibold">{result.totalCotised.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Plafond emprunt (150%)</span>
                <span className={`font-semibold ${result.isValid ? 'text-green-300' : 'text-red-300'}`}>
                  {result.maxLoan.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Intérêts (10%)</span>
                <span>{result.interests.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Total à rembourser</span>
                <span className="font-bold">{result.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Mensualité ({duration} mois)</span>
                <span className="text-gold font-bold">{result.monthly.toLocaleString('fr-FR')} FCFA/mois</span>
              </div>
              {!result.isValid && (
                <div className="mt-2 p-2 bg-red-500/30 rounded text-center text-sm">
                  ⚠️ Montant supérieur au plafond autorisé
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanSimulator;