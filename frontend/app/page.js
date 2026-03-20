export default function HomePage() {
  return (
    <div>
      <h1>Microservices Commerce Demo</h1>
      <p>Gateway, MongoDB, RabbitMQ, Redis, Docker, and Kubernetes.</p>
      <ul>
        <li>Auth and users</li>
        <li>Orders with event publishing</li>
        <li>Notifications from RabbitMQ</li>
        <li>Redis-backed rate limiting in gateway</li>
      </ul>
    </div>
  );
}
