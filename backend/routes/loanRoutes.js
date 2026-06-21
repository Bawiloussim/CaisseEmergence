const express = require('express');
const {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  voteLoan,
} = require('../controllers/loanController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getLoans);
// Tout membre peut demander un prêt pour lui-même ; le secrétaire peut
// en plus créer une demande au nom de n'importe quel membre.
router.post('/', createLoan);
router.put('/:id', requireSecretary, updateLoan);
router.delete('/:id', requireSecretary, deleteLoan);
// Le vote reste ouvert à tout membre connecté (pas réservé au secrétaire).
router.post('/:id/vote', voteLoan);

module.exports = router;
