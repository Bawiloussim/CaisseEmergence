const express = require('express');
const {
  getContributions,
  createContribution,
  updateContribution,
  deleteContribution,
} = require('../controllers/contributionController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getContributions);
// Tout membre peut importer la preuve (capture d'écran) de son propre
// paiement ; seul le secrétaire peut enregistrer un paiement pour un autre
// membre ou avec un statut différent de "en attente".
router.post('/', createContribution);
router.put('/:id', requireSecretary, updateContribution);
router.delete('/:id', requireSecretary, deleteContribution);

module.exports = router;
