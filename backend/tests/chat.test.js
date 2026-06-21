const request = require('supertest');
const app = require('../app');
const Member = require('../models/Member');
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

async function setup() {
  const alice = await Member.create({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
  const bob = await Member.create({ name: 'Bob', email: 'bob@example.com', password: 'secret123' });
  const aliceToken = await loginAs('alice@example.com', 'secret123');
  const bobToken = await loginAs('bob@example.com', 'secret123');
  return { alice, bob, aliceToken, bobToken };
}

describe('POST /api/chat/messages', () => {
  it('publie un message visible par tous', async () => {
    const { aliceToken, bobToken } = await setup();

    const post = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ text: 'Bonjour à tous' });

    expect(post.status).toBe(201);
    expect(post.body.text).toBe('Bonjour à tous');
    expect(post.body.senderName).toBe('Alice');

    const list = await request(app)
      .get('/api/chat/messages')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].text).toBe('Bonjour à tous');
  });

  it('refuse un message vide', async () => {
    const { aliceToken } = await setup();
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ text: '   ' });

    expect(res.status).toBe(400);
  });

  it('refuse sans token', async () => {
    const res = await request(app).post('/api/chat/messages').send({ text: 'Salut' });
    expect(res.status).toBe(401);
  });
});

describe('Présence en ligne', () => {
  it("un message met à jour la dernière activité de l'expéditeur", async () => {
    const { alice, aliceToken, bobToken } = await setup();

    await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ text: 'Coucou' });

    const online = await request(app)
      .get('/api/chat/online')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(online.status).toBe(200);
    expect(online.body.map((m) => m.id)).toContain(String(alice._id));
  });

  it('le heartbeat marque un membre comme en ligne sans qu\'il poste de message', async () => {
    const { bob, bobToken } = await setup();

    await request(app)
      .post('/api/chat/heartbeat')
      .set('Authorization', `Bearer ${bobToken}`);

    const online = await request(app)
      .get('/api/chat/online')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(online.body.map((m) => m.id)).toContain(String(bob._id));
  });

  it("un membre n'ayant jamais été actif n'apparaît pas en ligne", async () => {
    const { aliceToken, bobToken } = await setup();

    await request(app)
      .post('/api/chat/heartbeat')
      .set('Authorization', `Bearer ${aliceToken}`);

    const online = await request(app)
      .get('/api/chat/online')
      .set('Authorization', `Bearer ${bobToken}`);

    const onlineIds = online.body.map((m) => m.name);
    expect(onlineIds).toContain('Alice');
    expect(onlineIds).not.toContain('Bob');
  });
});
