require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');
const Contribution = require('./models/Contribution');
const migrateLegacyValidations = require('./utils/migrateLegacyValidations');

connectDB().then(async () => {
  // Supprime l'ancien index unique (memberId, month) toujours présent en
  // base depuis avant l'autorisation des cotisations multiples par mois ;
  // Mongoose ne le fait pas automatiquement, seulement à la création.
  await Contribution.syncIndexes();
  await migrateLegacyValidations();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
