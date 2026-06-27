const request = require('supertest');
const app = require('../app');
const Member = require('../models/Member');
const AuditLog = require('../models/AuditLog');
const { connect, clear, close } = require('./testDb');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clear();
});

afterAll(async () => {
  await close();
});

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function createSecretaryToken() {
  await Member.create({
    name: 'Secrétaire',
    email: 'secretaire@example.com',
    password: 'secret123',
    accountRole: 'secretaire',
  });
  return loginAs('secretaire@example.com', 'secret123');
}

describe('POST /api/members', () => {
  it('crée un membre quand on est secrétaire et journalise l\'action', async () => {
    const token = await createSecretaryToken();

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nouveau Membre', email: 'nouveau@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.member.email).toBe('nouveau@example.com');
    expect(res.body.member.mustChangePassword).toBe(true);

    const log = await AuditLog.findOne({ action: 'create' });
    expect(log).not.toBeNull();
    expect(log.resourceLabel).toContain('nouveau@example.com');
  });

  it('refuse la création sans nom ni email', async () => {
    const token = await createSecretaryToken();
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("refuse les doublons d'email", async () => {
    const token = await createSecretaryToken();
    await Member.create({ name: 'Existant', email: 'dup@example.com', password: 'x' });

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Autre', email: 'dup@example.com' });

    expect(res.status).toBe(409);
  });

  it('refuse la création à un membre non secrétaire', async () => {
    await Member.create({
      name: 'Membre',
      email: 'membre@example.com',
      password: 'secret123',
      accountRole: 'membre',
    });
    const token = await loginAs('membre@example.com', 'secret123');

    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', email: 'x@example.com' });

    expect(res.status).toBe(403);
  });

  it('refuse sans token', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/members', () => {
  it('liste les membres pour un compte membre (lecture seule)', async () => {
    await Member.create({
      name: 'Membre',
      email: 'membre@example.com',
      password: 'secret123',
      accountRole: 'membre',
    });
    const token = await loginAs('membre@example.com', 'secret123');

    const res = await request(app).get('/api/members').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('DELETE /api/members/:id', () => {
  it('empêche de supprimer le dernier compte secrétaire', async () => {
    const sec = await Member.create({
      name: 'Secrétaire',
      email: 'secretaire@example.com',
      password: 'secret123',
      accountRole: 'secretaire',
    });
    const token = await loginAs('secretaire@example.com', 'secret123');

    const res = await request(app)
      .delete(`/api/members/${sec._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('autorise la suppression si un autre secrétaire existe', async () => {
    const sec1 = await Member.create({
      name: 'Secrétaire 1',
      email: 'sec1@example.com',
      password: 'secret123',
      accountRole: 'secretaire',
    });
    await Member.create({
      name: 'Secrétaire 2',
      email: 'sec2@example.com',
      password: 'secret123',
      accountRole: 'secretaire',
    });
    const token = await loginAs('sec1@example.com', 'secret123');

    const res = await request(app)
      .delete(`/api/members/${sec1._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('empêche de supprimer le dernier compte trésorier ou président', async () => {
    const secToken = await createSecretaryToken();
    const tresorier = await Member.create({
      name: 'Trésorier',
      email: 'tresorier@example.com',
      password: 'secret123',
      accountRole: 'tresorier',
    });
    const president = await Member.create({
      name: 'Président',
      email: 'president@example.com',
      password: 'secret123',
      accountRole: 'president',
    });

    const resTres = await request(app)
      .delete(`/api/members/${tresorier._id}`)
      .set('Authorization', `Bearer ${secToken}`);
    expect(resTres.status).toBe(400);

    const resPres = await request(app)
      .delete(`/api/members/${president._id}`)
      .set('Authorization', `Bearer ${secToken}`);
    expect(resPres.status).toBe(400);
  });

  it('autorise la suppression du trésorier si un autre trésorier existe', async () => {
    const secToken = await createSecretaryToken();
    const tres1 = await Member.create({
      name: 'Trésorier 1',
      email: 'tres1@example.com',
      password: 'secret123',
      accountRole: 'tresorier',
    });
    await Member.create({
      name: 'Trésorier 2',
      email: 'tres2@example.com',
      password: 'secret123',
      accountRole: 'tresorier',
    });

    const res = await request(app)
      .delete(`/api/members/${tres1._id}`)
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/members/:id/resend-invitation', () => {
  it("génère un nouveau mot de passe sans recréer le compte ni perdre ses données", async () => {
    const token = await createSecretaryToken();
    const member = await Member.create({
      name: 'Membre',
      email: 'membre@example.com',
      password: 'ancienMotDePasse',
      accountRole: 'membre',
      mustChangePassword: false,
    });

    const res = await request(app)
      .post(`/api/members/${member._id}/resend-invitation`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Le compte n'a jamais été supprimé : même _id.
    const stillExists = await Member.findById(member._id);
    expect(stillExists).not.toBeNull();
    expect(stillExists.mustChangePassword).toBe(true);

    // L'ancien mot de passe ne fonctionne plus (un nouveau a été généré).
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'membre@example.com', password: 'ancienMotDePasse' });
    expect(oldLogin.status).toBe(401);
  });

  it('refuse à un membre non secrétaire de renvoyer une invitation', async () => {
    await createSecretaryToken();
    const member = await Member.create({ name: 'Membre', email: 'membre@example.com', password: 'secret123' });
    const memberToken = await loginAs('membre@example.com', 'secret123');

    const res = await request(app)
      .post(`/api/members/${member._id}/resend-invitation`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('renvoie 404 pour un membre inexistant', async () => {
    const token = await createSecretaryToken();
    const res = await request(app)
      .post('/api/members/000000000000000000000000/resend-invitation')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/members/birthdays/today', () => {
  it("retourne uniquement les membres dont l'anniversaire est aujourd'hui", async () => {
    const token = await createSecretaryToken();
    const today = new Date();
    const todayStr = `2000-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await Member.create({ name: 'Fêté', email: 'fete@example.com', password: 'secret123', birthday: todayStr });
    await Member.create({ name: 'Pas fêté', email: 'pasfete@example.com', password: 'secret123', birthday: '2000-01-01' });

    const res = await request(app)
      .get('/api/members/birthdays/today')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Fêté');
  });
});

describe('POST /api/members/birthdays/notify', () => {
  const originalSecret = process.env.CRON_SECRET;
  beforeAll(() => { process.env.CRON_SECRET = 'test-cron-secret'; });
  afterAll(() => { process.env.CRON_SECRET = originalSecret; });

  it('refuse une requête sans le bon secret', async () => {
    const res = await request(app)
      .post('/api/members/birthdays/notify')
      .set('X-Cron-Secret', 'mauvais-secret');

    expect(res.status).toBe(401);
  });

  it("ne tente aucun envoi si personne n'a anniversaire aujourd'hui", async () => {
    await Member.create({ name: 'Membre', email: 'membre@example.com', password: 'secret123', birthday: '2000-01-01' });

    const res = await request(app)
      .post('/api/members/birthdays/notify')
      .set('X-Cron-Secret', 'test-cron-secret');

    expect(res.status).toBe(200);
    expect(res.body.celebrants).toEqual([]);
    expect(res.body.sent).toBe(0);
  });

  it("identifie le(s) fêté(s) du jour et tente d'envoyer aux autres membres", async () => {
    const today = new Date();
    const todayStr = `2000-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await Member.create({ name: 'Fêté', email: 'fete@example.com', password: 'secret123', birthday: todayStr });
    await Member.create({ name: 'Collègue', email: 'collegue@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/members/birthdays/notify')
      .set('X-Cron-Secret', 'test-cron-secret');

    expect(res.status).toBe(200);
    expect(res.body.celebrants).toEqual(['Fêté']);
    // Pas de BREVO_API_KEY en test : l'envoi échoue mais l'endpoint répond bien.
    expect(res.body.failed.length).toBeGreaterThan(0);
  });
});
