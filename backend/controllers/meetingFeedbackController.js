const MeetingFeedback = require('../models/MeetingFeedback');
const Member = require('../models/Member');
const logAction = require('../utils/logAction');
const { getCurrentCycleMonth } = require('../utils/cycleMonth');

// GET /api/meeting-feedback — accessible à tout membre connecté (lecture),
// pour que chacun voie qui a signé sa présence et les avis du mois.
const getMeetingFeedback = async (req, res) => {
  const entries = await MeetingFeedback.find().sort({ month: 1, signedAt: 1 });
  res.json(entries);
};

// POST /api/meeting-feedback — un membre ne peut signer/donner son avis
// que pour lui-même (memberId déduit du JWT, jamais du corps de la
// requête) et uniquement pour le mois de réunion en cours : les mois
// précédents sont automatiquement figés (archivés) dès que le mois change.
const upsertMyMeetingFeedback = async (req, res) => {
  const { present, satisfaction, comment } = req.body;
  const currentMonth = getCurrentCycleMonth();

  if (!currentMonth) {
    return res.status(400).json({ message: 'Aucune réunion mensuelle ouverte actuellement.' });
  }
  if (satisfaction && !['satisfait', 'insatisfait'].includes(satisfaction)) {
    return res.status(400).json({ message: 'Satisfaction invalide' });
  }

  const entry = await MeetingFeedback.findOneAndUpdate(
    { memberId: req.user._id, month: currentMonth },
    {
      memberId: req.user._id,
      month: currentMonth,
      present: !!present,
      satisfaction: satisfaction || null,
      comment: comment || '',
      signedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const member = await Member.findById(req.user._id);
  await logAction({
    action: 'update',
    resource: 'meeting-feedback',
    resourceLabel: `${member?.name || 'Membre'} — réunion ${currentMonth}`,
    actor: req.user,
  });

  res.json(entry);
};

module.exports = { getMeetingFeedback, upsertMyMeetingFeedback };
