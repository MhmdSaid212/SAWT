"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem("sawt_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://127.0.0.1:8000/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        return response.json();
      })
      .then((data) => {
        const role = data?.user?.role;

        if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "parent") {
          window.location.href = "/parent";
        } else if (role === "therapist") {
          window.location.href = "/therapist";
        } else if (role === "child") {
          window.location.href = "/child";
        } else {
          localStorage.removeItem("sawt_token");
          window.location.href = "/login";
        }
      })
      .catch(() => {
        localStorage.removeItem("sawt_token");
        window.location.href = "/login";
      });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-cream font-body text-ink">
      <p className="text-sm font-semibold text-muted">
        Loading SAWT...
      </p>
    </main>
  );
}