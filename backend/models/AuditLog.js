const mongoose = require('mongoose');

// Journal des actions du secrétaire sur les comptes membres, pour la
// transparence envers l'association (qui a fait quoi, et quand).
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, enum: ['create', 'update', 'delete'] },
    resource: { type: String, required: true, default: 'member' },
    resourceLabel: { type: String, default: '' },
    actorName: { type: String, default: '' },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
