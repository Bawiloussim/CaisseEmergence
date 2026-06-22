const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    fees: { type: Number, default: 300 },
    status: { type: String, enum: ['paid', 'pending', 'late'], default: 'pending' },
    paymentDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    paymentMethod: { type: String, default: 'Mobile Money' },
    reference: { type: String, default: '' },
    // Capture d'écran du paiement (dataURL), fournie par le membre lui-même
    // en attendant la validation du secrétaire.
    proofImage: { type: String, default: '' },
  },
  { timestamps: true }
);

// Une seule cotisation par membre et par mois.
contributionSchema.index({ memberId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Contribution', contributionSchema);
