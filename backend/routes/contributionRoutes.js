const express = require('express');
const {
  getContributions,
  createContribution,
  updateContribution,
  validateContribution,
  deleteContribution,
} = require('../controllers/contributionController');
const { protect, requireSecretary, requireValidator } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getContributions);
// Tout membre peut importer la preuve (capture d'écran) de son propre
// paiement ; seul le secrétaire peut enregistrer un paiement pour un autre
// membre ou avec un statut différent de "en attente".
router.post('/', createContribution);
router.put('/:id', requireSecretary, updateContribution);
// Secrétaire, trésorier ou président : enregistre son vote de validation.
router.post('/:id/validate', requireValidator, validateContribution);
router.delete('/:id', requireSecretary, deleteContribution);

module.exports = router;
