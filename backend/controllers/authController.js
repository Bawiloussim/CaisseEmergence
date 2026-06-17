const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const toPublicUser = (member) => ({
  id: member._id,
  name: member.name,
  email: member.email,
  accountRole: member.accountRole,
  role: member.role,
  mustChangePassword: member.mustChangePassword,
});

/**
 * POST /api/auth/login
 * Personne ne peut se connecter si son email n'est pas associé à un
 * membre enregistré dans la base par le secrétaire.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const member = await Member.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Message volontairement générique : on ne révèle pas si l'email existe.
  if (!member) {
    return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
  }

  const isMatch = await member.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
  }

  const token = generateToken(member._id);

  res.json({ token, user: toPublicUser(member) });
};

/** GET /api/auth/me — profil de l'utilisateur connecté */
const getMe = async (req, res) => {
  res.json(toPublicUser(req.user));
};

/**
 * PUT /api/auth/change-password
 * Utilisé après l'invitation par email (mustChangePassword = true),
 * et pour tout changement de mot de passe ultérieur.
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  const member = await Member.findById(req.user._id).select('+password');

  // Si ce n'est pas la première connexion, on exige l'ancien mot de passe.
  if (!member.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Le mot de passe actuel est requis' });
    }
    const isMatch = await member.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
  }

  member.password = newPassword;
  member.mustChangePassword = false;
  await member.save();

  res.json({ message: 'Mot de passe mis à jour avec succès' });
};

/** PUT /api/auth/profile — nom et email de l'utilisateur connecté */
const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const member = await Member.findById(req.user._id);
  if (!member) return res.status(404).json({ message: 'Compte introuvable' });

  if (name && name.trim()) member.name = name.trim();

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== member.email) {
      const exists = await Member.findOne({ email: normalizedEmail });
      if (exists) return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte' });
      member.email = normalizedEmail;
    }
  }

  await member.save();
  res.json({ user: toPublicUser(member) });
};

module.exports = { login, getMe, changePassword, updateProfile };
