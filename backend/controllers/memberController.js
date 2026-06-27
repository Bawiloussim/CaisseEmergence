const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const Aid = require('../models/Aid');
const generateTempPassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');
const { invitationEmail, birthdayEmail } = require('../utils/emailTemplates');
const logAction = require('../utils/logAction');
const { ACCOUNT_ROLES, VALIDATOR_ROLES } = require('../constants/roles');

const ROLE_LABELS = { secretaire: 'secrétaire', tresorier: 'trésorier', president: 'président' };

// GET /api/members — accessible à tout membre connecté (lecture)
const getMembers = async (req, res) => {
  const members = await Member.find().sort({ createdAt: -1 });
  res.json(members);
};

// GET /api/members/:id
const getMemberById = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });
  res.json(member);
};

// GET /api/members/birthdays/today — accessible à tout membre connecté.
// `birthday` est stocké en chaîne 'YYYY-MM-DD' (voir Member.js) : on compare
// juste le mois/jour pour savoir si c'est l'anniversaire de quelqu'un.
const getTodaysBirthdays = async (req, res) => {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const members = await Member.find({ birthday: { $regex: `-${mm}-${dd}$` } }, 'name birthday');
  res.json(members);
};

// POST /api/members/birthdays/notify — protégé par un secret partagé
// (en-tête X-Cron-Secret), pas par une session membre : appelé une fois par
// jour par une tâche planifiée externe (GitHub Actions), l'hébergement
// (Render, plan gratuit) n'ayant pas de cron interne. Envoie un email à
// tous les membres sauf le(s) fêté(s) du jour.
const notifyBirthdays = async (req, res) => {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const celebrants = await Member.find({ birthday: { $regex: `-${mm}-${dd}$` } });

  if (!celebrants.length) {
    return res.json({ celebrants: [], sent: 0, failed: [] });
  }

  const allMembers = await Member.find();
  let sent = 0;
  const failed = [];

  for (const celebrant of celebrants) {
    const recipients = allMembers.filter((m) => String(m._id) !== String(celebrant._id));
    for (const recipient of recipients) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `🎉 Joyeux anniversaire à ${celebrant.name} !`,
          html: birthdayEmail({
            name: recipient.name,
            celebrantName: celebrant.name,
            associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          }),
        });
        sent += 1;
      } catch (err) {
        failed.push({ name: recipient.name, email: recipient.email, error: err.message });
      }
    }
  }

  res.json({ celebrants: celebrants.map((c) => c.name), sent, failed });
};

/**
 * POST /api/members — secrétaire uniquement
 * Crée le membre avec un mot de passe temporaire et lui envoie un
 * email d'invitation pour qu'il puisse se connecter et le changer.
 */
const createMember = async (req, res) => {
  const {
    name,
    email,
    phone,
    cni,
    dob,
    birthday,
    address,
    monthlyContribution,
    momoNumber,
    photo,
    role,
    accountRole,
    joinDate,
  } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Le nom et l'email sont requis" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Member.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Un membre avec cet email existe déjà' });
  }

  const tempPassword = generateTempPassword();

  const member = await Member.create({
    name,
    email: normalizedEmail,
    password: tempPassword,
    phone,
    cni,
    dob,
    birthday,
    address,
    momoNumber,
    photo,
    role: role || 'Membre actif',
    accountRole: ACCOUNT_ROLES.includes(accountRole) ? accountRole : 'membre',
    monthlyContribution: monthlyContribution || 2000,
    joinDate,
    mustChangePassword: true,
  });

  await logAction({
    action: 'create',
    resourceLabel: `${member.name} (${member.email})`,
    actor: req.user,
  });

  try {
    await sendEmail({
      to: member.email,
      subject: `Votre accès à l'espace membres — ${process.env.ASSOCIATION_NAME || 'La Caisse Emergence'}`,
      html: invitationEmail({
        name: member.name,
        email: member.email,
        tempPassword,
        associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      }),
    });
  } catch (err) {
    // Le membre est créé même si l'email échoue, mais on prévient le secrétaire.
    return res.status(201).json({
      member,
      warning:
        `Le membre a été créé mais l'email d'invitation n'a pas pu être envoyé ` +
        `(${err.message}). Vous pouvez communiquer ce mot de passe temporaire ` +
        `manuellement : ${tempPassword}`,
    });
  }

  res.status(201).json({ member });
};

/**
 * POST /api/members/:id/resend-invitation — secrétaire uniquement
 * Génère un nouveau mot de passe temporaire et renvoie l'email
 * d'invitation, sans recréer le compte (les cotisations, prêts et avis
 * du membre restent intacts). Utile si l'envoi automatique a échoué à
 * la création (configuration email manquante côté serveur) ou si le
 * membre a perdu son mot de passe temporaire avant sa première connexion.
 */
const resendInvitation = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  const tempPassword = generateTempPassword();
  member.password = tempPassword;
  member.mustChangePassword = true;
  await member.save();

  await logAction({
    action: 'update',
    resourceLabel: `${member.name} (${member.email})`,
    actor: req.user,
    details: "Renvoi de l'invitation (nouveau mot de passe temporaire)",
  });

  try {
    await sendEmail({
      to: member.email,
      subject: `Votre accès à l'espace membres — ${process.env.ASSOCIATION_NAME || 'La Caisse Emergence'}`,
      html: invitationEmail({
        name: member.name,
        email: member.email,
        tempPassword,
        associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      }),
    });
  } catch (err) {
    return res.json({
      warning:
        `L'email n'a pas pu être envoyé (${err.message}). Vous pouvez communiquer ce mot ` +
        `de passe temporaire manuellement : ${tempPassword}`,
    });
  }

  res.json({ message: 'Invitation renvoyée par email' });
};

// PUT /api/members/:id — secrétaire uniquement
const updateMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  const editableFields = [
    'name',
    'phone',
    'cni',
    'dob',
    'birthday',
    'address',
    'monthlyContribution',
    'momoNumber',
    'photo',
    'role',
    'joinDate',
    'accountRole',
  ];

  const changedFields = editableFields.filter((field) => req.body[field] !== undefined);
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) member[field] = req.body[field];
  });

  // Changement d'email : vérifier l'unicité
  if (req.body.email) {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    if (normalizedEmail !== member.email) {
      const exists = await Member.findOne({ email: normalizedEmail });
      if (exists) return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre membre' });
      member.email = normalizedEmail;
      changedFields.push('email');
    }
  }

  await member.save();

  await logAction({
    action: 'update',
    resourceLabel: `${member.name} (${member.email})`,
    actor: req.user,
    details: changedFields.length ? `Champs modifiés : ${changedFields.join(', ')}` : '',
  });

  res.json(member);
};

// DELETE /api/members/:id — secrétaire uniquement
const deleteMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  // Empêche de supprimer le dernier compte d'un rôle valideur (secrétaire,
  // trésorier, président) : sinon plus personne ne pourrait donner ce vote
  // et les cotisations resteraient bloquées en attente indéfiniment.
  if (VALIDATOR_ROLES.includes(member.accountRole)) {
    const roleCount = await Member.countDocuments({ accountRole: member.accountRole });
    if (roleCount <= 1) {
      return res.status(400).json({ message: `Impossible de supprimer le dernier compte ${ROLE_LABELS[member.accountRole]}` });
    }
  }

  await logAction({
    action: 'delete',
    resourceLabel: `${member.name} (${member.email})`,
    actor: req.user,
  });

  await Promise.all([
    Contribution.deleteMany({ memberId: member._id }),
    Loan.deleteMany({ memberId: member._id }),
    Aid.deleteMany({ memberId: member._id }),
  ]);

  await member.deleteOne();
  res.json({ message: 'Membre supprimé' });
};

module.exports = {
  getMembers,
  getMemberById,
  getTodaysBirthdays,
  notifyBirthdays,
  createMember,
  updateMember,
  deleteMember,
  resendInvitation,
};
