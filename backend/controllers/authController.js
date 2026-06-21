const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const sendEmail = require('../utils/sendEmail');
const { resetCodeEmail } = require('../utils/emailTemplates');

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

/**
 * POST /api/auth/forgot-password
 * Génère un code à 6 chiffres, valable 15 minutes, et l'envoie par email.
 * Réponse volontairement générique dans tous les cas : on ne révèle
 * jamais si un email correspond ou non à un compte existant.
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const genericMessage = { message: 'Si cet email correspond à un compte, un code vient de lui être envoyé.' };

  if (!email) return res.status(400).json({ message: 'Email requis' });

  const member = await Member.findOne({ email: email.toLowerCase().trim() }).select('+resetPasswordExpires');
  if (!member) return res.json(genericMessage);

  // Anti-spam : pas de nouveau code moins d'une minute après le précédent
  // (le code expire 15 min après son envoi).
  if (member.resetPasswordExpires && member.resetPasswordExpires.getTime() - Date.now() > 14 * 60 * 1000) {
    return res.json(genericMessage);
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = await bcrypt.genSalt(10);
  member.resetPasswordCodeHash = await bcrypt.hash(code, salt);
  member.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await member.save();

  try {
    await sendEmail({
      to: member.email,
      subject: `Code de réinitialisation — ${process.env.ASSOCIATION_NAME || 'La Caisse Emergence'}`,
      html: resetCodeEmail({
        name: member.name,
        code,
        associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
      }),
    });
  } catch (err) {
    console.error("Échec d'envoi du code de réinitialisation :", err.message);
  }

  res.json(genericMessage);
};

/**
 * POST /api/auth/reset-password
 * Vérifie le code à 6 chiffres et remplace le mot de passe — aucune
 * suppression/recréation de compte n'est nécessaire, les cotisations,
 * prêts et avis du membre restent intacts.
 */
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, code et nouveau mot de passe requis' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
  }

  const member = await Member.findOne({ email: email.toLowerCase().trim() }).select(
    '+resetPasswordCodeHash +resetPasswordExpires'
  );

  if (!member?.resetPasswordCodeHash || !member.resetPasswordExpires || member.resetPasswordExpires.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Code invalide ou expiré' });
  }

  const isMatch = await bcrypt.compare(code, member.resetPasswordCodeHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Code invalide ou expiré' });
  }

  member.password = newPassword;
  member.mustChangePassword = false;
  member.resetPasswordCodeHash = null;
  member.resetPasswordExpires = null;
  await member.save();

  res.json({ message: 'Mot de passe réinitialisé avec succès' });
};

module.exports = { login, getMe, changePassword, updateProfile, forgotPassword, resetPassword };
