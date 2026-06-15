const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

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

module.exports = { protect, requireSecretary };
