import { useState } from 'react';
import Modal from '../UI/Modal';
import { MONTHS_FULL } from '../../models/ContributionModel';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ContributionProofForm = ({ onClose, onSubmit, member, existingMonths = [] }) => {
  const months = Object.keys(MONTHS_FULL);
  const [formData, setFormData] = useState({
    month: months.find((m) => !existingMonths.includes(m)) || months[0],
    amount: member?.monthlyContribution || 2000,
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [proofImage, setProofImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Image trop volumineuse (5 Mo maximum)');
      return;
    }
    setError('');
    const dataUrl = await readFileAsDataUrl(file);
    setProofImage(dataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofImage) {
      setError('Veuillez importer une capture d\'écran du paiement');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await onSubmit({ ...formData, proofImage });
      if (!result?.success) {
        setError(result?.error || (result?.errors && result.errors.join('\n')) || 'Erreur lors de l\'envoi');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Importer ma preuve de paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Importez la capture d'écran de votre dépôt Flooz. Votre paiement sera marqué "en attente" jusqu'à
          validation par le secrétaire.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mois *</label>
            <select name="month" value={formData.month} onChange={handleChange} className="input">
              {months.map((month) => (
                <option key={month} value={month}>{MONTHS_FULL[month]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant versé (FCFA) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input"
              min="1"
              step="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date du paiement</label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Capture d'écran du paiement *</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="input" />
            {proofImage && (
              <img src={proofImage} alt="Aperçu de la preuve de paiement" className="mt-2 max-h-48 rounded-lg border" />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline" disabled={submitting}>
            Annuler
          </button>
          <button type="submit" className="btn-primary disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Envoi...' : 'Envoyer la preuve'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContributionProofForm;
