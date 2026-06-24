const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const logAction = require('../utils/logAction');
const sendEmail = require('../utils/sendEmail');
const { contributionValidationNeededEmail } = require('../utils/emailTemplates');
const { MONTHS_FULL } = require('../utils/cycleMonth');
const { VALIDATOR_ROLES } = require('../constants/roles');

const ROLE_LABELS = { secretaire: 'secrétaire', tresorier: 'trésorier', president: 'président' };

async function resourceLabel(memberId, month) {
  const member = await Member.findById(memberId);
  return `${member?.name || 'Membre inconnu'} — ${month}`;
}

// Prévient par email les valideurs n'ayant pas encore voté qu'une cotisation
// attend leur validation. Best-effort : un envoi en échec n'empêche pas les
// autres ni la requête en cours.
async function notifyPendingValidators(contribution, { excludeRole } = {}) {
  if (contribution.status === 'paid') return;

  const pendingRoles = VALIDATOR_ROLES.filter(
    (role) => role !== excludeRole && !contribution.validations[role].validated
  );
  if (!pendingRoles.length) return;

  const [validators, member] = await Promise.all([
    Member.find({ accountRole: { $in: pendingRoles } }),
    Member.findById(contribution.memberId),
  ]);

  await Promise.all(
    validators.map((validator) =>
      sendEmail({
        to: validator.email,
        subject: `Cotisation à valider — ${member?.name || 'Membre'} (${MONTHS_FULL[contribution.month] || contribution.month})`,
        html: contributionValidationNeededEmail({
          name: validator.name,
          memberName: member?.name || 'Un membre',
          month: MONTHS_FULL[contribution.month] || contribution.month,
          amount: contribution.amount,
          associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        }),
      }).catch((err) =>
        console.error(`Échec de l'envoi du rappel de validation à ${validator.email} :`, err.message)
      )
    )
  );
}

// GET /api/contributions — accessible à tout membre connecté (lecture)
const getContributions = async (req, res) => {
  const contributions = await Contribution.find().sort({ createdAt: -1 });
  res.json(contributions);
};

// POST /api/contributions — le secrétaire peut enregistrer un paiement pour
// n'importe quel membre avec le statut de son choix ; un membre ne peut
// importer une preuve de paiement (capture d'écran) que pour lui-même, et
// celle-ci reste "en attente" jusqu'à validation par le secrétaire.
const createContribution = async (req, res) => {
  const { month, amount, fees, paymentDate, paymentMethod, reference, proofImage } = req.body;
  let { memberId, status } = req.body;

  if (req.user.accountRole !== 'secretaire') {
    memberId = String(req.user._id);
    status = 'pending';
    if (!proofImage) {
      return res.status(400).json({ message: 'Capture d\'écran du paiement requise' });
    }
  }

  if (!memberId || !month) {
    return res.status(400).json({ message: 'Membre et mois requis' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
  }

  const existing = await Contribution.findOne({ memberId, month });
  if (existing) {
    // Un membre peut renvoyer une preuve corrigée tant que son paiement
    // précédent n'a pas déjà été validé par les trois valideurs. La preuve
    // ayant changé, les validations déjà données sur l'ancienne preuve sont
    // remises à zéro.
    if (req.user.accountRole !== 'secretaire' && existing.status !== 'paid') {
      existing.amount = amount;
      if (fees !== undefined) existing.fees = fees;
      existing.proofImage = proofImage;
      if (reference !== undefined) existing.reference = reference;
      if (paymentDate !== undefined) existing.paymentDate = paymentDate;
      existing.resetValidations();
      await existing.save();

      await logAction({
        action: 'update',
        resource: 'contribution',
        resourceLabel: await resourceLabel(memberId, month),
        actor: req.user,
        details: 'Preuve de paiement renvoyée par le membre',
      });
      await notifyPendingValidators(existing, { excludeRole: req.user.accountRole });

      return res.json(existing);
    }
    return res.status(409).json({ message: 'Cotisation déjà enregistrée pour ce mois' });
  }

  // Le secrétaire peut enregistrer un paiement directement comme "payé",
  // mais cela ne constitue que son propre vote : la cotisation ne devient
  // réellement "paid" qu'une fois les trois valideurs passés par /validate.
  const contribution = await Contribution.create({
    memberId,
    month,
    amount,
    fees,
    status: status === 'paid' ? 'pending' : status,
    paymentDate,
    paymentMethod,
    reference,
    proofImage,
  });

  if (status === 'paid') {
    contribution.recordValidation('secretaire', req.user._id);
    await contribution.save();
  }

  await logAction({
    action: 'create',
    resource: 'contribution',
    resourceLabel: await resourceLabel(memberId, month),
    actor: req.user,
    details: proofImage ? 'Preuve de paiement importée par le membre' : '',
  });
  await notifyPendingValidators(contribution, { excludeRole: req.user.accountRole });

  res.status(201).json(contribution);
};

// PUT /api/contributions/:id — secrétaire uniquement
const updateContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  const editableFields = ['memberId', 'month', 'amount', 'fees', 'paymentDate', 'paymentMethod', 'reference', 'proofImage'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) contribution[field] = req.body[field];
  });

  // Le statut "paid" ne se décide pas directement : il découle des trois
  // validations (voir recordValidation). Mettre "paid" ici ne fait donc
  // que compter le vote du secrétaire ; "pending"/"late" restent des
  // corrections manuelles libres.
  if (req.body.status !== undefined) {
    if (req.body.status === 'paid') {
      contribution.recordValidation('secretaire', req.user._id);
    } else {
      contribution.status = req.body.status;
    }
  }

  await contribution.save();

  await logAction({
    action: 'update',
    resource: 'contribution',
    resourceLabel: await resourceLabel(contribution.memberId, contribution.month),
    actor: req.user,
  });

  res.json(contribution);
};

// POST /api/contributions/:id/validate — secrétaire, trésorier ou président.
// Enregistre le vote de l'utilisateur connecté ; la cotisation passe à
// "paid" dès que les trois rôles ont validé.
const validateContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  const role = req.user.accountRole;
  contribution.recordValidation(role, req.user._id);
  await contribution.save();

  await logAction({
    action: 'update',
    resource: 'contribution',
    resourceLabel: await resourceLabel(contribution.memberId, contribution.month),
    actor: req.user,
    details: `Validation par le ${ROLE_LABELS[role]}`,
  });
  await notifyPendingValidators(contribution, { excludeRole: role });

  res.json(contribution);
};

// DELETE /api/contributions/:id/validate — secrétaire, trésorier ou
// président. Annule le propre vote de l'utilisateur connecté (ex: validation
// donnée par erreur). Si la cotisation était "paid", elle redevient "pending".
const unvalidateContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  const role = req.user.accountRole;
  if (!contribution.validations[role].validated) {
    return res.status(400).json({ message: "Vous n'avez pas encore validé cette cotisation" });
  }

  contribution.revokeValidation(role);
  await contribution.save();

  await logAction({
    action: 'update',
    resource: 'contribution',
    resourceLabel: await resourceLabel(contribution.memberId, contribution.month),
    actor: req.user,
    details: `Validation annulée par le ${ROLE_LABELS[role]}`,
  });

  res.json(contribution);
};

// DELETE /api/contributions/:id — secrétaire uniquement
const deleteContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  await logAction({
    action: 'delete',
    resource: 'contribution',
    resourceLabel: await resourceLabel(contribution.memberId, contribution.month),
    actor: req.user,
  });

  await contribution.deleteOne();
  res.json({ message: 'Cotisation supprimée' });
};

module.exports = {
  getContributions,
  createContribution,
  updateContribution,
  validateContribution,
  unvalidateContribution,
  deleteContribution,
};
