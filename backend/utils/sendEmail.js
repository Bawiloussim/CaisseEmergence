const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Envoie un email via l'API HTTP de Resend (port 443, jamais bloqué
 * par les hébergeurs cloud — contrairement au SMTP qui timeout
 * souvent vers Gmail depuis Render).
 * @param {{ to: string, subject: string, html: string }} options
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Configuration email manquante : renseignez RESEND_API_KEY dans le fichier .env');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'La Caisse Emergence <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Échec de l'envoi de l'email (HTTP ${response.status})`);
  }
}

module.exports = sendEmail;
