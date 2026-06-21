const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function parseEmailFrom(emailFrom) {
  const match = emailFrom.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  }
  return { name: undefined, email: emailFrom.trim() };
}

/**
 * Envoie un email via l'API HTTP de Brevo (port 443, jamais bloqué
 * par les hébergeurs cloud — contrairement au SMTP qui timeout
 * souvent vers Gmail depuis Render). L'adresse EMAIL_FROM doit être
 * un expéditeur vérifié dans Brevo (Senders, Domains & Dedicated IPs).
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('Configuration email manquante : renseignez BREVO_API_KEY dans le fichier .env');
  }

  const sender = parseEmailFrom(process.env.EMAIL_FROM || 'La Caisse Emergence <no-reply@example.com>');

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Échec de l'envoi de l'email (HTTP ${response.status})`);
  }
}

module.exports = sendEmail;
