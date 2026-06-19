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
router.post('/', requireSecretary, createLoan);
router.put('/:id', requireSecretary, updateLoan);
router.delete('/:id', requireSecretary, deleteLoan);
// Le vote reste ouvert à tout membre connecté (pas réservé au secrétaire).
router.post('/:id/vote', voteLoan);

module.exports = router;
