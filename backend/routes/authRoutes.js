const express = require('express');
const {
  login,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Connexion : seul un email enregistré comme membre peut se connecter
router.post('/login', loginLimiter, login);

// Mot de passe oublié : envoi d'un code par email, puis réinitialisation
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Profil de l'utilisateur connecté
router.get('/me', protect, getMe);

// Changement de mot de passe (première connexion ou ultérieur)
router.put('/change-password', protect, changePassword);

// Mise à jour du profil (nom, email)
router.put('/profile', protect, updateProfile);

module.exports = router;
