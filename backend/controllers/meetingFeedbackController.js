const MeetingFeedback = require('../models/MeetingFeedback');
const Member = require('../models/Member');
const logAction = require('../utils/logAction');
const sendEmail = require('../utils/sendEmail');
const { meetingReminderEmail } = require('../utils/emailTemplates');
const { getCurrentCycleMonth, MONTHS_FULL } = require('../utils/cycleMonth');

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

// POST /api/meeting-feedback/remind — secrétaire uniquement. Envoie un
// rappel par email à chaque membre n'ayant pas encore signé sa présence
// pour le mois en cours. Best-effort : l'échec d'un envoi n'empêche pas
// les autres.
const sendMeetingReminders = async (req, res) => {
  const currentMonth = getCurrentCycleMonth();
  if (!currentMonth) {
    return res.status(400).json({ message: 'Aucune réunion mensuelle ouverte actuellement.' });
  }

  const [members, entries] = await Promise.all([
    Member.find(),
    MeetingFeedback.find({ month: currentMonth }),
  ]);
  const signedIds = new Set(entries.map((e) => String(e.memberId)));
  const pending = members.filter((m) => !signedIds.has(String(m._id)));

  let sent = 0;
  const failed = [];
  for (const member of pending) {
    try {
      await sendEmail({
        to: member.email,
        subject: `Rappel — Réunion de ${MONTHS_FULL[currentMonth]} — ${process.env.ASSOCIATION_NAME || 'La Caisse Emergence'}`,
        html: meetingReminderEmail({
          name: member.name,
          month: MONTHS_FULL[currentMonth],
          associationName: process.env.ASSOCIATION_NAME || 'La Caisse Emergence',
          loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        }),
      });
      sent += 1;
    } catch (err) {
      failed.push({ name: member.name, email: member.email, error: err.message });
    }
  }

  res.json({ sent, failed, pendingCount: pending.length });
};

module.exports = { getMeetingFeedback, upsertMyMeetingFeedback, sendMeetingReminders };
