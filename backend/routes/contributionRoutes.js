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
router.post('/', requireSecretary, createContribution);
router.put('/:id', requireSecretary, updateContribution);
router.delete('/:id', requireSecretary, deleteContribution);

module.exports = router;
