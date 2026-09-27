"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ClayCard,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getParentChildAttempts } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

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

type AttemptsResponse = {
  child: {
    id: string;
    name: string;
  };

  attempts: ParentChildAttempt[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

function formatDateTime(date: string | null) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  if (!seconds || seconds < 1) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Great";
  if (score >= 60) return "Good";
  if (score >= 40) return "Keep practicing";

  return "Needs practice";
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

export default function ParentAttemptPage() {
  const params = useParams();
  const router = useRouter();

  const attemptId = String(params.attemptId);

  const [attempt, setAttempt] =
    useState<ParentChildAttempt | null>(null);

  const [childName, setChildName] =
    useState("");

  const [allAttempts, setAllAttempts] = useState<
    ParentChildAttempt[]
  >([]);

  const [currentIndex, setCurrentIndex] =
    useState(-1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttempt() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        /*
         * First validate the current user.
         */
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

        /*
         * We don't yet know the child ID from the URL.
         *
         * Load the parent's children through the parent
         * summary endpoint first.
         */
        const summaryResponse = await fetch(
          "http://127.0.0.1:8000/attempts/parent/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!summaryResponse.ok) {
          throw new Error(
            "Failed to load parent summary"
          );
        }

        const summary =
          await summaryResponse.json();

        /*
         * Find which child owns this attempt.
         *
         * We load the attempt history for each child.
         * This keeps the page fully protected by the
         * backend's parent authorization.
         */
        let foundAttempt:
          | ParentChildAttempt
          | null = null;

        let foundAttempts:
          | ParentChildAttempt[]
          | null = null;

        let foundChildName = "";

        for (const child of summary.children) {
          const response =
            await getParentChildAttempts(
              child.child_id,
              token,
              1,
              20
            );

          const matchingAttempt =
            response.attempts.find(
              (item) => item.id === attemptId
            );

          if (matchingAttempt) {
            foundAttempt = matchingAttempt;
            foundAttempts = response.attempts;
            foundChildName =
              response.child.name;

            break;
          }
        }

        if (!foundAttempt || !foundAttempts) {
          throw new Error(
            "Attempt could not be found"
          );
        }

        setAttempt(foundAttempt);
        setAllAttempts(foundAttempts);
        setChildName(foundChildName);

        const index = foundAttempts.findIndex(
          (item) => item.id === attemptId
        );

        setCurrentIndex(index);
      } catch (err) {
        console.error(err);

        setError(
          "We couldn't load this pronunciation attempt."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttempt();
  }, [attemptId, router]);

  const previousAttempt = useMemo(() => {
    if (
      currentIndex < 0 ||
      currentIndex >= allAttempts.length - 1
    ) {
      return null;
    }

    return allAttempts[currentIndex + 1];
  }, [allAttempts, currentIndex]);

  const nextAttempt = useMemo(() => {
    if (
      currentIndex <= 0 ||
      currentIndex >= allAttempts.length
    ) {
      return null;
    }

    return allAttempts[currentIndex - 1];
  }, [allAttempts, currentIndex]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  function goToPrevious() {
    if (previousAttempt) {
      router.push(
        `/parent/progress/attempt/${previousAttempt.id}`
      );
    }
  }

  function goToNext() {
    if (nextAttempt) {
      router.push(
        `/parent/progress/attempt/${nextAttempt.id}`
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
            <SawtLogo subtitle="Parent space" />

            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-2">
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

        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-bold text-muted">
            Loading attempt...
          </p>
        </main>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
            <SawtLogo subtitle="Parent space" />

            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-2">
                <Link
                  href="/parent"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-cream"
                >
                  Dashboard
                </Link>

                <Link
                  href="/parent/children"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-cream"
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
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-cream"
                >
                  Activity
                </Link>

                <Link
                  href="/parent/profile"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-cream"
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

        <main className="mx-auto max-w-6xl px-6 py-12">
          <ClayCard className="p-8">
            <h1 className="font-display text-3xl font-bold">
              Attempt unavailable
            </h1>

            <p className="mt-3 text-sm text-muted">
              {error ||
                "This pronunciation attempt could not be found."}
            </p>

            <Link
              href="/parent/progress"
              className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
            >
              Back to Progress
            </Link>
          </ClayCard>
        </main>
      </div>
    );
  }

  const score = attempt.ai_score ?? 0;
  const exerciseName = getExerciseName(attempt);
  const targetWord = getTargetWord(attempt);

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

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Breadcrumb */}
        <div className="pt-10">
          <Link
            href={`/parent/progress${
              attempt.child_id
                ? `?child=${attempt.child_id}`
                : ""
            }`}
            className="text-sm font-bold text-muted transition hover:text-ink"
          >
            ← Back to {childName}'s progress
          </Link>
        </div>

        {/* Heading */}
        <section className="pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            Voice Attempt
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                {childName}'s attempt
              </h1>

              <p className="mt-3 text-sm font-semibold text-muted">
                {exerciseName} · Target:{" "}
                {targetWord}
              </p>
            </div>

            <div className="rounded-2xl bg-card px-5 py-3 text-sm font-bold clay-sm">
              {formatDateTime(
                attempt.created_at
              )}
            </div>
          </div>
        </section>

        {/* Score + recording */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <ClayCard
            tone="accent2"
            className="rounded-[2rem] p-7"
          >
            <SectionLabel>
              Pronunciation score
            </SectionLabel>

            <p className="mt-4 font-display text-6xl font-bold text-white">
              {Math.round(score)}%
            </p>

            <p className="mt-2 text-sm font-bold text-white/80">
              {getScoreLabel(score)}
            </p>

            <div className="mt-6">
              <div className="h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(score, 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </ClayCard>

          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              Voice recording
            </SectionLabel>

            {attempt.recording ? (
              <div className="mt-5">
                <audio
                controls
                preload="metadata"
                src={`http://127.0.0.1:8000${attempt.recording.file_url}`}
                className="w-full"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-cream px-4 py-2 text-xs font-bold">
                    Duration:{" "}
                    {formatDuration(
                      attempt.recording
                        .duration_seconds
                    )}
                  </span>

                  <span className="rounded-full bg-cream px-4 py-2 text-xs font-bold">
                    Recorded:{" "}
                    {formatDateTime(
                      attempt.recording
                        .created_at
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-cream p-5">
                <p className="text-sm font-bold">
                  No recording is available.
                </p>

                <p className="mt-1 text-xs text-muted">
                  The audio recording for this attempt
                  could not be found.
                </p>
              </div>
            )}
          </ClayCard>
        </section>

        {/* Transcript */}
        <section className="mt-5">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              What SAWT heard
            </SectionLabel>

            <h2 className="mt-3 font-display text-2xl font-bold">
              Transcript
            </h2>

            <div className="mt-5 rounded-2xl bg-cream p-6">
              <p className="text-lg font-bold">
                {attempt.transcript ||
                  "No transcript available."}
              </p>
            </div>
          </ClayCard>
        </section>

        {/* AI feedback */}
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <ClayCard
            tone="butter"
            className="rounded-[2rem] p-7"
          >
            <SectionLabel>
              AI feedback
            </SectionLabel>

            <h2 className="mt-3 font-display text-2xl font-bold">
              Practice feedback
            </h2>

            <div className="mt-5 rounded-2xl bg-card/70 p-5">
              <p className="text-sm font-semibold leading-7 text-ink/75">
                {attempt.ai_feedback ||
                  "No AI feedback is available for this attempt."}
              </p>
            </div>
          </ClayCard>

          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              Therapist feedback
            </SectionLabel>

            <h2 className="mt-3 font-display text-2xl font-bold">
              Professional notes
            </h2>

            <div className="mt-5 rounded-2xl bg-cream p-5">
              <p className="text-sm font-semibold leading-7 text-ink/70">
                {attempt.therapist_feedback ||
                  "No therapist feedback has been added yet."}
              </p>
            </div>
          </ClayCard>
        </section>

        {/* Pronunciation analysis */}
<section className="mt-5">
  <ClayCard className="rounded-[2rem] p-7">
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <SectionLabel tone="mint">
          Phoneme analysis
        </SectionLabel>

        <h2 className="mt-3 font-display text-2xl font-bold">
          Pronunciation details
        </h2>
      </div>

      <span className="text-xs font-semibold text-muted">
        {attempt.ai_analysis.length}{" "}
        {attempt.ai_analysis.length === 1
          ? "analysis"
          : "analyses"}
      </span>
    </div>

    {attempt.ai_analysis.length === 0 ? (
      <div className="mt-6 rounded-2xl bg-cream p-5">
        <p className="text-sm font-bold">
          No phoneme analysis is available.
        </p>
      </div>
    ) : (
      <div className="mt-6 grid gap-3">
        {attempt.ai_analysis.map((analysis) => {
          const pronunciationScore =
            analysis.pronunciation_score ?? 0;

          const confidence =
            analysis.confidence ?? 0;

          const hasMismatch =
            analysis.target_phoneme_id ||
            analysis.estimated_phoneme_id;

          return (
            <div
              key={analysis.id}
              className="rounded-2xl bg-cream p-5"
            >
              {!hasMismatch ? (
                <div className="rounded-2xl bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-xl">
                      ✓
                    </div>

                    <div>
                      <p className="text-base font-black">
                        Correct pronunciation
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                        No phoneme mismatches were detected.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                      Target phoneme
                    </p>

                    <p className="mt-2 text-sm font-black">
                      {analysis.target_phoneme_id ||
                        "Not detected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                      Estimated phoneme
                    </p>

                    <p className="mt-2 text-sm font-black">
                      {analysis.estimated_phoneme_id ||
                        "Not detected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">
                      Confidence
                    </p>

                    <p className="mt-2 text-sm font-black">
                      {Math.round(confidence * 100)}%
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">
                    Pronunciation score
                  </span>

                  <span className="text-sm font-black">
                    {Math.round(pronunciationScore)}%
                  </span>
                </div>

                <div className="mt-2">
                  <ProgressBar value={pronunciationScore} />
                </div>
              </div>

              {analysis.details && (
                <div className="mt-4 rounded-2xl bg-card p-4">
                  <p className="text-xs font-semibold leading-6 text-ink/70">
                    {analysis.details}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </ClayCard>
</section>

        {/* Attempt pagination */}
        <section className="mt-8">
          <ClayCard className="rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={!previousAttempt}
                className="rounded-full bg-card px-5 py-3 text-sm font-bold clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous attempt
              </button>

              <div className="text-center">
                <p className="text-xs font-bold text-muted">
                  Attempt
                </p>

                <p className="mt-1 text-sm font-black">
                  {currentIndex >= 0
                    ? currentIndex + 1
                    : 0}{" "}
                  of {allAttempts.length}
                </p>
              </div>

              <button
                type="button"
                onClick={goToNext}
                disabled={!nextAttempt}
                className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next attempt →
              </button>
            </div>
          </ClayCard>
        </section>
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