const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/audit-logs', auditLogRoutes);

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
