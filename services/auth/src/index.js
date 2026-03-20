const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const port = process.env.PORT || 4001;
const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/authdb';
const dbName = mongoUri.split('/').pop();
let users, channel;

async function init() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  users = client.db(dbName).collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  channel = await conn.createChannel();
  await channel.assertExchange('app.events', 'topic', { durable: true });
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'auth' }));
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await users.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = { name, email, passwordHash, createdAt: new Date() };
    const result = await users.insertOne(doc);
    channel.publish('app.events', 'user.created', Buffer.from(JSON.stringify({ userId: result.insertedId.toString(), name, email })));
    res.status(201).json({ id: result.insertedId, name, email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user._id.toString(), email: user.email, name: user.name }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1d' });
  channel.publish('app.events', 'user.logged_in', Buffer.from(JSON.stringify({ userId: user._id.toString(), email })));
  res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
});
init().then(() => app.listen(port, () => console.log(`auth on ${port}`))).catch(err => { console.error(err); process.exit(1); });
