"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClayCard, Pill, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";

type Attempt = {
  id: string;
  exercise_id?: string;
  assignment_id?: string;
  score?: number | null;
  feedback?: string | null;
  transcript?: string | null;
  created_at?: string;
};

type ProgressData = {
  total_attempts: number;
  average_score: number;
  attempts: Attempt[];
};

export default function ChildProgressPage() {
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleSignOut() {
    localStorage.removeItem("sawt_token");
    router.replace("/login");
  }

  useEffect(() => {
    async function loadProgress() {
      try {
        const token = localStorage.getItem("sawt_token");

        if (!token) {
          router.replace("/login");
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
          throw new Error("Unable to load child profile.");
        }

        const childData = await childResponse.json();


        const childId = childData.child?.id;

        if (!childId) {
          throw new Error("Child profile ID not found.");
        }

        const progressResponse = await fetch(
          `http://127.0.0.1:8000/attempts/child/${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!progressResponse.ok) {
          const data = await progressResponse.json().catch(() => null);

          throw new Error(
            data?.detail || "Unable to load practice progress."
          );
        }

        const progressData = await progressResponse.json();

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

  const latestAttempt = progress?.attempts?.[0];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <SawtLogo subtitle="Keep practicing!" />

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Link
              href="/child"
              className="rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-soft"
            >
              Home
            </Link>

            <Link
              href="/child/exercises"
              className="rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-soft"
            >
              Exercises
            </Link>

            <Link
              href="/child/progress"
              className="rounded-full bg-butter px-4 py-2 text-sm font-bold text-ink"
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

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section>
          <Pill>Your progress</Pill>

          <h1 className="mt-4 font-display text-4xl font-bold text-ink">
            Keep up the great work! 🌟
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Every practice session helps you get better at your target words.
          </p>
        </section>

        {loading && (
          <ClayCard className="mt-8">
            <p className="text-sm font-semibold text-muted">
              Loading your progress...
            </p>
          </ClayCard>
        )}

        {error && !loading && (
          <ClayCard className="mt-8">
            <p className="font-bold text-ink">
              We couldn't load your progress.
            </p>

            <p className="mt-2 text-sm text-muted">{error}</p>
          </ClayCard>
        )}

        {progress && !loading && !error && (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <ClayCard>
                <SectionLabel>Practice sessions</SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {progress.total_attempts}
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Completed pronunciation practices.
                </p>
              </ClayCard>

              <ClayCard>
                <SectionLabel>Average accuracy</SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {Math.round(progress.average_score)}%
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Based on your completed practice sessions.
                </p>
              </ClayCard>

              <ClayCard>
                <SectionLabel>Latest score</SectionLabel>

                <p className="mt-4 font-display text-4xl font-bold text-ink">
                  {latestAttempt?.score != null
                    ? `${Math.round(latestAttempt.score)}%`
                    : "—"}
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Your most recent pronunciation result.
                </p>
              </ClayCard>
            </div>

            <ClayCard className="mt-8">
              <SectionLabel>Recent practice</SectionLabel>

              {progress.attempts.length === 0 ? (
                <div className="mt-5">
                  <h2 className="font-display text-2xl font-bold text-ink">
                    No practice sessions yet
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    Complete an exercise and your pronunciation results will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {progress.attempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-2xl bg-soft p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">
                            Practice session
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {attempt.created_at
                              ? new Date(
                                  attempt.created_at
                                ).toLocaleDateString()
                              : "Recent session"}
                          </p>
                        </div>

                        {attempt.score != null && (
                          <span className="rounded-full bg-butter px-4 py-2 text-sm font-bold text-ink">
                            {Math.round(attempt.score)}%
                          </span>
                        )}
                      </div>

                      {attempt.feedback && (
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {attempt.feedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ClayCard>

            <ClayCard className="mt-8">
              <SectionLabel>Ready for another try?</SectionLabel>

              <h2 className="mt-3 font-display text-2xl font-bold text-ink">
                Practice your exercises
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Choose an assigned exercise and let SAWT check your
                pronunciation.
              </p>

              <Link
                href="/child/exercises"
                className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-white clay-press"
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

