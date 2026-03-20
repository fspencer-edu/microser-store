const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const redis = new Redis({ host: process.env.REDIS_HOST || 'redis', port: Number(process.env.REDIS_PORT || 6379), lazyConnect: true, maxRetriesPerRequest: 1 });
redis.connect().catch(() => console.log('Redis not ready yet'));

const routes = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://auth:4001',
  '/api/users': process.env.USER_SERVICE_URL || 'http://users:4002',
  '/api/orders': process.env.ORDER_SERVICE_URL || 'http://orders:4003',
  '/api/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://notifications:4004'
};

async function rateLimit(req, res, next) {
  try {
    const key = `rl:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    if (count > 120) return res.status(429).json({ error: 'Too many requests' });
  } catch {}
  next();
}

function authRequired(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function proxy(req, res, base, requireAuth = false) {
  if (requireAuth) {
    let ok = false;
    authRequired(req, { status: c => ({ json: o => res.status(c).json(o) }) }, () => ok = true);
    if (!ok) return;
  }
  const target = routes[base];
  if (!target) return res.status(404).json({ error: 'Route not found' });
  const path = req.originalUrl.replace(base, '') || '/';
  const response = await fetch(`${target}${path}`, {
    method: req.method,
    headers: { 'Content-Type': 'application/json', authorization: req.headers.authorization || '' },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
  });
  const text = await response.text();
  res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(text);
}

app.get('/health', (_, res) => res.json({ ok: true, service: 'gateway' }));
app.use(rateLimit);
app.use('/api/auth', (req, res) => proxy(req, res, '/api/auth', false));
app.use('/api/users', (req, res) => proxy(req, res, '/api/users', true));
app.use('/api/orders', (req, res) => proxy(req, res, '/api/orders', true));
app.use('/api/notifications', (req, res) => proxy(req, res, '/api/notifications', true));

app.listen(process.env.PORT || 8080, () => console.log('gateway on 8080'));
