"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("sawt_token", data.access_token);

      const meResponse = await fetch(
        "http://127.0.0.1:8000/me",
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      const user = await meResponse.json();

      if (!meResponse.ok) {
        throw new Error("Unable to load user profile");
      }

      if (user.user.role === "parent") {
        router.push("/parent");
      } else if (user.user.role === "child") {
        router.push("/child");
      } else if (user.user.role === "therapist") {
        router.push("/therapist");
      } else if (user.user.role === "admin") {
        router.push("/admin");
      } else {
        throw new Error("Unknown user role");
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12 text-ink">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-[2rem] bg-card p-8 clay">
          <div className="text-center">
            <p className="font-display text-4xl font-bold">
              SAWT<span className="text-accent2">.</span>
            </p>

            <p className="mt-2 text-sm text-muted">
              Speech practice companion
            </p>
          </div>

          <div className="mt-8">
            <h1 className="font-display text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-muted">
              Sign in to continue your SAWT journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none ring-0 focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none ring-0 focus:ring-2 focus:ring-brand"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold text-brand">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand px-5 py-3 font-bold text-brand-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            <span>Don&apos;t have a parent account? </span>

            <Link
              href="/register"
              className="font-bold text-brand"
            >
              Create one
            </Link>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted">
            SAWT supports professional speech therapy. It does not
            replace a speech therapist or provide a medical diagnosis.
          </p>
        </div>
      </div>
    </main>
  );
}