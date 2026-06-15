/**
 * Email envoyé à un membre lors de la création de son compte.
 * Contient ses identifiants de connexion temporaires.
 */
function invitationEmail({ name, email, tempPassword, associationName, loginUrl }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2a24;">
    <h2 style="color:#09324e; margin-bottom: 4px;">${associationName}</h2>
    <p style="color:#8a978f; margin-top:0; letter-spacing:1px; font-size:12px; text-transform:uppercase;">
      Épargne · Crédit · Solidarité
    </p>

    <p>Bonjour ${name},</p>
    <p>
      Un compte a été créé pour vous sur l'espace membres de
      <strong>${associationName}</strong>. Vous pouvez désormais consulter
      vos cotisations, prêts et activités de solidarité.
    </p>

    <p>Voici vos identifiants de connexion :</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding:8px 12px; background:#f7f4f4; border-radius:8px 0 0 8px; font-weight:bold;">Email</td>
        <td style="padding:8px 12px; background:#f7f4f4; border-radius:0 8px 8px 0;">${email}</td>
      </tr>
      <tr><td colspan="2" style="height:6px;"></td></tr>
      <tr>
        <td style="padding:8px 12px; background:#f7f4f4; border-radius:8px 0 0 8px; font-weight:bold;">Mot de passe temporaire</td>
        <td style="padding:8px 12px; background:#f7f4f4; border-radius:0 8px 8px 0; font-family: monospace;">${tempPassword}</td>
      </tr>
    </table>

    <p>
      Pour des raisons de sécurité, il vous sera demandé de
      <strong>choisir un nouveau mot de passe</strong> dès votre première connexion.
    </p>

    <p style="margin: 24px 0;">
      <a href="${loginUrl}"
         style="background:#c48a21; color:#072434; padding:12px 24px; border-radius:9999px; text-decoration:none; font-weight:bold; display:inline-block;">
        Se connecter
      </a>
    </p>

    <p style="font-size:12px; color:#8a978f;">
      Si vous n'êtes pas à l'origine de cette demande, contactez le secrétariat
      de l'association.
    </p>
  </div>`;
}

module.exports = { invitationEmail };
