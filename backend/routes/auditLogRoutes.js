const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, requireSecretary } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireSecretary);
router.get('/', getAuditLogs);

module.exports = router;
