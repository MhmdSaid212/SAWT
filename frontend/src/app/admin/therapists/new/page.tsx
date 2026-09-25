"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

export default function NewTherapistPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/therapists/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            password,
            specialization,
            license_number: licenseNumber,
            bio: bio || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create therapist"
        );
      }

      router.push("/admin/therapists");
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
    <main className="min-h-screen bg-cream px-6 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Admin
            </p>

            <h1 className="mt-2 font-display text-4xl font-bold">
              Add Therapist
            </h1>

            <p className="mt-2 text-sm text-muted">
              Create a therapist account for SAWT.
            </p>
          </div>

          <Link
            href="/admin/therapists"
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Back
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-[2rem] bg-card p-8 clay"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold"
              >
                Full Name
              </label>

              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Dr. Sarah Smith"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
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
                placeholder="therapist@sawt.com"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                Temporary Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label
                htmlFor="specialization"
                className="mb-2 block text-sm font-bold"
              >
                Specialization
              </label>

              <input
                id="specialization"
                value={specialization}
                onChange={(event) =>
                  setSpecialization(event.target.value)
                }
                placeholder="Speech and Language Therapy"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label
                htmlFor="license"
                className="mb-2 block text-sm font-bold"
              >
                License Number
              </label>

              <input
                id="license"
                value={licenseNumber}
                onChange={(event) =>
                  setLicenseNumber(event.target.value)
                }
                placeholder="SLT-001"
                required
                className="w-full rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-bold"
              >
                Bio
              </label>

              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Short professional biography..."
                rows={4}
                className="w-full resize-none rounded-2xl bg-cream px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
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
              className="w-full rounded-full bg-brand px-5 py-3 font-bold text-white clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating therapist..." : "Create Therapist"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}