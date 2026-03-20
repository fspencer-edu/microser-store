"use client";
import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "admin@example.com", password: "Admin123!" });
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setResult(data);
    if (data.token) localStorage.setItem("token", data.token);
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Login</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
