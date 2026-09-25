"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClayCard, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken, removeToken } from "@/lib/auth";

type Therapist = {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  bio: string;
  verification_status: string;
};

export default function TherapistDashboard() {
  const router = useRouter();

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [childrenCount, setChildrenCount] = useState<number | null>(null);
  const [exercisesCount, setExercisesCount] = useState<number | null>(null);
  const [attemptsCount, setAttemptsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTherapist() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Verify the logged-in user's role
        const authResponse = await fetch(
          "http://127.0.0.1:8000/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!authResponse.ok) {
          throw new Error("Authentication failed");
        }

        const authData = await authResponse.json();
        const role = authData?.user?.role;

        if (role !== "therapist") {
          if (role === "admin") {
            router.replace("/admin");
          } else if (role === "parent") {
            router.replace("/parent");
          } else if (role === "child") {
            router.replace("/child");
          } else {
            removeToken();
            router.replace("/login");
          }

          return;
        }

        // Load therapist profile
        const therapistResponse = await fetch(
          "http://127.0.0.1:8000/therapists/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!therapistResponse.ok) {
          throw new Error("Unable to load therapist profile");
        }

        const therapistData = await therapistResponse.json();

        setTherapist(therapistData);


        const childrenResponse = await fetch(
  "http://127.0.0.1:8000/assignments/therapist/children",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!childrenResponse.ok) {
  throw new Error("Unable to load therapist children");
}

const childrenData = await childrenResponse.json();

setChildrenCount(childrenData.children?.length ?? 0);


const exercisesResponse = await fetch(
  "http://127.0.0.1:8000/exercises",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!exercisesResponse.ok) {
  throw new Error("Unable to load therapist exercises");
}

const exercisesData = await exercisesResponse.json();

setExercisesCount(exercisesData.exercises?.length ?? 0);

const progressResponse = await fetch(
  "http://127.0.0.1:8000/assignments/therapist/progress",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!progressResponse.ok) {
  throw new Error("Unable to load therapist progress");
}

const progressData = await progressResponse.json();

setAttemptsCount(progressData.attempts_count ?? 0);

      } catch (error) {
        console.error(error);
        setError("Unable to load therapist information.");
      } finally {
        setLoading(false);
      }
    }

    loadTherapist();

    
  }, [router]);


  
  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream font-body text-ink">
        <p className="text-sm font-semibold text-muted">
          Loading therapist dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-6 font-body text-ink">
        <div className="max-w-md rounded-3xl bg-card p-8 text-center clay">
          <p className="font-display text-2xl font-bold">
            Something went wrong
          </p>

          <p className="mt-3 text-sm text-muted">
            {error}
          </p>

          <button
            onClick={handleSignOut}
            className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream font-body text-ink">
      {/* Navbar */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <SawtLogo subtitle="Therapist space" />

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">
  <Link
    href="/therapist"
    className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
  >
    Dashboard
  </Link>

  <Link
    href="/therapist/children"
    className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
  >
    Children
  </Link>

  <Link
    href="/therapist/exercises"
    className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
  >
    Exercises
  </Link>

  <Link
    href="/therapist/phonemes"
    className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
  >
    Phonemes
  </Link>

  <Link
    href="/therapist/progress"
    className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
  >
    Progress
  </Link>
</nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
          Therapist Dashboard
        </p>

        <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
          Welcome back
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Monitor children&apos;s practice, manage exercises, and review
          pronunciation progress.
        </p>

        {/* Verification */}
        <div className="mt-8">
          <div
            className={`rounded-3xl p-6 clay ${
              therapist?.verification_status === "verified"
                ? "bg-mint"
                : "bg-butter"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.15em]">
              Account status
            </p>

            <p className="mt-2 font-display text-2xl font-bold">
              {therapist?.verification_status === "verified"
                ? "Verified Therapist"
                : "Verification Pending"}
            </p>

            <p className="mt-2 text-sm text-ink/70">
              {therapist?.verification_status === "verified"
                ? "Your therapist account has been verified by an administrator."
                : "Your account is waiting for administrator verification."}
            </p>
          </div>
        </div>

        {/* Profile */}
        <section className="mt-8">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>Profile</SectionLabel>

            <h2 className="mt-2 font-display text-2xl font-bold">
              Therapist information
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Specialization
                </p>

                <p className="mt-2 text-sm font-bold">
                  {therapist?.specialization || "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  License
                </p>

                <p className="mt-2 text-sm font-bold">
                  {therapist?.license_number || "Not provided"}
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Status
                </p>

                <p className="mt-2 text-sm font-bold capitalize">
                  {therapist?.verification_status || "Unknown"}
                </p>
              </div>
            </div>

            {therapist?.bio && (
              <div className="mt-4 rounded-2xl bg-soft p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Bio
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {therapist.bio}
                </p>
              </div>
            )}
          </ClayCard>
        </section>

        {/* Dashboard Cards */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <ClayCard>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
              Children
            </p>

            <p className="mt-3 font-display text-3xl font-bold">
              {childrenCount ?? "—"}
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              View children assigned to your care.
            </p>

            <Link
              href="/therapist/children"
              className="mt-5 inline-flex rounded-full bg-butter px-4 py-2 text-xs font-bold clay-sm clay-press"
            >
              View Children →
            </Link>
          </ClayCard>

          <ClayCard tone="mint">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink/60">
              Exercises
            </p>

            <p className="mt-3 font-display text-3xl font-bold">
              {exercisesCount ?? "—"}
            </p>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Create and customize pronunciation exercises.
            </p>

            <Link
              href="/therapist/exercises"
              className="mt-5 inline-flex rounded-full bg-card px-4 py-2 text-xs font-bold clay-sm clay-press"
            >
              Manage Exercises →
            </Link>
          </ClayCard>

          <ClayCard tone="accent2">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
              Progress
            </p>

            <p className="mt-3 font-display text-3xl font-bold text-white">
              {attemptsCount ?? "—"}
            </p>

            <p className="mt-2 text-sm leading-6 text-white/70">
              Review pronunciation performance and AI analysis.
            </p>

            <Link
              href="/therapist/progress"
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-ink clay-sm clay-press"
            >
              View Progress →
            </Link>
          </ClayCard>
        </section>

        {/* AI Notice */}
        <section className="mt-8">
          <div className="rounded-[2rem] bg-soft p-6 clay-sm">
            <p className="text-center text-xs leading-relaxed text-muted">
              AI pronunciation analysis will provide phoneme-level
              feedback from children&apos;s practice attempts. SAWT is
              designed to support professional speech therapy and does
              not replace a speech therapist.
            </p>
          </div>
        </section>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — Arabic + English speech practice companion.
          </p>
        </div>
      </footer>
    </main>
  );
}