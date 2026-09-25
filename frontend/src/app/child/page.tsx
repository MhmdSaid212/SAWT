"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClayCard,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken, removeToken } from "@/lib/auth";

type ChildProfile = {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  language_preference: string;
  avatar_url: string | null;
};

type Assignment = {
  id: string;
  child_id: string;
  exercise_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string;
  status: string;
};

type ProgressData = {
  total_attempts: number;
  average_score: number;
  attempts: {
    id: string;
    exercise_id?: string;
    assignment_id?: string;
    score?: number | null;
    feedback?: string | null;
    created_at?: string;
  }[];
};

export default function ChildDashboard() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status !== "completed" &&
          assignment.status !== "cancelled"
      ),
    [assignments]
  );

  useEffect(() => {
    async function loadDashboard() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
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

        if (role !== "child") {
          if (role === "parent") {
            router.replace("/parent");
          } else if (role === "therapist") {
            router.replace("/therapist");
          } else if (role === "admin") {
            router.replace("/admin");
          } else {
            removeToken();
            router.replace("/login");
          }

          return;
        }

        const childResponse = await fetch(
          "http://127.0.0.1:8000/children/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!childResponse.ok) {
          throw new Error("Failed to load child profile");
        }

        const childData = await childResponse.json();

        const childProfile =
          childData.child ?? childData;

        setChild(childProfile);

        if (childProfile?.id) {
          // Load assignments
          const assignmentsResponse = await fetch(
            `http://127.0.0.1:8000/assignments/child/${childProfile.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (assignmentsResponse.ok) {
            const assignmentData =
              await assignmentsResponse.json();

            setAssignments(
              assignmentData.assignments ?? []
            );
          }

          // Load real pronunciation progress
          const progressResponse = await fetch(
            `http://127.0.0.1:8000/attempts/child/${childProfile.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (progressResponse.ok) {
            const progressData =
              await progressResponse.json();

            setProgress(progressData);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <SawtLogo subtitle="Practice space" />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-20">
          <ClayCard className="rounded-[2rem] p-8">
            <p className="text-sm font-semibold text-muted">
              Loading your practice space...
            </p>
          </ClayCard>
        </main>
      </div>
    );
  }

  const attemptsCount = progress?.total_attempts ?? 0;
  const averageScore = progress?.average_score ?? 0;

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* Header */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Practice space" />
          </div>

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">

            <Link
              href="/child/exercises"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Exercises
            </Link>

            <Link
              href="/child/progress"
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

      <main className="mx-auto max-w-7xl px-6 pb-20">
        {/* Welcome */}
        <section className="pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Your practice space
          </p>

          <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                Hi{child?.full_name ? `, ${child.full_name}` : ""}! 👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Let's practice your sounds and keep getting better,
                one exercise at a time.
              </p>
            </div>

            <div className="grid size-20 place-items-center rounded-[1.75rem] bg-butter text-4xl clay-sm">
              {child?.avatar_url || "🧒"}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ClayCard>
            <p className="text-sm font-semibold text-muted">
              Exercises to practice
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              {activeAssignments.length}
            </p>

            <p className="mt-1 text-xs text-muted">
              Assigned by your therapist
            </p>
          </ClayCard>

          <ClayCard tone="butter">
            <p className="text-sm font-semibold text-ink/60">
              Practice sessions
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              {attemptsCount}
            </p>

            <p className="mt-1 text-xs text-ink/60">
              Times you've practiced
            </p>
          </ClayCard>

          <ClayCard tone="mint">
            <p className="text-sm font-semibold text-ink/60">
              Average accuracy
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              {attemptsCount > 0
                ? `${Math.round(averageScore)}%`
                : "—"}
            </p>

            <p className="mt-1 text-xs text-ink/60">
              Based on your pronunciation results
            </p>
          </ClayCard>
        </section>

        {/* Main Practice Area */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ClayCard className="rounded-[2rem] p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionLabel>Ready to practice?</SectionLabel>

                <h2 className="mt-2 font-display text-2xl font-bold">
                  Your exercises
                </h2>
              </div>

              <Link
                href="/child/exercises"
                className="text-sm font-bold text-brand"
              >
                See all →
              </Link>
            </div>

            <div className="mt-6">
              {activeAssignments.length === 0 ? (
                <div className="rounded-2xl bg-cream p-6">
                  <div className="text-4xl">🎯</div>

                  <p className="mt-4 font-display text-xl font-bold">
                    No exercises yet
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Your therapist will assign exercises for you
                    to practice here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeAssignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-2xl bg-cream p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            Practice exercise
                          </p>

                          <h3 className="mt-1 font-display text-xl font-bold">
                            Ready for your next exercise?
                          </h3>

                          <p className="mt-1 text-xs text-muted">
                            Due{" "}
                            {new Date(
                              assignment.due_date
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>

                        <Link
                          href={`/child/exercises/${assignment.exercise_id}`}
                          className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
                        >
                          Practice
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ClayCard>

          <ClayCard tone="accent2" className="rounded-[2rem] p-7">
            <SectionLabel>Keep going</SectionLabel>

            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Every practice counts.
            </h2>

            <p className="mt-4 text-sm leading-6 text-white/70">
              Take your time, listen carefully, and try each sound
              the best you can.
            </p>

            <div className="mt-7 rounded-2xl bg-white/10 p-5">
              <p className="text-sm font-bold text-white">
                Practice tip 💡
              </p>

              <p className="mt-2 text-xs leading-5 text-white/70">
                Short and focused practice is better than trying
                to do everything at once.
              </p>
            </div>
          </ClayCard>
        </section>

        {/* Real Progress */}
        <section className="mt-8">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel tone="mint">
              Your progress
            </SectionLabel>

            <h2 className="mt-2 font-display text-2xl font-bold">
              Keep building your skills
            </h2>

            <div className="mt-7">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold">
                  Average pronunciation accuracy
                </span>

                <span className="font-bold text-brand">
                  {attemptsCount > 0
                    ? `${Math.round(averageScore)}%`
                    : "No results yet"}
                </span>
              </div>

              <ProgressBar
                value={averageScore}
                tone="brand"
                label="Average pronunciation accuracy"
                className="h-3"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-muted">
              <span>
                {attemptsCount} completed practice{" "}
                {attemptsCount === 1 ? "session" : "sessions"}
              </span>

              <span>•</span>

              <span>
                {attemptsCount > 0
                  ? "SAWT has analyzed your pronunciation"
                  : "Complete an exercise to start tracking progress"}
              </span>
            </div>
          </ClayCard>
        </section>

        {/* Encouragement */}
        <section className="mt-8">
          <ClayCard tone="butter" className="rounded-[2rem] p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Remember
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold">
                  You don't have to be perfect.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                  The goal is to practice, learn, and improve little
                  by little. 🌟
                </p>
              </div>

              <div className="text-5xl">🗣️</div>
            </div>
          </ClayCard>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — Arabic + English speech practice companion.
          </p>

          <Link
            href="/child"
            className="text-sm font-bold text-brand"
          >
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

