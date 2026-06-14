# Backend — Caisse Emergence

API Node.js / Express / MongoDB (Mongoose) pour la gestion des comptes de
l'espace membres :

- **Connexion** : seul un email enregistré comme membre peut se connecter.
- **Secrétaire** : peut créer, modifier et supprimer des membres (accès complet).
- **Membre** : accès en lecture seule (ne peut pas modifier les données).
- **Création d'un membre** → un mot de passe temporaire est généré et envoyé
  par email. Le membre doit le changer dès sa première connexion.

---

## 1. Prérequis

- **Node.js** 18 ou plus récent (`node -v` pour vérifier)
- **MongoDB** installé et lancé en local

### Installer MongoDB en local

- **Windows / macOS** : téléchargez "MongoDB Community Server" sur
  [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community),
  installez-le, puis assurez-vous que le service `MongoDB` est démarré
  (il se lance automatiquement après installation sur Windows).
- **macOS (Homebrew)** :
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Linux (Ubuntu/Debian)** : suivez le guide officiel
  [docs.mongodb.com/manual/administration/install-on-linux](https://www.mongodb.com/docs/manual/administration/install-on-linux/),
  puis :
  ```bash
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```

Une fois installé, MongoDB tourne par défaut sur `mongodb://127.0.0.1:27017`,
ce qui correspond à la valeur par défaut de `MONGODB_URI` (voir étape 3).

---

## 2. Installation des dépendances

```bash
cd caisse-emergence-backend
npm install
```

---

## 3. Configuration (`.env`)

Copiez le fichier d'exemple :

```bash
cp .env.example .env
```

Puis ouvrez `.env` et adaptez les valeurs :

| Variable | Description |
|---|---|
| `PORT` | Port du serveur (par défaut `5000`) |
| `FRONTEND_URL` | URL de votre frontend React (utilisée dans le lien de connexion de l'email d'invitation) |
| `ASSOCIATION_NAME` | Nom affiché dans les emails |
| `MONGODB_URI` | Chaîne de connexion MongoDB. La valeur par défaut convient si MongoDB est installé en local avec les réglages par défaut |
| `JWT_SECRET` | Clé secrète pour signer les sessions. **Changez-la** — générez-en une avec la commande ci-dessous |
| `JWT_EXPIRES_IN` | Durée de validité de la connexion (ex : `7d`) |
| `SMTP_*`, `EMAIL_FROM` | Paramètres d'envoi d'email (voir ci-dessous) |
| `SECRETARY_*` | Identifiants du premier compte secrétaire, créé par `npm run seed` |

### Générer une clé `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configurer l'envoi d'emails (Gmail)

1. Activez la validation en 2 étapes sur votre compte Google.
2. Créez un "mot de passe d'application" sur
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Renseignez :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre.email@gmail.com
   SMTP_PASS=le_mot_de_passe_d_application_genere
   EMAIL_FROM="La Caisse Emergence <votre.email@gmail.com>"
   ```

> Si un autre fournisseur est utilisé (Outlook, Zoho, OVH...), demandez-moi
> et j'adapterai les valeurs `SMTP_HOST` / `SMTP_PORT`.

---

## 4. Créer le premier compte secrétaire

Personne ne peut se connecter si aucun compte n'existe encore. Ce script
crée le compte secrétaire à partir des variables `SECRETARY_*` du `.env` :

```bash
npm run seed
```

---

## 5. Démarrer le serveur

```bash
npm run dev      # avec rechargement automatique (nodemon)
# ou
npm start        # production
```

Le serveur démarre sur `http://localhost:5000` (ou le port choisi).
Vérifiez qu'il fonctionne : [http://localhost:5000/api/health](http://localhost:5000/api/health)
doit renvoyer `{"status":"ok"}`.

---

## 6. API — Aperçu des routes

### Authentification (`/api/auth`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Connexion (email + mot de passe) → renvoie un token |
| GET | `/api/auth/me` | Connecté | Profil de l'utilisateur connecté |
| PUT | `/api/auth/change-password` | Connecté | Changer son mot de passe |

**Connexion :**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretaire@caisse-emergence.local","password":"ChangezMoi123!"}'
```
Réponse :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Secrétaire",
    "email": "secretaire@caisse-emergence.local",
    "accountRole": "secretaire",
    "role": "Secrétaire",
    "mustChangePassword": false
  }
}
```

Pour toutes les routes protégées, ajoutez l'en-tête :
```
Authorization: Bearer <token>
```

**Changer son mot de passe (première connexion) :**
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"MonNouveauMotDePasse"}'
```

### Membres (`/api/members`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/members` | Connecté | Liste de tous les membres |
| GET | `/api/members/:id` | Connecté | Détail d'un membre |
| POST | `/api/members` | Secrétaire | Créer un membre (envoie l'email d'invitation) |
| PUT | `/api/members/:id` | Secrétaire | Modifier un membre |
| DELETE | `/api/members/:id` | Secrétaire | Supprimer un membre |

**Créer un membre :**
```bash
curl -X POST http://localhost:5000/api/members \
  -H "Authorization: Bearer <token_secretaire>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kouamé B.",
    "email": "kouame.b@example.com",
    "phone": "0700000000",
    "monthlyContribution": 5000
  }'
```
→ Le membre reçoit un email avec son adresse et un mot de passe temporaire,
et devra le changer à sa première connexion (`mustChangePassword: true`).

---

## 7. Champs du membre

Reprend le modèle déjà utilisé par le frontend, avec les champs d'authentification en plus :

| Champ | Type | Description |
|---|---|---|
| `name` | string | Nom complet (obligatoire) |
| `email` | string | Email — **obligatoire, unique**, utilisé pour la connexion |
| `accountRole` | `'secretaire'` \| `'membre'` | Niveau d'accès |
| `role` | string | Titre dans l'association (ex : "Membre actif", "Trésorier") |
| `phone`, `cni`, `dob`, `address`, `momoNumber`, `photo` | string | Informations personnelles |
| `monthlyContribution` | number | Cotisation mensuelle (FCFA) |
| `joinDate` | string | Date d'adhésion |
| `mustChangePassword` | boolean | `true` jusqu'à ce que le membre change son mot de passe initial |

---

## 8. Intégration avec le frontend (étapes suivantes)

Ce backend remplace progressivement le `localStorage` et le fichier statique
`auth.config.js`. Pour le brancher au frontend React existant, il faudra :

1. **`AuthContext.jsx`** : remplacer la vérification locale par un appel à
   `POST /api/auth/login`, stocker le `token` reçu (dans `localStorage` ou
   un cookie) et l'envoyer dans l'en-tête `Authorization` de chaque requête.
2. **Page "Changer mon mot de passe"** : afficher cette page obligatoirement
   si `mustChangePassword === true` après connexion.
3. **`MemberForm.jsx`** : ajouter le champ **Email** (obligatoire), et
   appeler `POST /api/members` / `PUT /api/members/:id` au lieu de
   `StorageService`.
4. **Liste des membres** : charger via `GET /api/members` au lieu de
   `localStorage`.

➡️ Dites-moi quand vous voulez que je fasse ces modifications dans le
frontend — je pourrai m'appuyer sur le projet déjà fourni précédemment.

---

## 9. Sécurité — à ne pas oublier

- Changez `JWT_SECRET` et le mot de passe du compte secrétaire (`SECRETARY_PASSWORD`)
  avant toute mise en production.
- Ne committez jamais le fichier `.env` (déjà exclu via `.gitignore`).
- En production, MongoDB et le serveur doivent être protégés (pare-feu,
  authentification MongoDB activée, HTTPS).
