const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
const port = process.env.PORT || 4002;
const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/usersdb';
const dbName = mongoUri.split('/').pop();
let profiles;

function auth(req, res, next) {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'devsecret'); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}

async function init() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  profiles = client.db(dbName).collection('profiles');
  await profiles.createIndex({ email: 1 }, { unique: true });
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'users' }));
app.get('/me', auth, async (req, res) => {
  let me = await profiles.findOne({ email: req.user.email });
  if (!me) {
    const doc = { userId: req.user.sub, email: req.user.email, name: req.user.name, addresses: [], preferences: {}, createdAt: new Date() };
    const r = await profiles.insertOne(doc);
    me = { _id: r.insertedId, ...doc };
  }
  res.json(me);
});
app.put('/me', auth, async (req, res) => {
  await profiles.updateOne({ email: req.user.email }, { $set: { ...req.body, updatedAt: new Date() } }, { upsert: true });
  res.json(await profiles.findOne({ email: req.user.email }));
});
app.get('/:id', auth, async (req, res) => res.json(await profiles.findOne({ _id: new ObjectId(req.params.id) })));
init().then(() => app.listen(port, () => console.log(`users on ${port}`))).catch(err => { console.error(err); process.exit(1); });
