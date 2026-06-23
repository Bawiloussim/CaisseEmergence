const rateLimit = require('express-rate-limit');

// Désactivé pendant les tests automatisés : les suites enchaînent de
// nombreuses requêtes de connexion/réinitialisation depuis la même "IP".
const skip = () => process.env.NODE_ENV === 'test';

const tooManyRequests = (req, res) => {
  res.status(429).json({ message: 'Trop de tentatives, veuillez réessayer dans quelques minutes' });
};

// Protège /api/auth/login contre le brute-force des mots de passe.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: tooManyRequests,
});

// Protège forgot-password/reset-password contre l'abus d'envoi d'emails
// et le bruteforce du code à 6 chiffres.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: tooManyRequests,
});

module.exports = { loginLimiter, passwordResetLimiter };
