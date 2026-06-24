require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');
const migrateLegacyValidations = require('./utils/migrateLegacyValidations');

connectDB().then(migrateLegacyValidations);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
