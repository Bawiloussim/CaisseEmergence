// Configuration des comptes utilisateurs de la Caisse Emergence
//
// ⚠️ Solution simple, sans backend : les identifiants sont stockés dans le
// code source. Cela convient pour un usage interne avec peu de personnes,
// mais n'est PAS sécurisé pour des données sensibles. Dès que possible,
// remplacez ceci par une vraie authentification côté serveur.

export const ROLES = {
  SECRETAIRE: 'secretaire', // accès complet : lecture + écriture
  MEMBRE: 'membre',         // accès en lecture seule
};

export const USERS = [
  {
    username: 'secretaire',
    password: 'Arnaud2000', // 🔐 à changer avant mise en service
    name: 'Secrétaire',
    role: ROLES.SECRETAIRE,
  },
  {
    username: 'membre',
    password: 'Membre1234', // 🔐 à changer / à dupliquer par membre
    name: 'Membre',
    role: ROLES.MEMBRE,
  },

  // Ajoutez un bloc par membre supplémentaire, par exemple :
  // {
  //   username: 'kouame.b',
  //   password: 'motdepasse123',
  //   name: 'Kouamé B.',
  //   role: ROLES.MEMBRE,
  // },
];
