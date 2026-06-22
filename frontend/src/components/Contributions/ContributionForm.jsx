import { useState } from 'react';
import Modal from '../UI/Modal';

const ContributionForm = ({ onClose, onSubmit, members, initialData }) => {
  const [formData, setFormData] = useState(() => ({
    memberId: '',
    month: 'JUIN',
    amount: 2000,
    fees: 300,
    status: 'paid',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Mobile Money',
    reference: '',
    ...(initialData || {}),
  }));

  const [submitting, setSubmitting] = useState(false);

  const months = [
    'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE',
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'memberId') {
      const member = members.find(m => m.accountId === value);
      setFormData(prev => ({
        ...prev,
        memberId: value,
        // pré-remplir le montant du membre sauf si on édite une cotisation existante
        ...(!initialData && member ? { amount: member.monthlyContribution || 0 } : {}),
      }));
    } else if (name === 'amount' || name === 'fees') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      alert('Veuillez sélectionner un membre');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
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
              <option key={member.accountId} value={member.accountId}>{member.name}</option>
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
              min="1"
              step="1"
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
          <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-primary disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContributionForm;