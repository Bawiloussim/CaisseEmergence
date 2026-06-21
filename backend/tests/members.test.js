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
