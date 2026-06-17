// Crée le premier compte secrétaire à partir des variables du .env.
// Nécessaire car personne ne peut se connecter à l'application si
// aucun compte n'existe encore en base.
//
// Utilisation : npm run seed

require('dotenv').config();

const connectDB = require('./config/db');
const Member = require('./models/Member');

const run = async () => {
  await connectDB();

  const email = process.env.SECRETARY_EMAIL;
  const password = process.env.SECRETARY_PASSWORD;
  const name = process.env.SECRETARY_NAME || 'Secrétaire';

  if (!email || !password) {
    console.error('Définissez SECRETARY_EMAIL et SECRETARY_PASSWORD dans le fichier .env');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Member.findOne({ email: normalizedEmail });

  if (existing) {
    console.log(`Un compte existe déjà pour ${normalizedEmail} — aucune action effectuée.`);
    process.exit(0);
  }

  await Member.create({
    name,
    email: normalizedEmail,
    password,
    accountRole: 'secretaire',
    role: 'Secrétaire',
    mustChangePassword: true,
  });

  console.log(`✅ Compte secrétaire créé avec succès : ${normalizedEmail}`);
  console.log('Vous pouvez maintenant vous connecter avec ces identifiants.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Erreur lors de la création du compte secrétaire :', err.message);
  process.exit(1);
});
