const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const port = process.env.PORT || 4004;
const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/notificationsdb';
const dbName = mongoUri.split('/').pop();
let notifications;

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'devsecret'); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}

async function init() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  notifications = client.db(dbName).collection('notifications');
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  const channel = await conn.createChannel();
  await channel.assertExchange('app.events', 'topic', { durable: true });
  const q = await channel.assertQueue('notifications.queue', { durable: true });
  await channel.bindQueue(q.queue, 'app.events', 'user.*');
  await channel.bindQueue(q.queue, 'app.events', 'order.*');
  channel.consume(q.queue, async msg => {
    if (!msg) return;
    await notifications.insertOne({ routingKey: msg.fields.routingKey, payload: JSON.parse(msg.content.toString()), createdAt: new Date() });
    channel.ack(msg);
  });
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'notifications' }));
app.get('/', auth, async (req, res) => {
  const rows = await notifications.find({ $or: [{ 'payload.userId': req.user.sub }, { 'payload.email': req.user.email }] }).sort({ createdAt: -1 }).limit(50).toArray();
  res.json(rows);
});
init().then(() => app.listen(port, () => console.log(`notifications on ${port}`))).catch(err => { console.error(err); process.exit(1); });
