const express = require('express');
const { getMeetingFeedback, upsertMyMeetingFeedback, sendMeetingReminders } = require('../controllers/meetingFeedbackController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMeetingFeedback);
router.post('/', upsertMyMeetingFeedback);
router.post('/remind', requireSecretary, sendMeetingReminders);

module.exports = router;
