import { useState } from 'react';
import Modal from '../UI/Modal';

const AidForm = ({ onClose, onSubmit, members, currentFund }) => {
  const [formData, setFormData] = useState({
    memberId: '',
    amount: 10000,
    motif: 'Santé / Hospitalisation',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });

  const motifs = [
    'Santé / Hospitalisation',
    'Décès (proche)',
    'Catastrophe',
    'Autre urgence',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      alert('Veuillez sélectionner un membre');
      return;
    }
    if (formData.amount > currentFund) {
      alert(`Fonds insuffisants ! Disponible: ${currentFund.toLocaleString('fr-FR')} FCFA`);
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal onClose={onClose} title="Enregistrer une aide">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg mb-2">
          <p className="text-sm text-blue-700">
            💡 Fonds disponible: <strong>{currentFund.toLocaleString('fr-FR')} FCFA</strong>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membre bénéficiaire *</label>
          <select
            name="memberId"
            value={formData.memberId}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Sélectionner un membre</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              min="1000"
              step="1000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <select
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              className="input"
            >
              {motifs.map(motif => (
                <option key={motif} value={motif}>{motif}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (détails)</label>
            <input
              type="text"
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="input"
              placeholder="Précisez la situation..."
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-outline">
            Annuler
          </button>
          <button type="submit" className="btn">
            Enregistrer l'aide
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AidForm;