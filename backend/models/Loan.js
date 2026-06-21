const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    vote: { type: String, enum: ['yes', 'no'], required: true },
  },
  { _id: false }
);

// Une mensualité par mois de durée du prêt, générée automatiquement à
// l'approbation. Le secrétaire coche chaque mensualité au fur et à mesure
// des remboursements reçus.
const repaymentSchema = new mongoose.Schema(
  {
    installmentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentDate: { type: String, default: null },
  },
  { _id: false }
);

const loanSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 1 },
    duration: { type: Number, default: 3, min: 1, max: 3 },
    interests: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    monthlyPayment: { type: Number, default: 0 },
    motif: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    approvalDate: { type: String, default: null },
    votes: { type: [voteSchema], default: [] },
    repayments: { type: [repaymentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
