"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setMe).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(me, null, 2)}</pre>
    </div>
  );
}
