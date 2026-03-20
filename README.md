# Microservices Platform

Gateway for routing/auth

Frontend pages as a web client

MongoDB for document data

RabbitMQ for async events

Redis for caching, sessions, rate limiting

Docker Compose for local dev

Kubernetes for deployment


```bash
[ React / Next.js frontend ]
            |
            v
      [ API Gateway ]
            |
   -----------------------
   |    |      |        |
   v    v      v        v
 auth  users  orders  notifications
 svc   svc    svc     svc
   |     |      |        |
   |     |      |        |
 Mongo Mongo   Mongo    Mongo
        |
        +---- Redis (cache / sessions / rate limits)

Async events:
orders -> RabbitMQ -> notifications
users  -> RabbitMQ -> audit/logging
auth   -> RabbitMQ -> email / welcome events
```

```bash
/ landing page

/login

/register

/dashboard

/products

/cart

/orders

/admin

/notifications
```



- Docker Compose
    - Servies on the same app network can reach each other by service name
- In Kubernetes, SVC provide stable networking to Pods
- StatefulSets are used for persistent storage
- ConfigMaps are for non-secret config
- Secrets are for hidden values
- RabbitMQ used as a message broker


1. Gateway-service
    - Single entry point
    - JWT validation
    - Route forwarding
    - Rate limiting with Redis
    - Request logging
    - API aggregation
    - Node.js + express

2. Auth-service
    - register/login
    - passowrd hashing
    - JWT issuing
    - Refresh tokens
    - Publish `user.created` to RabbitMQ
    - MongoDB

3. User-service
    - CRUD
    - Addresses
    - Preferences
    - MongoDB

4. Order-service
    - Create order
    - Update order status
    - publish `order.created, order.paid, order.shipped`
    - MongoDB

5. Notification-service
    - consume RabbitMQ messages
    - send email
    - persist notification history
    - MongoDB

6. Frontend
    - Render pages
    - Call gateway only
    - Store auth token
    - Next.js