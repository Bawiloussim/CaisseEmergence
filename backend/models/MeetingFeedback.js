const mongoose = require('mongoose');

// Signature de présence + avis d'un membre sur la réunion mensuelle
// (visioconférence) qui suit la clôture des cotisations du mois.
const meetingFeedbackSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    month: { type: String, required: true },
    present: { type: Boolean, default: false },
    satisfaction: { type: String, enum: ['satisfait', 'insatisfait', null], default: null },
    comment: { type: String, default: '' },
    signedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

meetingFeedbackSchema.index({ memberId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MeetingFeedback', meetingFeedbackSchema);
