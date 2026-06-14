import { useState } from 'react';
import Modal from '../UI/Modal';

const ContributionForm = ({ onClose, onSubmit, members, initialData }) => {
  const [formData, setFormData] = useState(() => ({
    memberId: '',
    month: 'JUIN',
    amount: 5000,
    fees: 300,
    status: 'paid',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Mobile Money',
    reference: '',
    ...(initialData || {}),
  }));

  // update when editing an existing contribution
  useState(() => {
    // no-op to keep ESLint happy; initial state set above
    return null;
  });

  const months = [
    'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE',
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = (name === 'memberId') ? (value === '' ? '' : parseInt(value)) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      alert('Veuillez sélectionner un membre');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal onClose={onClose} title="Enregistrer une cotisation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membre *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mois *</label>
            <select
              name="month"
              value={formData.month}
              onChange={handleChange}
              className="input"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="paid">✅ Payé</option>
              <option value="pending">⏳ En attente</option>
              <option value="late">❌ En retard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cotisation (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              min="5000"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frais de gestion (FCFA)</label>
            <input
              type="number"
              name="fees"
              value={formData.fees}
              onChange={handleChange}
              className="input"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moyen de paiement</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="input"
            >
              <option>Mobile Money</option>
              <option>Espèces</option>
              <option>Virement</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence MoMo</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="input"
              placeholder="TXN-XXXXXX"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-outline">
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContributionForm;