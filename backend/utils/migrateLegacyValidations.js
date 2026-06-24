const Contribution = require('../models/Contribution');
const { VALIDATOR_ROLES } = require('../constants/roles');

// Les cotisations déjà "payées" avant l'introduction de la validation à
// trois niveaux n'ont pas de validations enregistrées. On les considère
// rétroactivement validées par les trois rôles pour ne pas perturber
// l'historique. Idempotent : ne touche que les documents encore incomplets.
module.exports = async function migrateLegacyValidations() {
  const legacy = await Contribution.find({
    status: 'paid',
    $or: VALIDATOR_ROLES.map((role) => ({ [`validations.${role}.validated`]: { $ne: true } })),
  });

  for (const contribution of legacy) {
    VALIDATOR_ROLES.forEach((role) => {
      contribution.validations[role].validated = true;
      contribution.validations[role].at = contribution.validations[role].at || contribution.updatedAt;
    });
    await contribution.save();
  }

  if (legacy.length) {
    console.log(`Migration : ${legacy.length} cotisation(s) "payée(s)" marquée(s) comme validée(s) rétroactivement.`);
  }
};
