"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SawtLogo } from "@/components/role-shell";

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sawt_token");

    if (!token) {
      router.replace("/login");
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

        if (role !== "admin") {
          if (role === "parent") {
            router.replace("/parent");
          } else if (role === "therapist") {
            router.replace("/therapist");
          } else if (role === "child") {
            router.replace("/child");
          } else {
            localStorage.removeItem("sawt_token");
            router.replace("/login");
          }

          return;
        }

        setCheckingAuth(false);
      })
      .catch(() => {
        localStorage.removeItem("sawt_token");
        router.replace("/login");
      });
  }, [router]);

  function signOut() {
    localStorage.removeItem("sawt_token");
    router.push("/login");
  }

  if (checkingAuth) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream font-body text-ink">
        <p className="text-sm font-semibold text-muted">
          Checking access...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream font-body text-ink">
      {/* Navbar */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <SawtLogo />

          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/therapists"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Therapists
            </Link>

            <Link
              href="/admin/users"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Users
            </Link>

            <Link
              href="/admin/activity"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Activity
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Admin space
        </p>

        <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
          SAWT Admin Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Manage therapists, users, verification, and system activity.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-card p-6 clay">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
              Therapists
            </p>

            <p className="mt-3 font-display text-3xl font-bold">
              Manage
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              Create therapist accounts and review verification status.
            </p>

            <Link
              href="/admin/therapists"
              className="mt-5 inline-flex rounded-full bg-butter px-4 py-2 text-xs font-bold clay-sm clay-press"
            >
              Open Therapists →
            </Link>
          </div>

          <div className="rounded-3xl bg-card p-6 clay">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
              Users
            </p>

            <p className="mt-3 font-display text-3xl font-bold">
              Manage
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              Manage parents, children, and administrators accounts.
            </p>

            <Link
              href="/admin/users"
              className="mt-5 inline-flex rounded-full bg-mint px-4 py-2 text-xs font-bold clay-sm clay-press"
            >
              Open Users →
            </Link>
          </div>

          <div className="rounded-3xl bg-card p-6 clay">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
              Activity
            </p>

            <p className="mt-3 font-display text-3xl font-bold">
              View
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              Review important system actions and administrative activity.
            </p>

            <Link
              href="/admin/activity"
              className="mt-5 inline-flex rounded-full bg-accent2 px-4 py-2 text-xs font-bold text-accent-foreground clay-sm clay-press"
            >
              Open Activity →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}