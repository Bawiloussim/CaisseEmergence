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

// POST /api/contributions — secrétaire uniquement
const createContribution = async (req, res) => {
  const { memberId, month, amount, fees, status, paymentDate, paymentMethod, reference } = req.body;

  if (!memberId || !month) {
    return res.status(400).json({ message: 'Membre et mois requis' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
  }

  const existing = await Contribution.findOne({ memberId, month });
  if (existing) {
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
  });

  await logAction({
    action: 'create',
    resource: 'contribution',
    resourceLabel: await resourceLabel(memberId, month),
    actor: req.user,
  });

  res.status(201).json(contribution);
};

// PUT /api/contributions/:id — secrétaire uniquement
const updateContribution = async (req, res) => {
  const contribution = await Contribution.findById(req.params.id);
  if (!contribution) return res.status(404).json({ message: 'Cotisation non trouvée' });

  const editableFields = ['memberId', 'month', 'amount', 'fees', 'status', 'paymentDate', 'paymentMethod', 'reference'];
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
