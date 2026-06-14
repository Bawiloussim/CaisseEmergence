const Member = require('../models/Member');
const generateTempPassword = require('../utils/generatePassword');
const sendEmail = require('../utils/sendEmail');
const { invitationEmail } = require('../utils/emailTemplates');

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
    address,
    momoNumber,
    photo,
    role: role || 'Membre actif',
    accountRole: accountRole === 'secretaire' ? 'secretaire' : 'membre',
    monthlyContribution: monthlyContribution || 5000,
    joinDate,
    mustChangePassword: true,
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

// PUT /api/members/:id — secrétaire uniquement
const updateMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  const editableFields = [
    'name',
    'phone',
    'cni',
    'dob',
    'address',
    'monthlyContribution',
    'momoNumber',
    'photo',
    'role',
    'joinDate',
    'accountRole',
  ];

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
    }
  }

  await member.save();
  res.json(member);
};

// DELETE /api/members/:id — secrétaire uniquement
const deleteMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  // Empêche de supprimer le dernier compte secrétaire (sinon plus personne
  // ne pourrait gérer la caisse).
  if (member.accountRole === 'secretaire') {
    const secretaryCount = await Member.countDocuments({ accountRole: 'secretaire' });
    if (secretaryCount <= 1) {
      return res.status(400).json({ message: 'Impossible de supprimer le dernier compte secrétaire' });
    }
  }

  await member.deleteOne();
  res.json({ message: 'Membre supprimé' });
};

module.exports = { getMembers, getMemberById, createMember, updateMember, deleteMember };
