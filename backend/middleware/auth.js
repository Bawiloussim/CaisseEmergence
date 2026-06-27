const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const { VALIDATOR_ROLES } = require('../constants/roles');

/**
 * Vérifie le token JWT (en-tête "Authorization: Bearer <token>") et
 * charge le membre correspondant dans req.user.
 * → Personne ne peut accéder à l'API sans compte membre valide.
 */
const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé : token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const member = await Member.findById(decoded.id);

    if (!member) {
      return res.status(401).json({ message: 'Non autorisé : compte introuvable' });
    }

    req.user = member;
    next();
  } catch {
    return res.status(401).json({ message: 'Non autorisé : token invalide ou expiré' });
  }
};

/**
 * À utiliser après `protect`. Bloque l'accès si l'utilisateur n'est
 * pas le secrétaire (lecture/écriture vs lecture seule).
 */
const requireSecretary = (req, res, next) => {
  if (req.user?.accountRole !== 'secretaire') {
    return res.status(403).json({ message: 'Accès réservé au secrétaire' });
  }
  next();
};

/**
 * À utiliser après `protect`. Bloque l'accès si l'utilisateur n'est pas
 * l'un des trois valideurs de cotisation (secrétaire, trésorier, président).
 */
const requireValidator = (req, res, next) => {
  if (!VALIDATOR_ROLES.includes(req.user?.accountRole)) {
    return res.status(403).json({ message: 'Accès réservé au secrétaire, au trésorier et au président' });
  }
  next();
};

/**
 * À utiliser SANS `protect` : pour les routes appelées par une tâche
 * planifiée externe (ex: GitHub Actions) qui n'a pas de session membre.
 * Vérifie un secret partagé envoyé dans l'en-tête X-Cron-Secret.
 */
const requireCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ message: 'Non autorisé' });
  }
  next();
};

module.exports = { protect, requireSecretary, requireValidator, requireCronSecret };
