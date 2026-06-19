const AuditLog = require('../models/AuditLog');

// Enregistre une action dans le journal d'audit. Ne doit jamais faire
// échouer l'opération principale : une erreur de journalisation est
// simplement loggée côté serveur.
async function logAction({ action, resource = 'member', resourceLabel = '', actor, details = '' }) {
  try {
    await AuditLog.create({
      action,
      resource,
      resourceLabel,
      actorName: actor?.name || '',
      details,
    });
  } catch (err) {
    console.error('Échec de journalisation (audit log) :', err.message);
  }
}

module.exports = logAction;
