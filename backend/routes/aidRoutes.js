const express = require('express');
const {
  getAids,
  createAid,
  updateAid,
  deleteAid,
} = require('../controllers/aidController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAids);
router.post('/', requireSecretary, createAid);
router.put('/:id', requireSecretary, updateAid);
router.delete('/:id', requireSecretary, deleteAid);

module.exports = router;
