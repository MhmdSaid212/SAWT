"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ClayCard,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import {
  getChildren,
  getChildAssignments,
  getParentChildAttempts,
} from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type Child = {
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

type ChildAttempt = {
  id: string;
  child_id: string;
  exercise_id: string;
  assignment_id?: string | null;

  exercise?: {
    id: string;
    title?: string | null;
    target_word?: string | null;
  } | null;

  transcript?: string | null;
  ai_score?: number | null;
  ai_feedback?: string | null;
  therapist_feedback?: string | null;

  recording?: {
    id: string;
    file_url?: string | null;
    duration_seconds?: number | null;
    created_at?: string | null;
  } | null;

  ai_analysis?: unknown[];
  created_at?: string | null;
};

type ChildAttemptsResponse = {
  child: {
    id: string;
    name: string;
  };

  attempts: ChildAttempt[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAttemptScore(attempt: ChildAttempt) {
  return Number(attempt.ai_score ?? 0);
}

function getAttemptFeedback(attempt: ChildAttempt) {
  return (
    attempt.therapist_feedback ||
    attempt.ai_feedback ||
    null
  );
}

export default function ParentDashboard() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] =
    useState<string | null>(null);

  const [assignments, setAssignments] = useState<
    Assignment[]
  >([]);

  const [attempts, setAttempts] = useState<
    ChildAttempt[]
  >([]);

  const [loadingChildren, setLoadingChildren] =
    useState(true);

  const [loadingChildData, setLoadingChildData] =
    useState(false);

  const [childrenError, setChildrenError] =
    useState("");

  const selectedChild = useMemo(
    () =>
      children.find(
        (child) => child.id === selectedChildId
      ) ?? null,
    [children, selectedChildId]
  );

  /*
   * Load parent + children.
   *
   * We intentionally do NOT use the old parent-wide summary
   * here because the dashboard should represent the selected
   * child only.
   */
  useEffect(() => {
    async function loadChildren() {
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

        if (role !== "parent") {
          if (role === "admin") {
            router.replace("/admin");
          } else if (role === "therapist") {
            router.replace("/therapist");
          } else if (role === "child") {
            router.replace("/child");
          } else {
            removeToken();
            router.replace("/login");
          }

          return;
        }

        const data = await getChildren(token);

        const loadedChildren: Child[] =
          data.children ?? [];

        setChildren(loadedChildren);

        if (loadedChildren.length > 0) {
          setSelectedChildId(
            loadedChildren[0].id
          );
        }
      } catch (error) {
        console.error(error);

        setChildrenError(
          "We couldn't load your children right now."
        );
      } finally {
        setLoadingChildren(false);
      }
    }

    loadChildren();
  }, [router]);

  /*
   * Load EVERYTHING that belongs to the selected child.
   *
   * This effect runs every time the dropdown changes.
   */
  useEffect(() => {
    async function loadSelectedChildData() {
      if (!selectedChildId) {
        setAssignments([]);
        setAttempts([]);
        return;
      }

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      setLoadingChildData(true);

      try {
        const [
          assignmentsResponse,
          attemptsResponse,
        ] = await Promise.all([
          getChildAssignments(
            selectedChildId,
            token
          ),
          getParentChildAttempts(
            selectedChildId,
            token,
            1,
            20
          ),
        ]);

        setAssignments(
          assignmentsResponse.assignments ?? []
        );

        const childAttemptsResponse =
          attemptsResponse as ChildAttemptsResponse;

        setAttempts(
          childAttemptsResponse.attempts ?? []
        );
      } catch (error) {
        console.error(error);

        setAssignments([]);
        setAttempts([]);
      } finally {
        setLoadingChildData(false);
      }
    }

    loadSelectedChildData();
  }, [selectedChildId, router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  /*
   * Only active assignments belonging to the selected child.
   */
  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "completed" &&
      assignment.status !== "deassigned" &&
      assignment.status !== "cancelled"
  );

  /*
   * Selected child's attempt count.
   */
  const practiceSessions = attempts.length;

  /*
   * Selected child's average accuracy.
   */
  const averageScore =
    attempts.length > 0
      ? attempts.reduce(
          (total, attempt) =>
            total + getAttemptScore(attempt),
          0
        ) / attempts.length
      : 0;

  /*
   * Selected child's best score.
   */
  const bestScore =
    attempts.length > 0
      ? Math.max(
          ...attempts.map(getAttemptScore)
        )
      : 0;

  /*
   * Build the selected child's activity for the
   * last 7 calendar days.
   */
  const weeklyActivity = useMemo(() => {
    const days: {
      date: string;
      count: number;
    }[] = [];

    const today = new Date();

    for (let index = 6; index >= 0; index--) {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(
        today.getDate() - index
      );

      const dateKey =
        date.toISOString().split("T")[0];

      const count = attempts.filter(
        (attempt) => {
          if (!attempt.created_at) {
            return false;
          }

          const attemptDate = new Date(
            attempt.created_at
          );

          const attemptKey =
            attemptDate.toISOString().split("T")[0];

          return attemptKey === dateKey;
        }
      ).length;

      days.push({
        date: dateKey,
        count,
      });
    }

    return days;
  }, [attempts]);

  const maxWeeklyCount = Math.max(
    ...weeklyActivity.map(
      (day) => day.count
    ),
    1
  );

  /*
   * Most recent attempts for the selected child.
   */
  const recentAttempts = useMemo(() => {
    return [...attempts]
      .sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [attempts]);

  /*
   * Only analyzed attempts.
   */
  const pronunciationResults =
    recentAttempts.filter(
      (attempt) =>
        attempt.ai_score !== null &&
        attempt.ai_score !== undefined
    );

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
              <Link
                href="/parent"
                className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
              >
                Dashboard
              </Link>

              <Link
                href="/parent/children"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Children
              </Link>

              <Link
                href="/parent/progress"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Progress
              </Link>

              <Link
                href="/parent/activity"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Activity
              </Link>

              <Link
                href="/parent/profile"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Profile
              </Link>
            </nav>

            <button
              onClick={handleSignOut}
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 px-6 pb-20 pt-10 md:px-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>
                PARENT DASHBOARD
              </SectionLabel>

              <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                {selectedChild
                  ? `${selectedChild.full_name}'s week`
                  : "Your family's practice"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Keep an eye on practice, celebrate
                progress, and support your child between
                therapy sessions.
              </p>
            </div>

            {children.length > 0 && (
              <div className="w-full lg:w-64">
                <label
                  htmlFor="child"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-muted"
                >
                  Current child
                </label>

                <select
                  id="child"
                  value={selectedChildId ?? ""}
                  onChange={(event) =>
                    setSelectedChildId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-ink/10 bg-card px-4 py-3 text-sm font-bold text-ink outline-none transition focus:border-ink/30 clay-sm"
                >
                  {children.map((child) => (
                    <option
                      key={child.id}
                      value={child.id}
                    >
                      {child.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {childrenError && (
            <div className="mt-8 rounded-[1.5rem] bg-soft p-4 text-sm font-semibold text-brand">
              {childrenError}
            </div>
          )}

          {/* Loading selected child */}
          {loadingChildData && (
            <div className="mt-8 rounded-[1.5rem] bg-soft p-4 text-sm font-semibold text-muted">
              Loading {selectedChild?.full_name ?? "child"}'s
              dashboard...
            </div>
          )}

          {/* Stats */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ClayCard className="rounded-[2rem] p-6">
              <p className="text-sm font-semibold text-muted">
                Practice sessions
              </p>

              <p className="mt-3 font-display text-4xl font-bold">
                {loadingChildData
                  ? "…"
                  : practiceSessions}
              </p>

              <p className="mt-1 text-xs text-muted">
                Recorded attempts
              </p>
            </ClayCard>

            <ClayCard
              tone="butter"
              className="rounded-[2rem] p-6"
            >
              <p className="text-sm font-semibold text-muted">
                Average accuracy
              </p>

              <p className="mt-3 font-display text-4xl font-bold">
                {loadingChildData
                  ? "…"
                  : attempts.length > 0
                  ? `${Math.round(averageScore)}%`
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-muted">
                This child's analyzed attempts
              </p>
            </ClayCard>

            <ClayCard
              tone="accent2"
              className="rounded-[2rem] p-6"
            >
              <p className="text-sm font-semibold text-white/70">
                Assigned exercises
              </p>

              <p className="mt-3 font-display text-4xl font-bold text-white">
                {loadingChildData
                  ? "…"
                  : activeAssignments.length}
              </p>

              <p className="mt-1 text-xs text-white/70">
                Current assignments
              </p>
            </ClayCard>

            <ClayCard
              tone="mint"
              className="rounded-[2rem] p-6"
            >
              <p className="text-sm font-semibold text-muted">
                Best accuracy
              </p>

              <p className="mt-3 font-display text-4xl font-bold">
                {loadingChildData
                  ? "…"
                  : attempts.length > 0
                  ? `${Math.round(bestScore)}%`
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-muted">
                Highest analyzed score
              </p>
            </ClayCard>
          </section>

          {/* Weekly Activity + Pronunciation */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <ClayCard className="rounded-[2rem] p-7">
              <SectionLabel>
                Weekly activity
              </SectionLabel>

              <h2 className="mt-2 font-display text-2xl font-bold">
                Practice this week
              </h2>

              {weeklyActivity.every(
                (day) => day.count === 0
              ) ? (
                <div className="mt-6 rounded-[1.5rem] bg-soft p-5 text-sm font-semibold text-muted">
                  {selectedChild
                    ? `${selectedChild.full_name} has no practice activity this week yet.`
                    : "No practice activity yet."}
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-7 items-end gap-3">
                  {weeklyActivity.map((day) => {
                    const date = new Date(
                      `${day.date}T00:00:00`
                    );

                    const label =
                      date.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                        }
                      );

                    const height =
                      day.count === 0
                        ? 8
                        : Math.max(
                            16,
                            (day.count /
                              maxWeeklyCount) *
                              100
                          );

                    return (
                      <div
                        key={day.date}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="text-xs font-bold text-ink">
                          {day.count}
                        </div>

                        <div className="flex h-24 w-full items-end justify-center">
                          <div
                            className="w-7 rounded-t-xl bg-accent2 transition-all"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <div className="text-xs font-semibold text-muted">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ClayCard>

            <ClayCard className="rounded-[2rem] p-7">
              <SectionLabel tone="mint">
                Pronunciation
              </SectionLabel>

              <h2 className="mt-2 font-display text-2xl font-bold">
                Recent pronunciation
              </h2>

              <div className="mt-7 space-y-3">
                {pronunciationResults.length === 0 ? (
                  <div className="rounded-2xl bg-cream p-5">
                    <p className="text-sm font-semibold">
                      No pronunciation results yet.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-muted">
                      Results for{" "}
                      {selectedChild?.full_name ??
                        "this child"}{" "}
                      will appear here after analyzed
                      practice.
                    </p>
                  </div>
                ) : (
                  pronunciationResults.map(
                    (attempt) => {
                      const feedback =
                        getAttemptFeedback(
                          attempt
                        );

                      return (
                        <div
                          key={attempt.id}
                          className="rounded-2xl bg-cream p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-ink">
                                {attempt.exercise
                                  ?.title ||
                                  attempt.exercise
                                    ?.target_word ||
                                  "Practice attempt"}
                              </p>

                              {attempt.exercise
                                ?.target_word && (
                                <p className="mt-1 text-xs font-semibold text-muted">
                                  Target:{" "}
                                  {
                                    attempt.exercise
                                      .target_word
                                  }
                                </p>
                              )}

                              {attempt.created_at && (
                                <p className="mt-1 text-[11px] text-muted">
                                  {formatDateTime(
                                    attempt.created_at
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="ml-3 shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-bold text-ink">
                              {Math.round(
                                getAttemptScore(
                                  attempt
                                )
                              )}
                              %
                            </div>
                          </div>

                          {feedback && (
                            <p className="mt-3 text-xs leading-5 text-muted">
                              {feedback}
                            </p>
                          )}
                        </div>
                      );
                    }
                  )
                )}
              </div>

              <p className="mt-5 text-xs leading-5 text-muted">
                Pronunciation scores are generated from
                practice attempts and are intended to
                support, not replace, professional speech
                therapy.
              </p>
            </ClayCard>
          </section>

          {/* Practice Tip */}
          <section className="mt-8">
            <ClayCard
              tone="butter"
              className="rounded-[2rem] p-7"
            >
              <SectionLabel>
                Practice tip
              </SectionLabel>

              <h2 className="mt-2 font-display text-2xl font-bold">
                Keep practice short and positive.
              </h2>

              <p className="mt-4 text-sm leading-6 text-muted">
                Short, consistent practice sessions can
                make home practice feel easier for
                children. Celebrate the effort rather
                than focusing only on getting every sound
                right.
              </p>

              <div className="mt-7 rounded-2xl bg-card/70 p-4">
                <p className="text-sm font-bold">
                  Professional support matters.
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  SAWT is designed to support practice
                  between sessions with a speech therapist.
                </p>
              </div>
            </ClayCard>
          </section>

          {/* Empty Children State */}
          {!loadingChildren &&
            children.length === 0 && (
              <section className="mt-8">
                <ClayCard className="rounded-[2rem] p-8 text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-butter text-3xl">
                    🧒
                  </div>

                  <h2 className="mt-5 font-display text-2xl font-bold">
                    Add your first child
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                    Create a child account to start
                    assigning exercises and tracking
                    speech practice.
                  </p>

                  <Link
                    href="/parent/children"
                    className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press"
                  >
                    + Add a child
                  </Link>
                </ClayCard>
              </section>
            )}

          {/* Disclaimer */}
          <section className="mt-10">
            <div className="rounded-[2rem] bg-soft p-6 clay-sm">
              <p className="text-center text-xs leading-relaxed text-muted">
                SAWT supports professional speech therapy.
                It does not replace a speech therapist or
                provide a medical diagnosis.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — English speech practice companion.
          </p>
        </div>
      </footer>
    </div>
  );
}

