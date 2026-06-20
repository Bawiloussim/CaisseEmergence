const mongoose = require('mongoose');

// Présence + avis d'un membre sur la réunion mensuelle (visioconférence)
// qui suit la clôture des cotisations du mois. La présence n'est jamais
// auto-déclarée : seul le secrétaire, qui anime l'appel, peut la
// constater (sinon un membre absent pourrait se déclarer présent et
// voter comme s'il avait suivi la réunion). L'avis/satisfaction reste
// en revanche déclaré par chaque membre lui-même.
// present: null = pas encore constaté par le secrétaire.
const meetingFeedbackSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    month: { type: String, required: true },
    present: { type: Boolean, default: null },
    satisfaction: { type: String, enum: ['satisfait', 'insatisfait', null], default: null },
    comment: { type: String, default: '' },
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

meetingFeedbackSchema.index({ memberId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MeetingFeedback', meetingFeedbackSchema);
