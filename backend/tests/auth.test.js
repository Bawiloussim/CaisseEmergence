const request = require('supertest');
const crypto = require('crypto');
const app = require('../app');
const Member = require('../models/Member');
const { connect, clear, close } = require('./testDb');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clear();
});

afterAll(async () => {
  await close();
});

describe('POST /api/auth/login', () => {
  it('connecte un membre avec les bons identifiants', async () => {
    await Member.create({
      name: 'Test Membre',
      email: 'test@example.com',
      password: 'secret123',
      accountRole: 'secretaire',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('refuse un mauvais mot de passe', async () => {
    await Member.create({ name: 'Test', email: 'test@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('refuse un email inconnu', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  it('exige un email et un mot de passe', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it("refuse l'accès sans token", async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('renvoie le profil avec un token valide', async () => {
    await Member.create({ name: 'Test', email: 'test@example.com', password: 'secret123' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret123' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });
});

describe('Mot de passe oublié', () => {
  it('répond de façon générique même pour un email inconnu (ne révèle rien)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'inconnu@example.com' });

    expect(res.status).toBe(200);
  });

  it('permet de réinitialiser le mot de passe avec le bon code, sans perdre le compte', async () => {
    jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);

    const member = await Member.create({
      name: 'Test Membre',
      email: 'test@example.com',
      password: 'ancien123',
      accountRole: 'membre',
    });

    await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com', code: '123456', newPassword: 'nouveau123' });

    expect(reset.status).toBe(200);

    // Le compte (et donc ses données associées) n'a jamais été supprimé.
    const stillExists = await Member.findById(member._id);
    expect(stillExists).not.toBeNull();

    // L'ancien mot de passe ne fonctionne plus, le nouveau oui.
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'ancien123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'nouveau123' });
    expect(newLogin.status).toBe(200);
  });

  it('refuse un code incorrect', async () => {
    jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);
    await Member.create({ name: 'Test', email: 'test@example.com', password: 'secret123' });
    await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com', code: '000000', newPassword: 'nouveau123' });

    expect(res.status).toBe(400);
  });

  it("refuse un code s'il n'y a jamais eu de demande", async () => {
    await Member.create({ name: 'Test', email: 'test@example.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com', code: '123456', newPassword: 'nouveau123' });

    expect(res.status).toBe(400);
  });

  it('refuse un nouveau mot de passe trop court', async () => {
    jest.spyOn(crypto, 'randomInt').mockReturnValue(123456);
    await Member.create({ name: 'Test', email: 'test@example.com', password: 'secret123' });
    await request(app).post('/api/auth/forgot-password').send({ email: 'test@example.com' });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com', code: '123456', newPassword: '123' });

    expect(res.status).toBe(400);
  });
});
