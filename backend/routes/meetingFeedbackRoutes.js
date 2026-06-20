const express = require('express');
const { getMeetingFeedback, upsertMyMeetingFeedback } = require('../controllers/meetingFeedbackController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMeetingFeedback);
router.post('/', upsertMyMeetingFeedback);

module.exports = router;
