"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ClayCard,
  Pill,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";

import { SawtLogo } from "@/components/role-shell";
import {
  getChild,
  getParentSummary,
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

type ChildStats = {
  child_id: string;
  name: string;
  attempts: number;
  average_score: number;
  best_score: number;
};

type RecentAttempt = {
  id: string;
  child_id: string;
  child_name: string;
  exercise_id: string;
  score: number | null;
  feedback: string | null;
  created_at: string | null;
};

type ParentSummary = {
  children_count: number;
  total_attempts: number;
  average_score: number;
  weekly_activity: {
    date: string;
    count: number;
  }[];
  children: ChildStats[];
  recent_attempts: RecentAttempt[];
};

const navItems = [
  { label: "Dashboard", href: "/parent" },
  { label: "Children", href: "/parent/children" },
  { label: "Progress", href: "/parent/progress" },
  { label: "Activity", href: "/parent/activity" },
  { label: "Profile", href: "/parent/profile" },
];

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Strong progress";
  if (score >= 60) return "Making progress";
  if (score > 0) return "Needs more practice";
  return "No results yet";
}

export default function ChildProgressPage() {
  const router = useRouter();
  const params = useParams();

  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [summary, setSummary] =
    useState<ParentSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChildProfile() {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const childData = await getChild(
          childId,
          token
        );

        setChild(childData);

        const summaryData =
          await getParentSummary(token);

        setSummary(summaryData);
      } catch (error) {
        console.error(error);
        setError("Unable to load this child's profile.");
      } finally {
        setLoading(false);
      }
    }

    loadChildProfile();
  }, [childId, router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <SawtLogo subtitle="Parent space" />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-12">
          <ClayCard className="rounded-[2rem] p-8">
            <p className="text-sm font-semibold text-muted">
              Loading child profile...
            </p>
          </ClayCard>
        </main>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen bg-cream font-body text-ink">
        <main className="mx-auto max-w-7xl px-6 py-12">
          <ClayCard className="rounded-[2rem] p-8">
            <p className="font-semibold text-brand">
              {error || "Child not found."}
            </p>

            <Link
              href="/parent/children"
              className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
            >
              Back to children
            </Link>
          </ClayCard>
        </main>
      </div>
    );
  }

  const age = calculateAge(child.date_of_birth);

  const childStats =
    summary?.children.find(
      (item) => item.child_id === child.id
    ) ?? null;

  const childAttempts =
    summary?.recent_attempts.filter(
      (attempt) => attempt.child_id === child.id
    ) ?? [];

  const averageScore =
    childStats?.average_score ?? 0;

  const bestScore =
    childStats?.best_score ?? 0;

  const attemptsCount =
    childStats?.attempts ?? 0;

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* Header */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Parent space" />
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/parent/children";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
                      : "rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
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
        {/* Profile Header */}
        <section className="pt-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid size-20 shrink-0 place-items-center rounded-[1.75rem] bg-butter text-4xl clay-sm">
                {child.avatar_url || "🧒"}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                  Child Profile
                </p>

                <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
                  {child.full_name}
                </h1>

                <p className="mt-2 text-sm text-muted">
                  Age {age} ·{" "}
                  {child.language_preference}
                </p>
              </div>
            </div>

            <Link
              href="/parent/children"
              className="rounded-full bg-card px-5 py-3 text-center text-sm font-bold clay-sm clay-press"
            >
              ← Back to children
            </Link>
          </div>
        </section>

        {/* Context Notice */}
        <section className="mt-8">
          <div className="rounded-[2rem] bg-soft p-5 clay-sm">
            <div className="flex items-start gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-lg">
                👨‍👩‍👧
              </div>

              <div>
                <p className="text-sm font-bold">
                  Parent view
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  You are viewing {child.full_name}'s
                  practice profile. Your parent account is
                  still active, and this view does not change
                  the child's login or authentication.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Stats */}
        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <ClayCard tone="butter" className="rounded-[2rem] p-7">
            <SectionLabel tone="muted">
              Age
            </SectionLabel>

            <p className="mt-3 font-display text-4xl font-bold">
              {age}
            </p>

            <p className="mt-2 text-sm text-muted">
              Years old
            </p>
          </ClayCard>

          <ClayCard tone="mint" className="rounded-[2rem] p-7">
            <SectionLabel tone="muted">
              Sessions
            </SectionLabel>

            <p className="mt-3 font-display text-4xl font-bold">
              {attemptsCount}
            </p>

            <p className="mt-2 text-sm text-muted">
              Completed practice
            </p>
          </ClayCard>

          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              Average accuracy
            </SectionLabel>

            <p className="mt-3 font-display text-4xl font-bold">
              {attemptsCount > 0
                ? `${Math.round(averageScore)}%`
                : "—"}
            </p>

            <p className="mt-2 text-sm text-muted">
              Pronunciation results
            </p>
          </ClayCard>

          <ClayCard
            tone="accent2"
            className="rounded-[2rem] p-7 text-white"
          >
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
              Best score
            </span>

            <p className="mt-3 font-display text-4xl font-bold">
              {attemptsCount > 0
                ? `${Math.round(bestScore)}%`
                : "—"}
            </p>

            <div className="mt-3">
              <Pill tone="mint">
                {getScoreLabel(bestScore)}
              </Pill>
            </div>
          </ClayCard>
        </section>

        {/* Progress Overview */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel tone="mint">
              Pronunciation
            </SectionLabel>

            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Accuracy overview
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Overall pronunciation performance based
                  on completed practice attempts.
                </p>
              </div>

              <Pill
                tone={
                  attemptsCount > 0
                    ? "mint"
                    : "butter"
                }
              >
                {attemptsCount > 0
                  ? getScoreLabel(averageScore)
                  : "No results yet"}
              </Pill>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Average accuracy
                </span>

                <span className="text-sm font-bold text-brand">
                  {attemptsCount > 0
                    ? `${Math.round(averageScore)}%`
                    : "—"}
                </span>
              </div>

              <ProgressBar
                value={averageScore}
                tone="brand"
                label={`${child.full_name} average accuracy`}
                className="mt-3 h-3"
              />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Practice sessions
                </p>

                <p className="mt-3 font-display text-2xl font-bold">
                  {attemptsCount}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Completed analyzed attempts
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Average
                </p>

                <p className="mt-3 font-display text-2xl font-bold">
                  {attemptsCount > 0
                    ? `${Math.round(averageScore)}%`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Overall pronunciation accuracy
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Best result
                </p>

                <p className="mt-3 font-display text-2xl font-bold">
                  {attemptsCount > 0
                    ? `${Math.round(bestScore)}%`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-muted">
                  Highest recorded score
                </p>
              </div>
            </div>
          </ClayCard>

          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              Child information
            </SectionLabel>

            <h2 className="mt-2 font-display text-2xl font-bold">
              Profile details
            </h2>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Name
                </p>

                <p className="mt-1 text-sm font-bold">
                  {child.full_name}
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Language
                </p>

                <p className="mt-1 text-sm font-bold">
                  {child.language_preference}
                </p>
              </div>

              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Date of birth
                </p>

                <p className="mt-1 text-sm font-bold">
                  {new Date(
                    child.date_of_birth
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </ClayCard>
        </section>

        {/* Recent Activity */}
        <section className="mt-8">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel>
              Recent activity
            </SectionLabel>

            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Practice history
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Recent analyzed practice attempts for{" "}
                  {child.full_name}.
                </p>
              </div>

              <Link
                href="/parent/activity"
                className="text-sm font-bold text-brand"
              >
                View all activity →
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {childAttempts.length === 0 ? (
                <div className="rounded-2xl bg-soft p-6 text-center">
                  <p className="text-sm font-semibold text-muted">
                    No practice sessions have been completed yet.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-muted">
                    Completed pronunciation sessions will
                    appear here.
                  </p>
                </div>
              ) : (
                childAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex flex-col gap-3 rounded-2xl bg-cream p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-black">
                        Practice session
                      </p>

                      <p className="mt-1 text-xs font-semibold text-muted">
                        Exercise {attempt.exercise_id}
                      </p>

                      {attempt.created_at && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDateTime(
                            attempt.created_at
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Pill
                        tone={
                          (attempt.score ?? 0) >= 80
                            ? "mint"
                            : "butter"
                        }
                      >
                        {attempt.score ?? 0}%
                      </Pill>

                      {attempt.feedback && (
                        <span className="max-w-xs text-xs text-muted">
                          {attempt.feedback}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ClayCard>
        </section>

        {/* Parent Guidance */}
        <section className="mt-8">
          <ClayCard
            tone="butter"
            className="rounded-[2rem] p-7"
          >
            <SectionLabel>
              Parent guidance
            </SectionLabel>

            <h2 className="mt-2 font-display text-2xl font-bold">
              Support practice without pressure.
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/70">
              SAWT is designed to help you understand your
              child's practice activity and pronunciation
              progress between professional speech therapy
              sessions. Encourage consistent practice and
              celebrate effort rather than focusing only on
              the score.
            </p>
          </ClayCard>
        </section>

        {/* Disclaimer */}
        <section className="mt-8">
          <div className="rounded-[2rem] bg-soft p-6 clay-sm">
            <p className="text-center text-xs leading-relaxed text-muted">
              SAWT supports professional speech therapy. It
              does not replace a speech therapist or provide
              a medical diagnosis.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — Arabic + English speech practice
            companion.
          </p>

          <div className="flex gap-5 text-sm text-muted">
            <Link href="/parent">
              Dashboard
            </Link>

            <Link href="/parent/children">
              Children
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

