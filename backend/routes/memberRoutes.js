const express = require('express');
const {
  getMembers,
  getMemberById,
  getTodaysBirthdays,
  notifyBirthdays,
  createMember,
  updateMember,
  deleteMember,
  resendInvitation,
} = require('../controllers/memberController');
const { protect, requireSecretary, requireCronSecret } = require('../middleware/auth');

const router = express.Router();

// Appelée par une tâche planifiée externe (GitHub Actions), pas par un
// membre connecté : doit rester avant `router.use(protect)` ci-dessous.
router.post('/birthdays/notify', requireCronSecret, notifyBirthdays);

// Toutes les routes ci-dessous nécessitent d'être connecté
router.use(protect);

// Lecture : accessible au secrétaire ET aux membres
router.get('/', getMembers);
router.get('/birthdays/today', getTodaysBirthdays);
router.get('/:id', getMemberById);

// Écriture : secrétaire uniquement
router.post('/', requireSecretary, createMember);
router.post('/:id/resend-invitation', requireSecretary, resendInvitation);
router.put('/:id', requireSecretary, updateMember);
router.delete('/:id', requireSecretary, deleteMember);

module.exports = router;
