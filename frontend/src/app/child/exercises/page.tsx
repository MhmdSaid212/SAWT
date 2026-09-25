"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClayCard } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken, removeToken } from "@/lib/auth";

type ChildProfile = {
  id: string;
  full_name: string;
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
  best_score: number;
  attempt_count: number;
  completed_at: string | null;
};

type Exercise = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  difficulty_level: string;
};

export default function ChildExercisesPage() {
  const router = useRouter();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exercises, setExercises] = useState<
    Record<string, Exercise>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercises() {
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
        const childProfile = childData.child;

        setChild(childProfile);

        if (!childProfile?.id) {
          return;
        }

        const assignmentsResponse = await fetch(
          `http://127.0.0.1:8000/assignments/child/${childProfile.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error("Failed to load assignments");
        }

        const assignmentData =
          await assignmentsResponse.json();

        const loadedAssignments: Assignment[] =
          assignmentData.assignments ?? [];

        // Keep ALL assignments visible.
        // Completed assignments should not disappear.
        setAssignments(loadedAssignments);

        const exerciseResults = await Promise.all(
          loadedAssignments.map(async (assignment) => {
            try {
              const response = await fetch(
                `http://127.0.0.1:8000/exercises/${assignment.exercise_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!response.ok) {
                return null;
              }

              const data = await response.json();

              return {
                id: assignment.exercise_id,
                exercise: data.exercise ?? data,
              };
            } catch {
              return null;
            }
          })
        );

        const exerciseMap: Record<string, Exercise> = {};

        exerciseResults.forEach((result) => {
          if (result?.exercise) {
            exerciseMap[result.id] = result.exercise;
          }
        });

        setExercises(exerciseMap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, [router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  function formatDueDate(date: string) {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatCompletedDate(date: string | null) {
    if (!date) {
      return null;
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "completed":
        return "Completed";

      case "in_progress":
        return "In Progress";

      case "overdue":
        return "Overdue";

      case "deassigned":
        return "Deassigned";

      case "assigned":
      default:
        return "Assigned";
    }
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "completed":
        return "bg-mint text-ink";

      case "in_progress":
        return "bg-butter text-ink";

      case "overdue":
        return "bg-red-100 text-red-700";

      case "deassigned":
        return "bg-gray-200 text-gray-600";

      case "assigned":
      default:
        return "bg-soft text-ink";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return "✓";

      case "in_progress":
        return "◐";

      case "overdue":
        return "!";

      case "deassigned":
        return "×";

      case "assigned":
      default:
        return "•";
    }
  }

  function getActionLabel(status: string) {
    switch (status) {
      case "completed":
        return "Practice again →";

      case "overdue":
        return "Practice again →";

      case "in_progress":
        return "Continue practice →";

      case "deassigned":
        return "View exercise →";

      case "assigned":
      default:
        return "Start practice →";
    }
  }

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
              href="/child"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Home
            </Link>

            <Link
              href="/child/exercises"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
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
        {/* Heading */}
        <section className="pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Practice exercises
          </p>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                {child
                  ? `${child.full_name}'s exercises`
                  : "Your exercises"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                These are the exercises assigned to you by your
                speech therapist. Keep practicing to improve your
                pronunciation.
              </p>
            </div>

            <div className="grid size-16 place-items-center rounded-2xl bg-butter text-3xl clay-sm">
              {child?.avatar_url || "🧒"}
            </div>
          </div>
        </section>

        {/* Exercises */}
        <section className="mt-10">
          {loading ? (
            <ClayCard className="rounded-[2rem] p-8">
              <p className="text-sm font-semibold text-muted">
                Loading your exercises...
              </p>
            </ClayCard>
          ) : assignments.length === 0 ? (
            <ClayCard className="rounded-[2rem] p-10 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-butter text-4xl clay-sm">
                🎯
              </div>

              <div className="mt-6 text-sm font-bold text-muted">
                You're all caught up
              </div>

              <h2 className="mt-2 font-display text-2xl font-bold">
                No exercises assigned yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                Your therapist will add exercises here when you're
                ready to practice.
              </p>

              <Link
                href="/child"
                className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream clay-sm clay-press"
              >
                Back home
              </Link>
            </ClayCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {assignments.map((assignment) => {
                const exercise =
                  exercises[assignment.exercise_id];

                const completedDate = formatCompletedDate(
                  assignment.completed_at
                );

                return (
                  <ClayCard
                    key={assignment.id}
                    className="rounded-[2rem] p-7"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-mint text-2xl clay-sm">
                        🗣️
                      </div>

                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                          assignment.status
                        )}`}
                      >
                        <span>
                          {getStatusIcon(assignment.status)}
                        </span>

                        {getStatusLabel(assignment.status)}
                      </span>
                    </div>

                    {/* Exercise */}
                    <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted">
                      Speech exercise
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-bold">
                      {exercise?.title ?? "Practice exercise"}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-muted">
                      {exercise?.description ??
                        "Practice your target sounds carefully and take your time."}
                    </p>

                    {/* Exercise metadata */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {exercise?.language && (
                        <span className="rounded-full bg-butter px-3 py-1 text-xs font-bold">
                          {exercise.language}
                        </span>
                      )}

                      {exercise?.difficulty_level && (
                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold capitalize">
                          {exercise.difficulty_level}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-cream p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Best score
                        </p>

                        <p className="mt-1 font-display text-2xl font-bold">
                          {Math.round(
                            assignment.best_score ?? 0
                          )}
                          %
                        </p>
                      </div>

                      <div className="rounded-2xl bg-cream p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Attempts
                        </p>

                        <p className="mt-1 font-display text-2xl font-bold">
                          {assignment.attempt_count ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Due date */}
                    <div
                      className={`mt-3 rounded-2xl p-4 ${
                        assignment.status === "overdue"
                          ? "bg-red-50"
                          : assignment.status === "completed"
                          ? "bg-mint/40"
                          : "bg-cream"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        Due date
                      </p>

                      <p
                        className={`mt-1 text-sm font-bold ${
                          assignment.status === "overdue"
                            ? "text-red-700"
                            : ""
                        }`}
                      >
                        {formatDueDate(assignment.due_date)}
                      </p>

                      {assignment.status === "overdue" && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          This exercise is past its due date. You can
                          still practice it.
                        </p>
                      )}

                      {assignment.status === "completed" &&
                        completedDate && (
                          <p className="mt-1 text-xs font-semibold text-muted">
                            Completed on {completedDate}
                          </p>
                        )}
                    </div>

                    {/* Action */}
                    <Link
                      href={`/child/exercises/${assignment.exercise_id}`}
                      className="mt-6 block rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
                    >
                      {getActionLabel(assignment.status)}
                    </Link>
                  </ClayCard>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
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