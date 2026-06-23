const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const aidRoutes = require('./routes/aidRoutes');
const meetingFeedbackRoutes = require('./routes/meetingFeedbackRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors());
// 8 Mo : couvre les preuves de paiement (captures d'écran, max 5 Mo côté
// frontend) une fois encodées en base64 (+33 % environ) avec une marge.
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/aids', aidRoutes);
app.use('/api/meeting-feedback', meetingFeedbackRoutes);
app.use('/api/chat', chatRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion centralisée des erreurs
app.use((err, req, res, next) => {
  console.error(err);

  // Erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Email dupliqué (index unique MongoDB)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Un membre avec cet email existe déjà' });
  }

  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

module.exports = app;
