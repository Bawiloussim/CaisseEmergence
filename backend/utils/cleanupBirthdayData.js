const Member = require('../models/Member');

/**
 * Supprime les anciennes données d'anniversaire déjà stockées pour les
 * membres afin d'aligner la base de données avec la fonctionnalité retirée.
 * Idempotent : peut être exécuté plusieurs fois sans effet supplémentaire.
 */
module.exports = async function cleanupBirthdayData() {
  const result = await Member.updateMany(
    { birthday: { $exists: true } },
    { $unset: { birthday: '' } }
  );

  if (result.modifiedCount || result.matchedCount) {
    console.log(`Nettoyage anniversaire : ${result.modifiedCount || 0} membre(s) mis à jour.`);
  }

  return result;
};
