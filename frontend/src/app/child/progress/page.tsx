"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ClayCard,
  Pill,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import {
  removeToken,
  getParentToken,
  restoreParentSession,
} from "@/lib/auth";

type Attempt = {
  id: string;
  exercise_id?: string;
  assignment_id?: string;
  score?: number | null;
  feedback?: string | null;
  ai_feedback?: string | null;
  therapist_feedback?: string | null;
  therapist_feedback_updated_at?: string | null;
  transcript?: string | null;
  recording?: {
    file_url?: string;
    duration_seconds?: number;
  } | null;
  created_at?: string;
};

type ProgressData = {
  total_attempts: number;
  average_score: number;
  attempts: Attempt[];
};

type Exercise = {
  id: string;
  title: string;
  description?: string;
  target_word?: string;
  language?: string;
  difficulty_level?: string;
};

const ATTEMPTS_PER_PAGE = 3;

export default function ChildProgressPage() {
  const router = useRouter();

  const [progress, setProgress] =
    useState<ProgressData | null>(null);

  const [exercises, setExercises] =
    useState<Exercise[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Each exercise has its own page.
   *
   * Example:
   *
   * {
   *   "exercise-id-1": 1,
   *   "exercise-id-2": 2
   * }
   */
  const [exercisePages, setExercisePages] =
    useState<Record<string, number>>({});

  function handleBackToParent() {
    const restored = restoreParentSession();

    if (restored) {
      router.push("/parent/children");
      return;
    }

    removeToken();
    router.push("/login");
  }

  function getExerciseTitle(exerciseId?: string) {
    if (!exerciseId) {
      return "Practice Exercise";
    }

    const exercise = exercises.find(
      (item) => item.id === exerciseId
    );

    return exercise?.title || "Practice Exercise";
  }

  function getExerciseDetails(exerciseId?: string) {
    if (!exerciseId) {
      return null;
    }

    return exercises.find(
      (item) => item.id === exerciseId
    );
  }

  function getExerciseAttempts(exerciseId: string) {
    return (
      progress?.attempts
        ?.filter(
          (attempt) =>
            attempt.exercise_id === exerciseId
        )
        .sort((a, b) => {
          const dateA = a.created_at
            ? new Date(a.created_at).getTime()
            : 0;

          const dateB = b.created_at
            ? new Date(b.created_at).getTime()
            : 0;

          return dateB - dateA;
        }) ?? []
    );
  }

  function getExercisePage(exerciseId: string) {
    return exercisePages[exerciseId] ?? 1;
  }

  function setExercisePage(
    exerciseId: string,
    page: number
  ) {
    setExercisePages((current) => ({
      ...current,
      [exerciseId]: page,
    }));
  }

  /*
   * Group exercises based on the attempts returned
   * by the backend.
   *
   * Exercises are kept in their most recent activity order.
   */
  const exerciseIds = useMemo(() => {
    if (!progress?.attempts) {
      return [];
    }

    const seen = new Set<string>();
    const ids: string[] = [];

    const sortedAttempts = [...progress.attempts].sort(
      (a, b) => {
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return dateB - dateA;
      }
    );

    for (const attempt of sortedAttempts) {
      if (
        attempt.exercise_id &&
        !seen.has(attempt.exercise_id)
      ) {
        seen.add(attempt.exercise_id);
        ids.push(attempt.exercise_id);
      }
    }

    return ids;
  }, [progress]);

  /*
   * Attempts that don't have an exercise ID.
   *
   * We keep these separate instead of losing them.
   */
  const unassignedAttempts = useMemo(() => {
    if (!progress?.attempts) {
      return [];
    }

    return progress.attempts
      .filter((attempt) => !attempt.exercise_id)
      .sort((a, b) => {
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return dateB - dateA;
      });
  }, [progress]);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("sawt_token");

        if (!token) {
          router.replace("/login");
          return;
        }

        /*
         * Verify the child session.
         */
        const childResponse = await fetch(
          "http://127.0.0.1:8000/children/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!childResponse.ok) {
          throw new Error(
            "Unable to load child profile."
          );
        }

        const childData =
          await childResponse.json();

        const childId = childData.child?.id;

        if (!childId) {
          throw new Error(
            "Child profile ID not found."
          );
        }

        /*
         * Load exercises.
         *
         * This lets us show exercise titles instead
         * of only exercise IDs.
         */
        const exercisesResponse = await fetch(
          "http://127.0.0.1:8000/exercises/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (exercisesResponse.ok) {
          const exercisesData =
            await exercisesResponse.json();

          setExercises(
            exercisesData.exercises ?? []
          );
        }

        /*
         * Load child attempts.
         */
        const progressResponse = await fetch(
          `http://127.0.0.1:8000/attempts/child/${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!progressResponse.ok) {
          const data =
            await progressResponse
              .json()
              .catch(() => null);

          throw new Error(
            data?.detail ||
              "Unable to load practice progress."
          );
        }

        const progressData =
          await progressResponse.json();

        setProgress(progressData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your progress."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [router]);

  const latestAttempt =
    progress?.attempts?.[0];

  return (
    <main className="min-h-screen bg-cream font-body text-ink">
      {/* NAVBAR */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Keep practicing!" />
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/child"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Home
              </Link>

              <Link
                href="/child/exercises"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
              >
                Exercises
              </Link>

              <Link
                href="/child/progress"
                className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
              >
                Progress
              </Link>
            </nav>

            <button
              type="button"
              onClick={handleBackToParent}
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Back to Parent
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10 md:px-10 lg:px-14">
        {/* HEADER */}
        <section>
          <Pill>Your progress</Pill>

          <h1 className="mt-4 font-display text-4xl font-bold text-ink md:text-5xl">
            Keep up the great work! 🌟
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Every practice session helps you get better
            at your target words.
          </p>
        </section>

        {/* LOADING */}
        {loading && (
          <ClayCard className="mt-8 rounded-[2rem] p-6">
            <p className="text-sm font-semibold text-muted">
              Loading your progress...
            </p>
          </ClayCard>
        )}

        {/* ERROR */}
        {error && !loading && (
          <ClayCard className="mt-8 rounded-[2rem] p-6">
            <p className="font-bold text-ink">
              We couldn't load your progress.
            </p>

            <p className="mt-2 text-sm text-muted">
              {error}
            </p>
          </ClayCard>
        )}

        {/* CONTENT */}
        {progress && !loading && !error && (
          <>
            {/* SUMMARY */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <ClayCard className="rounded-[2rem] p-6">
                <SectionLabel>
                  Practice sessions
                </SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {progress.total_attempts}
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Completed pronunciation practices.
                </p>
              </ClayCard>

              <ClayCard
                tone="butter"
                className="rounded-[2rem] p-6"
              >
                <SectionLabel>
                  Average accuracy
                </SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {Math.round(
                    progress.average_score
                  )}
                  %
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your overall practice accuracy.
                </p>
              </ClayCard>

              <ClayCard
                tone="accent2"
                className="rounded-[2rem] p-6"
              >
                <SectionLabel>
                  Latest score
                </SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {latestAttempt?.score != null
                    ? `${Math.round(
                        latestAttempt.score
                      )}%`
                    : "—"}
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your most recent pronunciation result.
                </p>
              </ClayCard>
            </div>

            {/* EXERCISE HISTORY */}
            <section className="mt-8">
              <div>
                <SectionLabel>
                  Practice history
                </SectionLabel>

                <h2 className="mt-3 font-display text-3xl font-bold text-ink">
                  Your exercises
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Listen to your recordings and review
                  the feedback from your therapist for
                  each exercise.
                </p>
              </div>

              {exerciseIds.length === 0 &&
              unassignedAttempts.length === 0 ? (
                <ClayCard className="mt-6 rounded-[2rem] p-6">
                  <h3 className="font-display text-2xl font-bold text-ink">
                    No practice sessions yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Complete an exercise and your
                    practice history will appear here.
                  </p>
                </ClayCard>
              ) : (
                <div className="mt-6 space-y-8">
                  {/* EACH EXERCISE */}
                  {exerciseIds.map((exerciseId) => {
                    const exercise =
                      getExerciseDetails(
                        exerciseId
                      );

                    const exerciseAttempts =
                      getExerciseAttempts(
                        exerciseId
                      );

                    const currentPage =
                      getExercisePage(
                        exerciseId
                      );

                    const totalPages =
                      Math.max(
                        1,
                        Math.ceil(
                          exerciseAttempts.length /
                            ATTEMPTS_PER_PAGE
                        )
                      );

                    const startIndex =
                      (currentPage - 1) *
                      ATTEMPTS_PER_PAGE;

                    const visibleAttempts =
                      exerciseAttempts.slice(
                        startIndex,
                        startIndex +
                          ATTEMPTS_PER_PAGE
                      );

                    const averageExerciseScore =
                      exerciseAttempts.length > 0
                        ? exerciseAttempts.reduce(
                            (sum, attempt) =>
                              sum +
                              (attempt.score ?? 0),
                            0
                          ) /
                          exerciseAttempts.length
                        : 0;

                    return (
                      <ClayCard
                        key={exerciseId}
                        className="rounded-[2rem] p-6"
                      >
                        {/* EXERCISE HEADER */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <SectionLabel>
                              Exercise
                            </SectionLabel>

                            <h3 className="mt-2 font-display text-2xl font-bold text-ink">
                              {exercise?.title ||
                                "Practice Exercise"}
                            </h3>

                            {exercise?.target_word && (
                              <p className="mt-2 text-sm font-semibold text-muted">
                                Target word:{" "}
                                <span className="text-ink">
                                  {
                                    exercise.target_word
                                  }
                                </span>
                              </p>
                            )}

                            {exercise?.description && (
                              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                {
                                  exercise.description
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <span className="rounded-full bg-soft px-4 py-2 text-xs font-bold text-ink">
                              {
                                exerciseAttempts.length
                              }{" "}
                              {exerciseAttempts.length ===
                              1
                                ? "attempt"
                                : "attempts"}
                            </span>

                            {exerciseAttempts.length >
                              0 && (
                              <span className="rounded-full bg-mint px-4 py-2 text-xs font-bold text-ink">
                                Avg.{" "}
                                {Math.round(
                                  averageExerciseScore
                                )}
                                %
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ATTEMPTS */}
                        <div className="mt-6 space-y-5">
                          {exerciseAttempts.length ===
                          0 ? (
                            <div className="rounded-[1.5rem] bg-soft p-5">
                              <p className="text-sm leading-6 text-muted">
                                No practice attempts
                                for this exercise yet.
                              </p>
                            </div>
                          ) : (
                            visibleAttempts.map(
                              (attempt) => (
                                <div
                                  key={attempt.id}
                                  className="rounded-[1.5rem] bg-soft p-5"
                                >
                                  {/* ATTEMPT HEADER */}
                                  <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                                        Practice attempt
                                      </p>

                                      <p className="mt-2 text-sm font-semibold text-ink">
                                        {attempt.created_at
                                          ? new Date(
                                              attempt.created_at
                                            ).toLocaleString()
                                          : "Recent session"}
                                      </p>
                                    </div>

                                    <span className="rounded-full bg-butter px-4 py-2 text-sm font-bold text-ink">
                                      {attempt.score !=
                                      null
                                        ? `${Math.round(
                                            attempt.score
                                          )}%`
                                        : "Not analyzed"}
                                    </span>
                                  </div>

                                  {/* RECORDING */}
                                  {attempt.recording
                                    ?.file_url && (
                                    <div className="mt-5 rounded-2xl bg-card p-4">
                                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                        Your recording
                                      </p>

                                      <audio
                                        controls
                                        src={`http://127.0.0.1:8000${attempt.recording.file_url}`}
                                        className="mt-3 w-full"
                                      />

                                      {attempt
                                        .recording
                                        .duration_seconds !==
                                        undefined && (
                                        <p className="mt-2 text-xs text-muted">
                                          Duration:{" "}
                                          {attempt.recording.duration_seconds.toFixed(
                                            1
                                          )}
                                          s
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* TRANSCRIPT */}
                                  {attempt.transcript && (
                                    <div className="mt-4 rounded-2xl bg-cream p-4">
                                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                        What SAWT heard
                                      </p>

                                      <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                                        {
                                          attempt.transcript
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* AI FEEDBACK */}
                                  {attempt.ai_feedback && (
                                    <div className="mt-4 rounded-2xl bg-butter p-4">
                                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                        SAWT feedback
                                      </p>

                                      <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                                        {
                                          attempt.ai_feedback
                                        }
                                      </p>
                                    </div>
                                  )}

                                  {/* OLD FEEDBACK FALLBACK */}
                                  {!attempt.ai_feedback &&
                                    attempt.feedback && (
                                      <div className="mt-4 rounded-2xl bg-butter p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                          Feedback
                                        </p>

                                        <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                                          {
                                            attempt.feedback
                                          }
                                        </p>
                                      </div>
                                    )}

                                  {/* THERAPIST FEEDBACK */}
                                  <div className="mt-4 rounded-2xl bg-card p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                      Therapist feedback
                                    </p>

                                    {attempt.therapist_feedback ? (
                                      <>
                                        <p className="mt-2 text-sm font-semibold leading-6 text-ink">
                                          {
                                            attempt.therapist_feedback
                                          }
                                        </p>

                                        {attempt.therapist_feedback_updated_at && (
                                          <p className="mt-2 text-xs text-muted">
                                            Updated{" "}
                                            {new Date(
                                              attempt.therapist_feedback_updated_at
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      <p className="mt-2 text-sm leading-6 text-muted">
                                        Your therapist
                                        has not added
                                        feedback for
                                        this attempt
                                        yet.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            )
                          )}
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                          <div className="mt-6 flex w-full items-center justify-between gap-2 overflow-hidden border-t border-ink/5 pt-5">
                            <button
                              type="button"
                              disabled={
                                currentPage === 1
                              }
                              onClick={() =>
                                setExercisePage(
                                  exerciseId,
                                  currentPage - 1
                                )
                              }
                              className="shrink-0 rounded-xl bg-soft px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                              ← Previous
                            </button>

                            <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                              {/* FIRST PAGE */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExercisePage(
                                    exerciseId,
                                    1
                                  )
                                }
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
                                  currentPage === 1
                                    ? "bg-ink text-cream"
                                    : "bg-soft text-ink"
                                }`}
                              >
                                1
                              </button>

                              {/* LEFT ELLIPSIS */}
                              {currentPage > 3 && (
                                <span className="shrink-0 px-1 text-xs font-bold text-muted">
                                  ...
                                </span>
                              )}

                              {/* MIDDLE PAGES */}
                              {Array.from(
                                {
                                  length: 3,
                                },
                                (_, index) =>
                                  currentPage -
                                  1 +
                                  index
                              )
                                .filter(
                                  (page) =>
                                    page > 1 &&
                                    page <
                                      totalPages
                                )
                                .map((page) => (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() =>
                                      setExercisePage(
                                        exerciseId,
                                        page
                                      )
                                    }
                                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
                                      page ===
                                      currentPage
                                        ? "bg-ink text-cream"
                                        : "bg-soft text-ink"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              
                              {/* RIGHT ELLIPSIS */}
                              {currentPage <
                                totalPages - 2 && (
                                <span className="shrink-0 px-1 text-xs font-bold text-muted">
                                  ...
                                </span>
                              )}

                              {/* LAST PAGE */}
                              {totalPages > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExercisePage(
                                      exerciseId,
                                      totalPages
                                    )
                                  }
                                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
                                    currentPage ===
                                    totalPages
                                      ? "bg-ink text-cream"
                                      : "bg-soft text-ink"
                                  }`}
                                >
                                  {totalPages}
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={
                                currentPage ===
                                totalPages
                              }
                              onClick={() =>
                                setExercisePage(
                                  exerciseId,
                                  currentPage + 1
                                )
                              }
                              className="shrink-0 rounded-xl bg-soft px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </ClayCard>
                    );
                  })}

                  {/* ATTEMPTS WITHOUT AN EXERCISE */}
                  {unassignedAttempts.length >
                    0 && (
                    <ClayCard className="rounded-[2rem] p-6">
                      <SectionLabel>
                        Other practice
                      </SectionLabel>

                      <h3 className="mt-2 font-display text-2xl font-bold text-ink">
                        Unlinked practice attempts
                      </h3>

                      <div className="mt-5 space-y-5">
                        {unassignedAttempts.map(
                          (attempt) => (
                            <div
                              key={attempt.id}
                              className="rounded-[1.5rem] bg-soft p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                                    Practice attempt
                                  </p>

                                  <p className="mt-2 text-sm font-semibold">
                                    {attempt.created_at
                                      ? new Date(
                                          attempt.created_at
                                        ).toLocaleString()
                                      : "Recent session"}
                                  </p>
                                </div>

                                <span className="rounded-full bg-butter px-4 py-2 text-sm font-bold">
                                  {attempt.score !=
                                  null
                                    ? `${Math.round(
                                        attempt.score
                                      )}%`
                                    : "Not analyzed"}
                                </span>
                              </div>

                              {attempt.recording
                                ?.file_url && (
                                <div className="mt-5 rounded-2xl bg-card p-4">
                                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                    Your recording
                                  </p>

                                  <audio
                                    controls
                                    src={`http://127.0.0.1:8000${attempt.recording.file_url}`}
                                    className="mt-3 w-full"
                                  />
                                </div>
                              )}

                              <div className="mt-4 rounded-2xl bg-card p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                                  Therapist feedback
                                </p>

                                <p className="mt-2 text-sm leading-6 text-muted">
                                  {attempt.therapist_feedback ||
                                    "No therapist feedback added yet."}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </ClayCard>
                  )}
                </div>
              )}
            </section>

            {/* PRACTICE CTA */}
            <ClayCard className="mt-8 rounded-[2rem] p-6">
              <SectionLabel>
                Ready for another try?
              </SectionLabel>

              <h2 className="mt-3 font-display text-2xl font-bold text-ink">
                Practice your exercises
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Choose an assigned exercise and let
                SAWT check your pronunciation.
              </p>

              <Link
                href="/child/exercises"
                className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream clay-sm clay-press"
              >
                Go to exercises
              </Link>
            </ClayCard>
          </>
        )}
      </div>
    </main>
  );
}