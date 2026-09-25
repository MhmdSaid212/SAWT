"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

type Therapist = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  specialization: string;
  license_number: string;
  bio: string | null;
  verification_status: string;
};

export default function EditTherapistPage() {
  const params = useParams();
  const router = useRouter();

  const therapistId = params.id as string;

  const [therapist, setTherapist] = useState<Therapist | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTherapist() {
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load therapist"
          );
        }

        const foundTherapist = data.therapists.find(
          (item: Therapist) => item.id === therapistId
        );

        if (!foundTherapist) {
          throw new Error("Therapist not found");
        }

        setTherapist(foundTherapist);

        setName(foundTherapist.name || "");
        setEmail(foundTherapist.email || "");
        setSpecialization(foundTherapist.specialization);
        setLicenseNumber(foundTherapist.license_number);
        setBio(foundTherapist.bio || "");
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load therapist"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTherapist();
  }, [therapistId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    setSaving(true);
    setError("");

    const updateData: {
      name: string;
      email: string;
      specialization: string;
      license_number: string;
      bio: string | null;
      password?: string;
    } = {
      name,
      email,
      specialization,
      license_number: licenseNumber,
      bio: bio || null,
    };

    if (password.trim()) {
      updateData.password = password;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/therapists/${therapistId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update therapist"
        );
      }

      router.push("/admin/therapists");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update therapist"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10 text-ink">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-card p-8 clay">
            <p className="text-sm text-muted">
              Loading therapist...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !therapist) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10 text-ink">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-card p-8 clay">
            <p className="text-sm font-semibold text-brand">
              {error}
            </p>

            <Link
              href="/admin/therapists"
              className="mt-5 inline-flex rounded-full bg-soft px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Back to therapists
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Admin
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold">
            Edit Therapist
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted">
            Update the therapist account and professional information.
          </p>
        </div>

        <div className="rounded-3xl bg-card p-7 clay">
          {error && (
            <div className="mb-6 rounded-2xl bg-soft p-4">
              <p className="text-sm font-semibold text-brand">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-bold"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Email */}
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
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={6}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
              />

              <p className="mt-2 text-xs text-muted">
                Only enter a password if you want to change it.
              </p>
            </div>

            {/* Specialization */}
            <div>
              <label
                htmlFor="specialization"
                className="mb-2 block text-sm font-bold"
              >
                Specialization
              </label>

              <input
                id="specialization"
                type="text"
                value={specialization}
                onChange={(event) =>
                  setSpecialization(event.target.value)
                }
                required
                className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* License */}
            <div>
              <label
                htmlFor="licenseNumber"
                className="mb-2 block text-sm font-bold"
              >
                License Number
              </label>

              <input
                id="licenseNumber"
                type="text"
                value={licenseNumber}
                onChange={(event) =>
                  setLicenseNumber(event.target.value)
                }
                required
                className="w-full rounded-2xl bg-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Bio */}
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
                onChange={(event) =>
                  setBio(event.target.value)
                }
                rows={5}
                className="w-full resize-none rounded-2xl bg-soft px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/admin/therapists"
                className="rounded-full bg-soft px-6 py-3 text-sm font-bold clay-sm clay-press"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}