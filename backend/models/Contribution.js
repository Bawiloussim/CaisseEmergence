const mongoose = require('mongoose');
const { VALIDATOR_ROLES } = require('../constants/roles');

const validationEntry = {
  validated: { type: Boolean, default: false },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  at: { type: Date, default: null },
};

const contributionSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    month: { type: String, required: true },
    // Un membre peut cotiser plusieurs fois dans le même mois (paiements
    // fractionnés), mais chaque versement doit atteindre ce minimum.
    amount: { type: Number, required: true, min: [2000, 'Le montant minimum par versement est de 2000 FCFA'] },
    // 300 FCFA de frais de gestion, comptés une seule fois par membre et par
    // mois : seul le premier versement du mois les porte (voir
    // contributionController.createContribution).
    fees: { type: Number, default: 300 },
    status: { type: String, enum: ['paid', 'pending', 'late'], default: 'pending' },
    paymentDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    paymentMethod: { type: String, default: 'Mobile Money' },
    reference: { type: String, default: '' },
    // Capture d'écran du paiement (dataURL), fournie par le membre lui-même
    // en attendant la validation.
    proofImage: { type: String, default: '' },
    // Validation à trois niveaux : la cotisation ne passe au statut "paid"
    // que lorsque le secrétaire, le trésorier et le président ont tous validé.
    validations: {
      secretaire: validationEntry,
      tresorier: validationEntry,
      president: validationEntry,
    },
  },
  { timestamps: true }
);

// Un membre peut avoir plusieurs cotisations pour le même mois (paiements
// fractionnés) ; cet index sert seulement à accélérer les requêtes par
// membre + mois, ce n'est plus une contrainte d'unicité.
contributionSchema.index({ memberId: 1, month: 1 });

contributionSchema.methods.isFullyValidated = function () {
  return VALIDATOR_ROLES.every((role) => this.validations[role].validated);
};

// Enregistre le vote d'un des trois valideurs et fait passer la cotisation
// à "paid" dès que les trois ont validé.
contributionSchema.methods.recordValidation = function (role, memberId) {
  this.validations[role].validated = true;
  this.validations[role].by = memberId;
  this.validations[role].at = new Date();
  if (this.isFullyValidated()) {
    this.status = 'paid';
  }
};

// Annule le vote d'un seul valideur (ex: validation donnée par erreur).
// Si la cotisation était "paid", elle redevient "pending" puisqu'elle
// n'est plus validée par les trois rôles.
contributionSchema.methods.revokeValidation = function (role) {
  this.validations[role] = { validated: false, by: null, at: null };
  if (this.status === 'paid') {
    this.status = 'pending';
  }
};

module.exports = mongoose.model('Contribution', contributionSchema);
