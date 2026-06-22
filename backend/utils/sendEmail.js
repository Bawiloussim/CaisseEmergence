const nodemailer = require('nodemailer');

function parseEmailFrom(emailFrom) {
  const match = emailFrom.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), address: match[2].trim() };
  }
  return { name: undefined, address: emailFrom.trim() };
}

let transporter;
function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'Configuration email manquante : renseignez SMTP_USER et SMTP_PASS dans le fichier .env'
    );
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true pour le port 465, false (STARTTLS) pour 587
      auth: {
        user: process.env.SMTP_USER,
        pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
      },
    });
  }
  return transporter;
}

/**
 * Envoie un email via un relais SMTP (Brevo, Gmail, etc.) configuré
 * par les variables SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS.
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
  const from = parseEmailFrom(process.env.EMAIL_FROM || 'La Caisse Emergence <no-reply@example.com>');

  await getTransporter().sendMail({ from, to, subject, html });
}

module.exports = sendEmail;
