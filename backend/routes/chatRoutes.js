const express = require('express');
const { getMessages, postMessage, heartbeat, getOnlineMembers } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/messages', getMessages);
router.post('/messages', postMessage);
router.post('/heartbeat', heartbeat);
router.get('/online', getOnlineMembers);

module.exports = router;
