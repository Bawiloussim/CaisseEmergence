const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs — secrétaire uniquement
const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  res.json(logs);
};

module.exports = { getAuditLogs };
