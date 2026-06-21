const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const logAction = require('../utils/logAction');

async function computeLoanCeiling(memberId) {
  const contributions = await Contribution.find({ memberId, status: 'paid' });
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
  return Math.floor(totalPaid * 1.5);
}

function computeDerivedFields(amount, duration) {
  const interests = Math.round(amount * 0.1);
  const total = amount + interests;
  const monthlyPayment = Math.round(total / (duration || 1));
  return { interests, total, monthlyPayment };
}

async function resourceLabel(memberId, amount) {
  const member = await Member.findById(memberId);
  return `${member?.name || 'Membre inconnu'} — ${amount} FCFA`;
}

// GET /api/loans — accessible à tout membre connecté (lecture)
const getLoans = async (req, res) => {
  const loans = await Loan.find().sort({ createdAt: -1 });
  res.json(loans);
};

// POST /api/loans — tout membre connecté peut demander un prêt pour
// lui-même ; seul le secrétaire peut en faire la demande pour un autre
// membre ou définir directement un statut autre que "en attente".
const createLoan = async (req, res) => {
  const { amount, duration, motif, requestDate } = req.body;
  let { memberId, status } = req.body;

  if (req.user.accountRole !== 'secretaire') {
    memberId = String(req.user._id);
    status = 'pending';
  }

  if (!memberId) return res.status(400).json({ message: 'Membre requis' });
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Montant invalide' });

  const ceiling = await computeLoanCeiling(memberId);
  const { interests, total, monthlyPayment } = computeDerivedFields(amount, duration || 3);

  const loan = await Loan.create({
    memberId,
    amount,
    duration: duration || 3,
    interests,
    total,
    monthlyPayment,
    motif,
    status: status || 'pending',
    requestDate,
  });

  await logAction({
    action: 'create',
    resource: 'loan',
    resourceLabel: await resourceLabel(memberId, amount),
    actor: req.user,
    details: amount > ceiling ? `Dépasse le plafond calculé (${ceiling} FCFA)` : '',
  });

  res.status(201).json(loan);
};

// PUT /api/loans/:id — secrétaire uniquement
const updateLoan = async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Prêt non trouvé' });

  const editableFields = ['memberId', 'amount', 'duration', 'motif', 'status', 'requestDate', 'approvalDate'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) loan[field] = req.body[field];
  });

  const { interests, total, monthlyPayment } = computeDerivedFields(loan.amount, loan.duration);
  loan.interests = interests;
  loan.total = total;
  loan.monthlyPayment = monthlyPayment;

  await loan.save();

  await logAction({
    action: 'update',
    resource: 'loan',
    resourceLabel: await resourceLabel(loan.memberId, loan.amount),
    actor: req.user,
  });

  res.json(loan);
};

// DELETE /api/loans/:id — secrétaire uniquement
const deleteLoan = async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Prêt non trouvé' });

  await logAction({
    action: 'delete',
    resource: 'loan',
    resourceLabel: await resourceLabel(loan.memberId, loan.amount),
    actor: req.user,
  });

  await loan.deleteOne();
  res.json({ message: 'Prêt supprimé' });
};

// POST /api/loans/:id/vote — tout membre connecté, sauf sur sa propre demande
const voteLoan = async (req, res) => {
  const { vote } = req.body;
  if (!['yes', 'no'].includes(vote)) {
    return res.status(400).json({ message: 'Vote invalide' });
  }

  const loan = await Loan.findById(req.params.id);
  if (!loan) return res.status(404).json({ message: 'Prêt non trouvé' });

  if (String(loan.memberId) === String(req.user._id)) {
    return res.status(403).json({ message: 'Vous ne pouvez pas voter sur votre propre demande' });
  }

  const existing = loan.votes.find((v) => String(v.memberId) === String(req.user._id));
  if (existing) {
    existing.vote = vote;
  } else {
    loan.votes.push({ memberId: req.user._id, vote });
  }

  // Le demandeur ne peut jamais voter sur sa propre demande : on calcule
  // la majorité sur les membres pouvant réellement voter, pas sur l'effectif
  // total. Sinon, même un "oui" unanime des votants éligibles pourrait ne
  // jamais atteindre le seuil dans une petite caisse.
  const totalMembers = await Member.countDocuments();
  const eligibleVoters = totalMembers - 1;
  const yes = loan.votes.filter((v) => v.vote === 'yes').length;
  const no = loan.votes.filter((v) => v.vote === 'no').length;

  if (eligibleVoters > 0 && yes > eligibleVoters / 2) {
    loan.status = 'approved';
    loan.approvalDate = new Date().toISOString().split('T')[0];
  } else if (eligibleVoters > 0 && no > eligibleVoters / 2) {
    loan.status = 'rejected';
    loan.approvalDate = new Date().toISOString().split('T')[0];
  }

  await loan.save();

  await logAction({
    action: 'update',
    resource: 'loan',
    resourceLabel: `Vote "${vote === 'yes' ? 'Oui' : 'Non'}" de ${req.user.name}`,
    actor: req.user,
  });

  res.json(loan);
};

module.exports = { getLoans, createLoan, updateLoan, deleteLoan, voteLoan, computeLoanCeiling };
