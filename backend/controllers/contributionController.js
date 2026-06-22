const Contribution = require('../models/Contribution');
const Member = require('../models/Member');
const logAction = require('../utils/logAction');

async function resourceLabel(memberId, month) {
  const member = await Member.findById(memberId);
  return `${member?.name || 'Membre inconnu'} — ${month}`;
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
    // précédent n'a pas déjà été validé par le secrétaire.
    if (req.user.accountRole !== 'secretaire' && existing.status !== 'paid') {
      existing.amount = amount;
      if (fees !== undefined) existing.fees = fees;
      existing.proofImage = proofImage;
      if (reference !== undefined) existing.reference = reference;
      if (paymentDate !== undefined) existing.paymentDate = paymentDate;
      await existing.save();

      await logAction({
        action: 'update',
        resource: 'contribution',
        resourceLabel: await resourceLabel(memberId, month),
        actor: req.user,
        details: 'Preuve de paiement renvoyée par le membre',
      });

      return res.json(existing);
    }
    return res.status(409).json({ message: 'Cotisation déjà enregistrée pour ce mois' });
  }

  const contribution = await Contribution.create({
    memberId,
    month,
    amount,
    fees,
    status,
    paymentDate,
    paymentMethod,
    reference,
    proofImage,
  });

  await logAction({
    action: 'create',
    resource: 'contribution',
    resourceLabel: await resourceLabel(memberId, month),
    actor: req.user,
    details: proofImage ? 'Preuve de paiement importée par le membre' : '',
  });

  res.status(201).json(contribution);
};

// PUT /api/contributions/:id — secrétaire uniquement
const updateContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  const editableFields = ['memberId', 'month', 'amount', 'fees', 'status', 'paymentDate', 'paymentMethod', 'reference', 'proofImage'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) contribution[field] = req.body[field];
  });

  await contribution.save();

  await logAction({
    action: 'update',
    resource: 'contribution',
    resourceLabel: await resourceLabel(contribution.memberId, contribution.month),
    actor: req.user,
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

module.exports = { getContributions, createContribution, updateContribution, deleteContribution };
