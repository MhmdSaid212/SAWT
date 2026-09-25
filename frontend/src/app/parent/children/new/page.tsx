"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ClayCard, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/parent" },
  { label: "Children", href: "/parent/children" },
  { label: "Progress", href: "/parent/progress" },
  { label: "Activity", href: "/parent/activity" },
  { label: "Profile", href: "/parent/profile" },
];

export default function NewChildPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    language_preference: "English",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/children/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create child"
        );
      }

      router.push("/parent/children");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Parent space" />
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/parent/children";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
                      : "rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/parent/children"
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Back to children
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20">
        <section className="pt-10">
          <SectionLabel>Children</SectionLabel>

          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
            Add a child
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Create a child profile and login account so they can
            practice their assigned speech exercises.
          </p>
        </section>

        <section className="mt-10">
          <ClayCard className="rounded-[2rem] p-7 md:p-9">
            <form
              onSubmit={handleSubmit}
              className="space-y-7"
            >
              <div>
                <SectionLabel>Child information</SectionLabel>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(event) =>
                        updateField(
                          "full_name",
                          event.target.value
                        )
                      }
                      required
                      minLength={2}
                      placeholder="Enter child's full name"
                      className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm outline-none clay-sm focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Date of birth
                    </label>

                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(event) =>
                        updateField(
                          "date_of_birth",
                          event.target.value
                        )
                      }
                      required
                      className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm outline-none clay-sm focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Language
                    </label>

                    <select
                      value={form.language_preference}
                      onChange={(event) =>
                        updateField(
                          "language_preference",
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm outline-none clay-sm focus:ring-2 focus:ring-brand/30"
                    >
                      <option value="English">
                        English
                      </option>
                      <option value="Arabic">
                        Arabic
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-ink/10 pt-7">
                <SectionLabel>
                  Child login
                </SectionLabel>

                <p className="mt-2 text-sm leading-6 text-muted">
                  These credentials will be used by the child to
                  access their practice space.
                </p>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold">
                      Email
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      required
                      placeholder="child@example.com"
                      className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm outline-none clay-sm focus:ring-2 focus:ring-brand/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Password
                    </label>

                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value
                        )
                      }
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm outline-none clay-sm focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-soft p-4 text-sm font-semibold text-brand">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-7 sm:flex-row sm:justify-end">
                <Link
                  href="/parent/children"
                  className="rounded-full bg-card px-6 py-3 text-center text-sm font-bold clay-sm clay-press"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating..."
                    : "Create child"}
                </button>
              </div>
            </form>
          </ClayCard>
        </section>

        <section className="mt-8">
          <div className="rounded-[2rem] bg-soft p-6 clay-sm">
            <p className="text-center text-xs leading-relaxed text-muted">
              A child account is created by the parent. The child
              does not need to register separately.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — Arabic + English speech practice companion.
          </p>

          <div className="flex gap-5 text-sm text-muted">
            <Link href="/parent">Dashboard</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}