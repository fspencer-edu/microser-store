const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const amqp = require('amqplib');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const port = process.env.PORT || 4003;
const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/ordersdb';
const dbName = mongoUri.split('/').pop();
let orders, channel;

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'devsecret'); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}

async function init() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  orders = client.db(dbName).collection('orders');
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  channel = await conn.createChannel();
  await channel.assertExchange('app.events', 'topic', { durable: true });
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'orders' }));
app.post('/', auth, async (req, res) => {
  const doc = { userId: req.user.sub, email: req.user.email, items: req.body.items || [], total: req.body.total || 0, status: 'created', createdAt: new Date() };
  const r = await orders.insertOne(doc);
  const out = { id: r.insertedId.toString(), ...doc };
  channel.publish('app.events', 'order.created', Buffer.from(JSON.stringify(out)));
  res.status(201).json(out);
});
app.get('/', auth, async (req, res) => res.json(await orders.find({ userId: req.user.sub }).sort({ createdAt: -1 }).toArray()));
app.patch('/:id/status', auth, async (req, res) => {
  await orders.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: req.body.status, updatedAt: new Date() } });
  const order = await orders.findOne({ _id: new ObjectId(req.params.id) });
  channel.publish('app.events', `order.${req.body.status}`, Buffer.from(JSON.stringify(order)));
  res.json(order);
});
init().then(() => app.listen(port, () => console.log(`orders on ${port}`))).catch(err => { console.error(err); process.exit(1); });
