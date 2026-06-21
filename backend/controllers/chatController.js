const Message = require('../models/Message');
const Member = require('../models/Member');

const ONLINE_THRESHOLD_MS = 60 * 1000;

// GET /api/chat/messages — accessible à tout membre connecté
const getMessages = async (req, res) => {
  const messages = await Message.find()
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('senderId', 'name');

  res.json(
    messages.map((m) => ({
      id: m._id,
      text: m.text,
      createdAt: m.createdAt,
      senderId: m.senderId?._id,
      senderName: m.senderId?.name || 'Membre supprimé',
    }))
  );
};

// POST /api/chat/messages
const postMessage = async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Le message ne peut pas être vide' });
  }

  const message = await Message.create({ senderId: req.user._id, text: text.trim().slice(0, 2000) });
  await Member.findByIdAndUpdate(req.user._id, { lastSeenAt: new Date() });

  res.status(201).json({
    id: message._id,
    text: message.text,
    createdAt: message.createdAt,
    senderId: req.user._id,
    senderName: req.user.name,
  });
};

// POST /api/chat/heartbeat — signale que l'utilisateur est actif
const heartbeat = async (req, res) => {
  await Member.findByIdAndUpdate(req.user._id, { lastSeenAt: new Date() });
  res.json({ ok: true });
};

// GET /api/chat/online — membres actifs dans la dernière minute
const getOnlineMembers = async (req, res) => {
  const since = new Date(Date.now() - ONLINE_THRESHOLD_MS);
  const members = await Member.find({ lastSeenAt: { $gte: since } }).select('name');
  res.json(members.map((m) => ({ id: m._id, name: m.name })));
};

module.exports = { getMessages, postMessage, heartbeat, getOnlineMembers };
