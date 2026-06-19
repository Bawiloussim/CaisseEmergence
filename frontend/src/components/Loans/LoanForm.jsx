import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import ContributionController from '../../controllers/ContributionController';

const LoanForm = ({ onClose, onSubmit, members, initialData = null }) => {
  const [formData, setFormData] = useState(() => ({
    memberId: initialData?.memberId || '',
    amount: initialData?.amount ?? 50000,
    duration: initialData?.duration ?? 3,
    motif: initialData?.motif || '',
    status: initialData?.status || 'pending',
    requestDate: initialData?.requestDate || new Date().toISOString().split('T')[0],
    id: initialData?.id || undefined,
  }));
  const [ceiling, setCeiling] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!formData.memberId) {
      setCeiling(0);
      return;
    }
    ContributionController.computeLoanCeiling(formData.memberId).then(setCeiling);
  }, [formData.memberId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'amount' || name === 'duration') val = value === '' ? '' : Number(value);
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      alert('Veuillez sélectionner un membre');
      return;
    }
    if (formData.amount > ceiling) {
      if (!window.confirm(`Le montant demandé (${formData.amount.toLocaleString('fr-FR')} FCFA) dépasse le plafond autorisé (${ceiling.toLocaleString('fr-FR')} FCFA). Continuer ?`)) {
        return;
      }
    }
    const payload = { ...formData, amount: Number(formData.amount), duration: parseInt(formData.duration) };
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title={initialData ? 'Modifier la demande de prêt' : 'Nouvelle demande de prêt'}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              min="5000"
              step="1"
            />
            {formData.memberId && (
              <p className="text-xs text-gray-500 mt-1">Plafond prêt: <strong className="text-green-600">{ceiling.toLocaleString('fr-FR')} FCFA</strong></p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée (mois)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="input"
              min="1"
              max="3"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <input
              type="text"
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              className="input"
              placeholder="Ex: Frais médicaux, scolarité, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="pending">En attente de vote</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de demande</label>
            <input
              type="date"
              name="requestDate"
              value={formData.requestDate}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-primary disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Enregistrement...' : 'Enregistrer la demande'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LoanForm;
