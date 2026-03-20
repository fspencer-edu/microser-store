"use client";
import { useState } from "react";

export default function OrdersPage() {
  const [result, setResult] = useState(null);

  async function createOrder() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: [{ sku: "keyboard", qty: 1 }], total: 129 })
    });
    setResult(await res.json());
  }

  return (
    <div>
      <h1>Orders</h1>
      <button onClick={createOrder}>Create Sample Order</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
