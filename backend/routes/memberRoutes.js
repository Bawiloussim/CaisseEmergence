const express = require('express');
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require('../controllers/memberController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes ci-dessous nécessitent d'être connecté
router.use(protect);

// Lecture : accessible au secrétaire ET aux membres
router.get('/', getMembers);
router.get('/:id', getMemberById);

// Écriture : secrétaire uniquement
router.post('/', requireSecretary, createMember);
router.put('/:id', requireSecretary, updateMember);
router.delete('/:id', requireSecretary, deleteMember);

module.exports = router;
