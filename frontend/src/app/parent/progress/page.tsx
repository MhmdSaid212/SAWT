"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ClayCard,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import {
  getParentChildAttempts,
  getParentSummary,
} from "@/lib/api";
import {
  getToken,
  removeToken,
} from "@/lib/auth";

type ParentSummary = {
  children_count: number;
  total_attempts: number;
  average_score: number;
  weekly_activity: {
    date: string;
    count: number;
  }[];
  children: {
    child_id: string;
    name: string;
    attempts: number;
    average_score: number;
    best_score: number;
  }[];
};

type ParentChildAttempt = {
  id: string;
  child_id: string;
  exercise_id: string;
  assignment_id?: string | null;

  exercise: {
    id: string;
    title?: string;
    target_word?: string;
  } | null;

  transcript: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  therapist_feedback: string | null;

  recording: {
    id: string;
    file_url: string;
    duration_seconds: number;
    created_at: string | null;
  } | null;

  ai_analysis: {
    id: string;
    target_phoneme_id: string | null;
    estimated_phoneme_id: string | null;
    confidence: number | null;
    pronunciation_score: number | null;
    details: string | null;
  }[];

  created_at: string | null;
};

type ExerciseSummary = {
  exerciseId: string;
  title: string;
  targetWord: string;
  attempts: ParentChildAttempt[];
  averageScore: number;
  bestScore: number;
  latestAttempt: ParentChildAttempt;
};

function formatDate(date: string | null) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExerciseName(
  attempt: ParentChildAttempt
) {
  return (
    attempt.exercise?.title ||
    attempt.exercise?.target_word ||
    "Practice exercise"
  );
}

function getTargetWord(
  attempt: ParentChildAttempt
) {
  return (
    attempt.exercise?.target_word ||
    attempt.exercise?.title ||
    "Practice"
  );
}

export default function ParentProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const childFromUrl = searchParams.get("child");

  const [parentSummary, setParentSummary] =
    useState<ParentSummary | null>(null);

  const [selectedChildId, setSelectedChildId] =
    useState<string>("all");

  const [attempts, setAttempts] = useState<
    ParentChildAttempt[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] =
    useState(false);
  const [error, setError] = useState("");

  /*
   * Load parent summary first.
   */
  useEffect(() => {
    async function loadSummary() {
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

        const summary = await getParentSummary(token);

        setParentSummary(summary);

        if (
          childFromUrl &&
          summary.children.some(
            (
              child: ParentSummary["children"][number]
            ) => child.child_id === childFromUrl
          )
        ) {
          setSelectedChildId(childFromUrl);
        } else if (summary.children.length === 1) {
          /*
           * If the parent only has one child,
           * show that child automatically.
           */
          setSelectedChildId(
            summary.children[0].child_id
          );
        } else {
          setSelectedChildId("all");
        }
      } catch (err) {
        console.error(err);

        setError(
          "We couldn't load your progress right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [router, childFromUrl]);

  /*
   * Load detailed attempts for the selected child.
   *
   * When "All Children" is selected, load attempts
   * for every child.
   */
  useEffect(() => {
    async function loadAttempts() {
      if (!parentSummary) return;

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      setAttemptsLoading(true);

      try {
        let allAttempts: ParentChildAttempt[] = [];

        if (selectedChildId === "all") {
          const responses = await Promise.all(
            parentSummary.children.map((child) =>
              getParentChildAttempts(
                child.child_id,
                token,
                1,
                20
              )
            )
          );

          allAttempts = responses.flatMap(
            (response) => response.attempts
          );
        } else {
          const response =
            await getParentChildAttempts(
              selectedChildId,
              token,
              1,
              20
            );

          allAttempts = response.attempts;
        }

        /*
         * Newest attempts first.
         */
        allAttempts.sort((a, b) => {
          const aTime = a.created_at
            ? new Date(a.created_at).getTime()
            : 0;

          const bTime = b.created_at
            ? new Date(b.created_at).getTime()
            : 0;

          return bTime - aTime;
        });

        setAttempts(allAttempts);
      } catch (err) {
        console.error(err);
        setAttempts([]);
      } finally {
        setAttemptsLoading(false);
      }
    }

    loadAttempts();
  }, [
    parentSummary,
    selectedChildId,
    router,
  ]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  /*
   * Currently selected child.
   */
  const selectedChild = useMemo(() => {
    if (
      !parentSummary ||
      selectedChildId === "all"
    ) {
      return null;
    }

    return (
      parentSummary.children.find(
        (child) =>
          child.child_id === selectedChildId
      ) ?? null
    );
  }, [
    parentSummary,
    selectedChildId,
  ]);

  /*
   * Group attempts by exercise.
   */
  const exerciseSummaries = useMemo(() => {
    const groups = new Map<
      string,
      ParentChildAttempt[]
    >();

    for (const attempt of attempts) {
      const existing =
        groups.get(attempt.exercise_id) ?? [];

      existing.push(attempt);

      groups.set(
        attempt.exercise_id,
        existing
      );
    }

    const summaries: ExerciseSummary[] = [];

    groups.forEach(
      (exerciseAttempts, exerciseId) => {
        /*
         * The attempts are already newest first,
         * so index 0 is the latest attempt.
         */
        const latestAttempt =
          exerciseAttempts[0];

        const scoredAttempts =
          exerciseAttempts.filter(
            (attempt) =>
              attempt.ai_score !== null
          );

        const scores = scoredAttempts.map(
          (attempt) =>
            attempt.ai_score ?? 0
        );

        const averageScore =
          scores.length > 0
            ? scores.reduce(
                (total, score) =>
                  total + score,
                0
              ) / scores.length
            : 0;

        const bestScore =
          scores.length > 0
            ? Math.max(...scores)
            : 0;

        summaries.push({
          exerciseId,
          title: getExerciseName(
            latestAttempt
          ),
          targetWord: getTargetWord(
            latestAttempt
          ),
          attempts: exerciseAttempts,
          averageScore,
          bestScore,
          latestAttempt,
        });
      }
    );

    summaries.sort((a, b) => {
      const aTime = a.latestAttempt.created_at
        ? new Date(
            a.latestAttempt.created_at
          ).getTime()
        : 0;

      const bTime = b.latestAttempt.created_at
        ? new Date(
            b.latestAttempt.created_at
          ).getTime()
        : 0;

      return bTime - aTime;
    });

    return summaries;
  }, [attempts]);

  /*
   * Overall numbers for the selected child.
   * For "all children", use the parent summary.
   */
  const totalAttempts =
    selectedChild?.attempts ??
    parentSummary?.total_attempts ??
    0;

  const averageScore =
    selectedChild?.average_score ??
    parentSummary?.average_score ??
    0;

  const bestScore =
    selectedChild?.best_score ??
    Math.max(
      ...(parentSummary?.children.map(
        (child) => child.best_score
      ) ?? [0])
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-card p-6 md:flex md:flex-col">
            <SawtLogo subtitle="Parent space" />

            <div className="mt-10 space-y-2">
              <div className="h-10 rounded-2xl bg-cream" />
              <div className="h-10 rounded-2xl bg-cream" />
              <div className="h-10 rounded-2xl bg-cream" />
              <div className="h-10 rounded-2xl bg-cream" />
              <div className="h-10 rounded-2xl bg-cream" />
            </div>
          </aside>

          <main className="flex-1 px-6 py-12">
            <p className="text-sm font-bold text-muted">
              Loading progress...
            </p>
          </main>
        </div>
      </div>
    );
  }

  if (error || !parentSummary) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-ink/10 bg-card p-6 md:flex md:flex-col">
            <SawtLogo subtitle="Parent space" />

            <nav className="mt-10 flex flex-col gap-2">
              <Link
                href="/parent"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Dashboard
              </Link>

              <Link
                href="/parent/children"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Children
              </Link>

              <Link
                href="/parent/progress"
                className="rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-cream"
              >
                Progress
              </Link>

              <Link
                href="/parent/activity"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Activity
              </Link>

              <Link
                href="/parent/profile"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Profile
              </Link>
            </nav>

            <button
              onClick={handleSignOut}
              className="mt-auto rounded-full bg-card px-5 py-3 text-sm font-bold clay-sm clay-press"
            >
              Sign out
            </button>
          </aside>

          <main className="flex-1 p-6 md:p-12">
            <ClayCard className="p-8">
              <h1 className="font-display text-3xl font-bold">
                Progress unavailable
              </h1>

              <p className="mt-3 text-sm text-muted">
                {error ||
                  "No progress data is available yet."}
              </p>
            </ClayCard>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
  {/* Top header */}
  <header className="border-b border-ink/10 bg-card">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
      <div className="shrink-0">
        <SawtLogo subtitle="Parent space" />
      </div>

      <div className="flex items-center gap-2">
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/parent"
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
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
            className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
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

        {/* Main */}
        <main className="min-w-0 flex-1 px-6 pb-20 pt-36 md:px-10 md:pt-12 lg:px-14">
          <div className="mx-auto max-w-6xl">
            {/* Heading */}
            <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  Parent Progress
                </p>

                <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                  {selectedChild
                    ? `${selectedChild.name}'s progress`
                    : "Your family's progress"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Review pronunciation practice by exercise
                  and open individual voice attempts for more
                  detail.
                </p>
              </div>

              <Link
                href="/parent/children"
                className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
              >
                Manage Children
              </Link>
            </section>

            {/* Child selector */}
            <section className="mt-8">
              <ClayCard className="rounded-[2rem] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <SectionLabel>
                      Viewing progress for
                    </SectionLabel>

                    <h2 className="mt-2 font-display text-2xl font-bold">
                      {selectedChild
                        ? selectedChild.name
                        : "All Children"}
                    </h2>
                  </div>

                  <select
                    value={selectedChildId}
                    onChange={(event) =>
                      setSelectedChildId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl bg-cream px-4 py-3 text-sm font-bold outline-none clay-sm lg:w-72"
                  >
                    {parentSummary.children.length > 1 && (
                      <option value="all">
                        All Children
                      </option>
                    )}

                    {parentSummary.children.map(
                      (
                        child: ParentSummary["children"][number]
                      ) => (
                        <option
                          key={child.child_id}
                          value={child.child_id}
                        >
                          {child.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </ClayCard>
            </section>

            {/* Stats */}
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <ClayCard>
                <p className="text-sm font-semibold text-muted">
                  Practice sessions
                </p>

                <p className="mt-3 font-display text-4xl font-bold">
                  {totalAttempts}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Completed analyzed attempts
                </p>
              </ClayCard>

              <ClayCard tone="butter">
                <p className="text-sm font-semibold text-ink/60">
                  Average accuracy
                </p>

                <p className="mt-3 font-display text-4xl font-bold">
                  {Math.round(averageScore)}%
                </p>

                <div className="mt-4">
                  <ProgressBar
                    value={averageScore}
                  />
                </div>
              </ClayCard>

              <ClayCard tone="accent2">
                <p className="text-sm font-semibold text-white/70">
                  Best score
                </p>

                <p className="mt-3 font-display text-4xl font-bold text-white">
                  {Math.round(bestScore)}%
                </p>

                <p className="mt-1 text-xs text-white/70">
                  Highest recorded pronunciation score
                </p>
              </ClayCard>
            </section>

            {/* Exercises */}
            <section className="mt-10">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <SectionLabel>
                    Exercises
                  </SectionLabel>

                  <h2 className="mt-2 font-display text-3xl font-bold">
                    {selectedChild
                      ? `${selectedChild.name}'s exercises`
                      : "Practice exercises"}
                  </h2>
                </div>

                <p className="text-xs font-semibold text-muted">
                  {exerciseSummaries.length}{" "}
                  {exerciseSummaries.length === 1
                    ? "exercise"
                    : "exercises"}
                </p>
              </div>

              {attemptsLoading ? (
                <ClayCard className="mt-5 p-8">
                  <p className="text-sm font-bold text-muted">
                    Loading exercise progress...
                  </p>
                </ClayCard>
              ) : exerciseSummaries.length === 0 ? (
                <ClayCard className="mt-5 rounded-[2rem] p-8">
                  <h3 className="font-display text-2xl font-bold">
                    No completed exercises yet
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                    Once your child completes analyzed
                    pronunciation practice, each exercise
                    will appear here with its own progress
                    summary.
                  </p>

                  <Link
                    href="/parent/children"
                    className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
                  >
                    View Children
                  </Link>
                </ClayCard>
              ) : (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {exerciseSummaries.map(
                    (exercise) => {
                      const latestScore =
                        exercise.latestAttempt
                          .ai_score ?? 0;

                      return (
                        <ClayCard
                          key={exercise.exerciseId}
                          className="rounded-[2rem] p-6"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                                Exercise
                              </p>

                              <h3 className="mt-2 font-display text-2xl font-bold">
                                {exercise.title}
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-muted">
                                Target:{" "}
                                {exercise.targetWord}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-black">
                              {exercise.attempts.length}{" "}
                              {exercise.attempts.length ===
                              1
                                ? "attempt"
                                : "attempts"}
                            </span>
                          </div>

                          <div className="mt-6">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">
                                Average score
                              </span>

                              <span className="text-lg font-black">
                                {Math.round(
                                  exercise.averageScore
                                )}
                                %
                              </span>
                            </div>

                            <div className="mt-2">
                              <ProgressBar
                                value={
                                  exercise.averageScore
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-cream p-4">
                              <p className="text-xs font-bold text-muted">
                                Best
                              </p>

                              <p className="mt-1 text-2xl font-black">
                                {Math.round(
                                  exercise.bestScore
                                )}
                                %
                              </p>
                            </div>

                            <div className="rounded-2xl bg-cream p-4">
                              <p className="text-xs font-bold text-muted">
                                Latest
                              </p>

                              <p className="mt-1 text-2xl font-black">
                                {Math.round(
                                  latestScore
                                )}
                                %
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-2xl bg-soft p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                                  Last practiced
                                </p>

                                <p className="mt-1 text-sm font-bold">
                                  {formatDate(
                                    exercise
                                      .latestAttempt
                                      .created_at
                                  )}
                                </p>
                              </div>

                              <Link
                                href={`/parent/progress/attempt/${exercise.latestAttempt.id}`}
                                className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-cream clay-sm clay-press"
                              >
                                View Attempt
                              </Link>
                            </div>
                          </div>
                        </ClayCard>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            {/* Practice note */}
            <section className="mt-10">
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

                <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/70">
                  Short, consistent practice sessions can
                  make home practice feel easier for children.
                  Celebrate the effort rather than focusing
                  only on getting every sound right.
                </p>

                <div className="mt-6 rounded-2xl bg-card/70 p-4">
                  <p className="text-sm font-bold">
                    Professional support matters.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted">
                    SAWT supports practice between sessions
                    with a speech therapist. It does not
                    replace professional speech therapy or
                    provide a medical diagnosis.
                  </p>
                </div>
              </ClayCard>
            </section>
          </div>
        </main>
      </div>
   
  );
}