const MeetingFeedback = require('../models/MeetingFeedback');
const Member = require('../models/Member');
const logAction = require('../utils/logAction');
const sendEmail = require('../utils/sendEmail');
const { meetingReminderEmail } = require('../utils/emailTemplates');
const { getCurrentCycleMonth, MONTHS_FULL } = require('../utils/cycleMonth');

// GET /api/meeting-feedback — accessible à tout membre connecté (lecture),
// pour que chacun voie qui était présent et les avis du mois.
const getMeetingFeedback = async (req, res) => {
  const entries = await MeetingFeedback.find().sort({ month: 1, signedAt: 1 });
  res.json(entries);
};

// POST /api/meeting-feedback — un membre ne peut donner son avis que pour
// lui-même (memberId déduit du JWT, jamais du corps de la requête) et
// uniquement pour le mois de réunion en cours : les mois précédents sont
// automatiquement figés (archivés) dès que le mois change.
// La présence n'est PAS modifiable ici : seul le secrétaire la constate
// (voir setMemberPresence), pour éviter qu'un membre absent se déclare
// présent et vote comme s'il avait suivi la réunion.
const upsertMyMeetingFeedback = async (req, res) => {
  const { satisfaction, comment } = req.body;
  const currentMonth = getCurrentCycleMonth();

  if (!currentMonth) {
    return res.status(400).json({ message: 'Aucune réunion mensuelle ouverte actuellement.' });
  }
  if (satisfaction && !['satisfait', 'insatisfait'].includes(satisfaction)) {
    return res.status(400).json({ message: 'Satisfaction invalide' });
  }

  // $set explicite (et non un objet brut) pour ne mettre à jour que
  // l'avis : un remplacement complet du document écraserait la présence
  // déjà constatée par le secrétaire.
  const entry = await MeetingFeedback.findOneAndUpdate(
    { memberId: req.user._id, month: currentMonth },
    {
      $set: {
        memberId: req.user._id,
        month: currentMonth,
        satisfaction: satisfaction || null,
        comment: comment || '',
        signedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const member = await Member.findById(req.user._id);
  await logAction({
    action: 'update',
    resource: 'meeting-feedback',
    resourceLabel: `${member?.name || 'Membre'} — avis réunion ${currentMonth}`,
    actor: req.user,
  });

  res.json(entry);
};

// PUT /api/meeting-feedback/:memberId/presence — secrétaire uniquement.
// Constate la présence (ou l'absence) d'un membre à la réunion du mois en
// cours ; ne touche jamais à l'avis/satisfaction déjà donné par ce membre.
const setMemberPresence = async (req, res) => {
  const { present } = req.body;
  const { memberId } = req.params;
  const currentMonth = getCurrentCycleMonth();

  if (!currentMonth) {
    return res.status(400).json({ message: 'Aucune réunion mensuelle ouverte actuellement.' });
  }
  if (typeof present !== 'boolean') {
    return res.status(400).json({ message: 'Présence invalide' });
  }

  const member = await Member.findById(memberId);
  if (!member) return res.status(404).json({ message: 'Membre non trouvé' });

  const entry = await MeetingFeedback.findOneAndUpdate(
    { memberId, month: currentMonth },
    { $set: { memberId, month: currentMonth, present } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logAction({
    action: 'update',
    resource: 'meeting-feedback',
    resourceLabel: `${member.name} — présence réunion ${currentMonth} : ${present ? 'présent' : 'absent'}`,
    actor: req.user,
  });

  res.json(entry);
};

// POST /api/meeting-feedback/remind — secrétaire uniquement. Envoie un
// rappel par email à chaque membre n'ayant pas encore donné son avis
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
  const respondedIds = new Set(
    entries.filter((e) => e.satisfaction).map((e) => String(e.memberId))
  );
  const pending = members.filter((m) => !respondedIds.has(String(m._id)));

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

module.exports = {
  getMeetingFeedback,
  upsertMyMeetingFeedback,
  setMemberPresence,
  sendMeetingReminders,
};
