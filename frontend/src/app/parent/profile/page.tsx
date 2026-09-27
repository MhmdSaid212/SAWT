"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ClayCard,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/api";
import {
  getToken,
  removeToken,
} from "@/lib/auth";

type ParentProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const navItems = [
  { label: "Dashboard", href: "/parent" },
  { label: "Children", href: "/parent/children" },
  { label: "Progress", href: "/parent/progress" },
  { label: "Activity", href: "/parent/activity" },
  { label: "Profile", href: "/parent/profile" },
];

export default function ParentProfilePage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<ParentProfile | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await getMyProfile(token);

        if (data.role !== "parent") {
          router.push("/login");
          return;
        }

        const loadedProfile: ParentProfile = {
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          role: data.role,
        };

        setProfile(loadedProfile);
        setName(loadedProfile.name);
        setEmail(loadedProfile.email);
      } catch (err) {
        console.error("Profile error:", err);
        setError("Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  function handleCancel() {
    if (!profile) return;

    setName(profile.name);
    setEmail(profile.email);
    setPassword("");
    setConfirmPassword("");

    setError("");
    setSuccess("");
  }

  async function handleSave() {
    const token = getToken();

    if (!token || !profile) {
      router.push("/login");
      return;
    }

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email cannot be empty.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password && password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    const changes: {
      name?: string;
      email?: string;
      password?: string;
    } = {};

    if (trimmedName !== profile.name) {
      changes.name = trimmedName;
    }

    if (trimmedEmail !== profile.email) {
      changes.email = trimmedEmail;
    }

    if (password) {
      changes.password = password;
    }

    if (Object.keys(changes).length === 0) {
      setSuccess("Your profile is already up to date.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updateMyProfile(
        changes,
        token
      );

      const updatedProfile: ParentProfile = {
        id: updated.id,
        name: updated.name || "",
        email: updated.email || "",
        role: updated.role || "parent",
      };

      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setEmail(updatedProfile.email);

      setPassword("");
      setConfirmPassword("");

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* Header */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Parent space" />
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex flex-wrap items-center justify-end gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/parent/profile";

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

            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold text-ink clay-sm clay-press"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="min-w-0 flex-1 px-6 pb-20 pt-10 md:px-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          {/* Page heading */}
          <section className="flex flex-col gap-6">
            <div>
              <SectionLabel>PROFILE</SectionLabel>

              <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                Your profile
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Manage your SAWT parent account and security
                information.
              </p>
            </div>
          </section>

          {/* Loading */}
          {loading && (
            <ClayCard className="mt-8 rounded-[2rem] p-6">
              <p className="text-sm font-semibold text-muted">
                Loading profile...
              </p>
            </ClayCard>
          )}

          {/* Load error */}
          {!loading && error && !profile && (
            <ClayCard className="mt-8 rounded-[2rem] p-6">
              <p className="text-sm font-bold text-red-600">
                {error}
              </p>
            </ClayCard>
          )}

          {!loading && profile && (
            <div className="mt-8 space-y-6">
              {/* Profile header */}
              <ClayCard className="rounded-[2rem] p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-butter text-3xl font-bold text-ink clay-sm">
                    {name?.charAt(0).toUpperCase() || "P"}
                  </div>

                  <div>
                    <h2 className="font-display text-2xl font-bold">
                      {name || "Parent"}
                    </h2>

                    <p className="mt-1 text-sm text-muted">
                      {email}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-mint px-3 py-1 text-xs font-bold text-ink">
                      Parent account
                    </span>
                  </div>
                </div>
              </ClayCard>

              {/* Account information */}
              <ClayCard className="rounded-[2rem] p-7">
                <SectionLabel>
                  ACCOUNT INFORMATION
                </SectionLabel>

                <div className="mt-6 grid gap-5">
                  {/* Name */}
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
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-ink/30 focus:bg-card"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-ink/30 focus:bg-card"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Account type */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Account type
                    </label>

                    <div className="rounded-2xl bg-soft px-4 py-3 text-sm font-bold capitalize text-muted">
                      {profile.role}
                    </div>
                  </div>
                </div>
              </ClayCard>

              {/* Password */}
              <ClayCard className="rounded-[2rem] p-7">
                <SectionLabel>SECURITY</SectionLabel>

                <div className="mt-6 grid gap-5">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-bold"
                    >
                      New password
                    </label>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-ink/30 focus:bg-card"
                      placeholder="Leave empty to keep current password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-bold"
                    >
                      Confirm new password
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-semibold text-ink outline-none transition focus:border-ink/30 focus:bg-card"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>
              </ClayCard>

              {/* Feedback */}
              {error && (
                <div className="rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-[1.5rem] bg-mint px-5 py-4 text-sm font-bold text-ink">
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-full bg-card px-6 py-3 text-sm font-bold text-ink clay-sm clay-press disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
