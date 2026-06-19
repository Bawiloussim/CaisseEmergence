const Aid = require('../models/Aid');
const Member = require('../models/Member');
const Contribution = require('../models/Contribution');
const logAction = require('../utils/logAction');

async function computeAvailableFund(excludeAidId = null) {
  const paidContributions = await Contribution.find({ status: 'paid' });
  const feesTotal = paidContributions.reduce((sum, c) => sum + c.fees, 0);

  const aids = await Aid.find();
  const totalAids = aids
    .filter((a) => !excludeAidId || String(a._id) !== String(excludeAidId))
    .reduce((sum, a) => sum + a.amount, 0);

  return feesTotal - totalAids;
}

async function resourceLabel(memberId, amount) {
  const member = await Member.findById(memberId);
  return `${member?.name || 'Membre inconnu'} — ${amount} FCFA`;
}

// GET /api/aids — accessible à tout membre connecté (lecture)
const getAids = async (req, res) => {
  const aids = await Aid.find().sort({ createdAt: -1 });
  res.json(aids);
};

// POST /api/aids — secrétaire uniquement
const createAid = async (req, res) => {
  const { memberId, amount, motif, date } = req.body;

  if (!memberId) return res.status(400).json({ message: 'Membre requis' });
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Montant invalide' });

  const availableFund = await computeAvailableFund();
  if (amount > availableFund) {
    return res.status(400).json({ message: `Fonds insuffisants ! Disponible: ${availableFund} FCFA` });
  }

  const aid = await Aid.create({ memberId, amount, motif, date });

  await logAction({
    action: 'create',
    resource: 'aid',
    resourceLabel: await resourceLabel(memberId, amount),
    actor: req.user,
  });

  res.status(201).json(aid);
};

// PUT /api/aids/:id — secrétaire uniquement
const updateAid = async (req, res) => {
  const aid = await Aid.findById(req.params.id);
  if (!aid) return res.status(404).json({ message: 'Aide non trouvée' });

  const { memberId, amount, motif, date } = req.body;

  if (amount !== undefined && amount <= 0) {
    return res.status(400).json({ message: 'Montant invalide' });
  }

  if (amount !== undefined) {
    const availableFund = await computeAvailableFund(aid._id);
    if (amount > availableFund) {
      return res.status(400).json({ message: `Fonds insuffisants ! Disponible: ${availableFund} FCFA` });
    }
  }

  if (memberId !== undefined) aid.memberId = memberId;
  if (amount !== undefined) aid.amount = amount;
  if (motif !== undefined) aid.motif = motif;
  if (date !== undefined) aid.date = date;

  await aid.save();

  await logAction({
    action: 'update',
    resource: 'aid',
    resourceLabel: await resourceLabel(aid.memberId, aid.amount),
    actor: req.user,
  });

  res.json(aid);
};

// DELETE /api/aids/:id — secrétaire uniquement
const deleteAid = async (req, res) => {
  const aid = await Aid.findById(req.params.id);
  if (!aid) return res.status(404).json({ message: 'Aide non trouvée' });

  await logAction({
    action: 'delete',
    resource: 'aid',
    resourceLabel: await resourceLabel(aid.memberId, aid.amount),
    actor: req.user,
  });

  await aid.deleteOne();
  res.json({ message: 'Aide supprimée' });
};

module.exports = { getAids, createAid, updateAid, deleteAid };
