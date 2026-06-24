// Rôles habilités à valider une cotisation. Une cotisation ne passe au
// statut "paid" que lorsque les trois ont validé (voir Contribution.js).
const VALIDATOR_ROLES = ['secretaire', 'tresorier', 'president'];

// Tous les rôles de compte possibles ('membre' = lecture seule, sans droit
// de validation ni d'édition).
const ACCOUNT_ROLES = [...VALIDATOR_ROLES, 'membre'];

module.exports = { VALIDATOR_ROLES, ACCOUNT_ROLES };
