"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SawtLogo } from "@/components/role-shell";
import { ClayCard } from "@/components/clay";

type LatestAttempt = {
  id: string;
  score?: number | null;
  feedback?: string | null;
  created_at?: string;
};

type ChildProgress = {
  id: string;
  full_name: string;
  language_preference?: string;
  avatar_url?: string | null;
  attempts_count: number;
  average_score: number;
  latest_attempt?: LatestAttempt | null;
};

type RecentAttempt = {
  id: string;
  child_id: string;
  child_name: string;
  exercise_id?: string;
  score?: number | null;
  feedback?: string | null;
  therapist_feedback?: string | null;
  created_at?: string;
};

type ProgressData = {
  children_count: number;
  attempts_count: number;
  average_score: number;
  children: ChildProgress[];
  recent_attempts: RecentAttempt[];
};

function scoreLabel(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return "Not scored";
  }

  return `${Math.round(score)}%`;
}

function scoreClass(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return "bg-soft text-muted";
  }

  if (score >= 80) {
    return "bg-green-100 text-green-700";
  }

  if (score >= 60) {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-red-100 text-red-700";
}

function formatDate(date?: string) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString();
}

export default function TherapistProgressPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const token = localStorage.getItem("sawt_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const meResponse = await fetch(
          "http://127.0.0.1:8000/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!meResponse.ok) {
          throw new Error("Authentication failed");
        }

        const meData = await meResponse.json();

        if (meData?.user?.role !== "therapist") {
          window.location.href = "/";
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/assignments/therapist/progress",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load progress");
        }

        const data = await response.json();

        setProgress(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, []);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <SawtLogo subtitle="Therapist space" />

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Link
              href="/therapist"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
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
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Progress
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("sawt_token");
              window.location.href = "/login";
            }}
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Therapist
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold">
            Progress
          </h1>

          <p className="mt-2 max-w-2xl text-muted">
            Monitor pronunciation practice and progress across
            the children assigned to you.
          </p>
        </div>

        {loading && (
          <ClayCard className="p-8">
            <p className="text-muted">
              Loading progress...
            </p>
          </ClayCard>
        )}

        {error && (
          <ClayCard className="border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </ClayCard>
        )}

        {!loading && !error && progress && (
          <>
            {/* Overview */}
            <div className="grid gap-6 md:grid-cols-3">
              <ClayCard className="p-7">
                <p className="text-sm font-semibold text-muted">
                  Children
                </p>

                <p className="mt-3 font-display text-4xl font-bold">
                  {progress.children_count}
                </p>

                <p className="mt-2 text-sm text-muted">
                  Children currently assigned to you.
                </p>
              </ClayCard>

              <ClayCard className="bg-ink p-7 text-cream">
                <p className="text-sm font-semibold text-cream/70">
                  Practice Attempts
                </p>

                <p className="mt-3 font-display text-4xl font-bold">
                  {progress.attempts_count}
                </p>

                <p className="mt-2 text-sm text-cream/70">
                  Recorded pronunciation practice sessions.
                </p>
              </ClayCard>

              <ClayCard className="p-7">
                <p className="text-sm font-semibold text-muted">
                  Average Accuracy
                </p>

                <p className="mt-3 font-display text-4xl font-bold">
                  {Math.round(progress.average_score)}%
                </p>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-ink transition-all"
                    style={{
                      width: `${Math.min(
                        Math.max(progress.average_score, 0),
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-sm text-muted">
                  Average pronunciation score across recorded attempts.
                </p>
              </ClayCard>
            </div>

            {/* Children */}
            <div className="mt-10">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Children
                </p>

                <h2 className="mt-1 font-display text-2xl font-bold">
                  Individual Progress
                </h2>
              </div>

              {progress.children.length === 0 ? (
                <ClayCard className="p-8">
                  <p className="font-semibold">
                    No children yet
                  </p>

                  <p className="mt-2 text-sm text-muted">
                    Children will appear here once they are connected
                    to your therapist profile.
                  </p>
                </ClayCard>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {progress.children.map((child) => (
                    <ClayCard
                      key={child.id}
                      className="p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-2xl">
                            👦
                          </div>

                          <div>
                            <h3 className="font-display text-xl font-bold">
                              {child.full_name}
                            </h3>

                            <p className="text-sm text-muted">
                              {child.language_preference ||
                                "Language not specified"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${scoreClass(
                            child.average_score
                          )}`}
                        >
                          {scoreLabel(child.average_score)}
                        </span>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-soft p-4">
                          <p className="text-xs font-semibold uppercase text-muted">
                            Attempts
                          </p>

                          <p className="mt-1 text-2xl font-bold">
                            {child.attempts_count}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-soft p-4">
                          <p className="text-xs font-semibold uppercase text-muted">
                            Average
                          </p>

                          <p className="mt-1 text-2xl font-bold">
                            {scoreLabel(child.average_score)}
                          </p>
                        </div>
                      </div>

                      {child.latest_attempt && (
                        <div className="mt-4 rounded-2xl border border-ink/10 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                            Latest Practice
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-sm text-muted">
                              {formatDate(
                                child.latest_attempt.created_at
                              )}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-sm font-bold ${scoreClass(
                                child.latest_attempt.score
                              )}`}
                            >
                              {scoreLabel(
                                child.latest_attempt.score
                              )}
                            </span>
                          </div>

                          {child.latest_attempt.feedback && (
                            <p className="mt-3 text-sm text-muted">
                              {child.latest_attempt.feedback}
                            </p>
                          )}
                        </div>
                      )}

                      <Link
                        href={`/therapist/children/${child.id}`}
                        className="mt-5 block rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream transition hover:opacity-90"
                      >
                        View Child Progress
                      </Link>
                    </ClayCard>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Attempts */}
            <div className="mt-10">
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Practice History
                </p>

                <h2 className="mt-1 font-display text-2xl font-bold">
                  Recent Attempts
                </h2>
              </div>

              {progress.recent_attempts.length === 0 ? (
                <ClayCard className="p-8">
                  <p className="font-semibold">
                    No practice attempts yet.
                  </p>

                  <p className="mt-2 text-sm text-muted">
                    Practice attempts will appear here after children
                    complete their exercises.
                  </p>
                </ClayCard>
              ) : (
                <div className="space-y-4">
                  {progress.recent_attempts.map((attempt) => (
                    <ClayCard
                      key={attempt.id}
                      className="p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-display text-lg font-bold">
                            {attempt.child_name}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {formatDate(attempt.created_at)}
                          </p>
                        </div>

                        <span
                          className={`self-start rounded-full px-3 py-1 text-sm font-bold ${scoreClass(
                            attempt.score
                          )}`}
                        >
                          {scoreLabel(attempt.score)}
                        </span>
                      </div>

                      {attempt.feedback && (
                        <div className="mt-4 rounded-2xl bg-soft p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            AI Feedback
                          </p>

                          <p className="mt-2 text-sm">
                            {attempt.feedback}
                          </p>
                        </div>
                      )}

                      {attempt.therapist_feedback && (
                        <div className="mt-3 rounded-2xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            Therapist Feedback
                          </p>

                          <p className="mt-2 text-sm">
                            {attempt.therapist_feedback}
                          </p>
                        </div>
                      )}
                    </ClayCard>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}