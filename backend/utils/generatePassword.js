// Génère un mot de passe temporaire lisible (sans caractères ambigus
// comme 0/O ou 1/l/I) à envoyer par email lors de la création d'un compte.
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generateTempPassword(length = 10) {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return password;
}

module.exports = generateTempPassword;
