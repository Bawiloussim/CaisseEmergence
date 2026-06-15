# Déploiement gratuit — Backend sur Render + MongoDB Atlas

Votre frontend est déjà en ligne sur Vercel :
`https://caisse-emergence.vercel.app`

Il reste à mettre le backend en ligne et à les relier. Tout est gratuit.

---

## Étape 1 — Base de données : MongoDB Atlas (gratuit, illimité dans le temps)

Render ne peut pas accéder à votre MongoDB local : il faut une base accessible
depuis internet.

1. Créez un compte sur [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Build a Database** → choisissez **M0 / Free**.
3. **Database Access** → créez un utilisateur (ex: `caisse_app`) avec un mot
   de passe (notez-le).
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`). C'est nécessaire car Render (gratuit) n'a pas d'IP fixe.
5. **Database → Connect → Drivers** → copiez la chaîne de connexion, du type :
   ```
   mongodb+srv://caisse_app:<motdepasse>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Remplacez `<motdepasse>` par le vrai mot de passe, et ajoutez le nom de la
   base juste avant le `?` :
   ```
   mongodb+srv://caisse_app:VotreMotDePasse@cluster0.xxxxx.mongodb.net/caisse_emergence?retryWrites=true&w=majority
   ```
   → C'est votre futur `MONGODB_URI`.

---

## Étape 2 — Mettre le backend sur GitHub

Render déploie depuis un dépôt Git.

1. Sur [github.com](https://github.com), créez un nouveau dépôt (ex:
   `caisse-emergence-backend`), vide, sans README.
2. Dans le dossier `caisse-emergence-backend` sur votre ordinateur :
   ```bash
   git init
   git add .
   git commit -m "Backend Caisse Emergence"
   git branch -M main
   git remote add origin https://github.com/VOTRE-PSEUDO/caisse-emergence-backend.git
   git push -u origin main
   ```
   (Le fichier `.gitignore` exclut déjà `node_modules` et `.env`.)

---

## Étape 3 — Déployer sur Render

1. Créez un compte sur [render.com](https://render.com) (pas de carte
   bancaire nécessaire pour le plan gratuit).
2. **New +** → **Web Service** → connectez votre dépôt GitHub
   `caisse-emergence-backend`.
3. Renseignez :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : **Free**
4. **Environment** → ajoutez les variables (mêmes noms que `.env.example`) :

   | Variable | Valeur |
   |---|---|
   | `MONGODB_URI` | la chaîne Atlas de l'étape 1 |
   | `JWT_SECRET` | une longue chaîne aléatoire (générez-en une avec la commande ci-dessous) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `https://caisse-emergence.vercel.app` |
   | `ASSOCIATION_NAME` | `La Caisse Emergence` |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | vos identifiants email (voir `.env.example`) |
   | `SECRETARY_NAME`, `SECRETARY_EMAIL`, `SECRETARY_PASSWORD` | identifiants du compte secrétaire |

   Générer un `JWT_SECRET` :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Create Web Service**. Au bout de quelques minutes, Render vous donne une
   URL du type :
   ```
   https://caisse-emergence-backend.onrender.com
   ```

> ⚠️ Le plan gratuit "s'endort" après 15 minutes sans visite, et met
> 30-60 secondes à se réveiller au premier appel suivant. C'est normal — pas
> une panne.

---

## Étape 4 — Créer le compte secrétaire (une seule fois)

Le script `npm run seed` doit s'exécuter contre la base **Atlas** (pas votre
MongoDB local). Sur votre ordinateur :

1. Dans `caisse-emergence-backend/.env`, mettez temporairement
   `MONGODB_URI` = la chaîne **Atlas** (celle de l'étape 1), avec les bonnes
   valeurs `SECRETARY_*`.
2. Lancez :
   ```bash
   npm run seed
   ```
   Cela crée le compte secrétaire directement dans la base utilisée par
   Render.
3. Vous pouvez ensuite remettre `MONGODB_URI` en local dans votre `.env` si
   vous continuez à développer en local.

---

## Étape 5 — Relier le frontend (Vercel) au backend (Render)

1. Sur [vercel.com](https://vercel.com), ouvrez votre projet
   `caisse-emergence`.
2. **Settings → Environment Variables** → ajoutez :
   ```
   VITE_API_URL = https://caisse-emergence-backend.onrender.com/api
   ```
   (remplacez par votre vraie URL Render, en gardant `/api` à la fin)
3. **Deployments** → menu `⋯` sur le dernier déploiement → **Redeploy**.
   (Indispensable : les variables `VITE_...` sont injectées au moment du
   build, pas à l'exécution.)

---

## Étape 6 — Tester

1. Ouvrez `https://caisse-emergence.vercel.app/`.
2. Connectez-vous avec l'email/mot de passe `SECRETARY_*` définis sur Render.
3. Si le premier chargement échoue ou est lent, c'est probablement le
   "réveil" de Render (étape 3) — rechargez après quelques secondes.

---

## Résumé des URLs

| Service | URL |
|---|---|
| Frontend (Vercel) | `https://caisse-emergence.vercel.app` |
| Backend (Render) | `https://caisse-emergence-backend.onrender.com` |
| Base de données | MongoDB Atlas (cluster M0 gratuit) |
