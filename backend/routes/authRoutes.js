const express = require('express');
const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Connexion : seul un email enregistré comme membre peut se connecter
router.post('/login', login);

// Profil de l'utilisateur connecté
router.get('/me', protect, getMe);

// Changement de mot de passe (première connexion ou ultérieur)
router.put('/change-password', protect, changePassword);

module.exports = router;
