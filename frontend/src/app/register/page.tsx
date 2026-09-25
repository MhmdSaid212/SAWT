"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Registration API will be connected in the next step.
      const response = await fetch(
  "http://127.0.0.1:8000/auth/register",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data?.detail || "Failed to create account"
  );
}

window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream px-6 py-10 font-body text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-card clay md:grid-cols-2">
          {/* Left side */}
          <div className="flex flex-col justify-center bg-brand p-8 text-brand-foreground md:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">
              Welcome to SAWT
            </p>

            <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">
              Start your child&apos;s practice journey.
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 opacity-80">
              Create a parent account to manage your children&apos;s
              pronunciation practice, follow their progress, and stay
              connected with their therapy journey.
            </p>
          </div>

          {/* Form */}
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Parent Registration
              </p>

              <h2 className="mt-2 font-display text-3xl font-bold">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Register as a parent to get started with SAWT.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand"
                />
              </div>

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
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand"
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
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-bold"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  minLength={6}
                  placeholder="Repeat your password"
                  className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-accent2 px-4 py-3 text-sm font-semibold text-accent-foreground">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-bold text-cream clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-brand hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}