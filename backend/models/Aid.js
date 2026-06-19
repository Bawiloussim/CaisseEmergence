const mongoose = require('mongoose');

const aidSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    amount: { type: Number, required: true, min: 1 },
    motif: { type: String, default: '' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Aid', aidSchema);
