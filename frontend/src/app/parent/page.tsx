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
import {
  getChildren,
  getChildAssignments,
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

type Assignment = {
  id: string;
  child_id: string;
  exercise_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string;
  status: string;
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
  children: {
    child_id: string;
    name: string;
    attempts: number;
    average_score: number;
    best_score: number;
  }[];
  recent_attempts: RecentAttempt[];
};

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ParentDashboard() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    null
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [parentSummary, setParentSummary] =
    useState<ParentSummary | null>(null);

  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [childrenError, setChildrenError] = useState("");

  const selectedChild = useMemo(
    () =>
      children.find(
        (child) => child.id === selectedChildId
      ) ?? null,
    [children, selectedChildId]
  );

  useEffect(() => {
    async function checkAuthAndLoadChildren() {
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
        const loadedChildren: Child[] = data.children ?? [];

        setChildren(loadedChildren);

        const summary = await getParentSummary(token);
        setParentSummary(summary);

        if (loadedChildren.length > 0) {
          setSelectedChildId(loadedChildren[0].id);
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

    checkAuthAndLoadChildren();
  }, [router]);

  useEffect(() => {
    async function loadAssignments() {
      if (!selectedChildId) {
        setAssignments([]);
        setAttemptsCount(0);
        return;
      }

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      setLoadingAssignments(true);

      try {
        const data = await getChildAssignments(
          selectedChildId,
          token
        );

        setAssignments(data.assignments ?? []);
        setAttemptsCount(data.attempts_count ?? 0);
      } catch (error) {
        console.error(error);
        setAssignments([]);
        setAttemptsCount(0);
      } finally {
        setLoadingAssignments(false);
      }
    }

    loadAssignments();
  }, [selectedChildId, router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "completed" &&
      assignment.status !== "deassigned" &&
      assignment.status !== "cancelled"
  );

  const weeklyActivity =
    parentSummary?.weekly_activity ?? [];

  const maxWeeklyCount = Math.max(
    ...weeklyActivity.map((day) => day.count),
    1
  );

  const recentAttempts =
    parentSummary?.recent_attempts ?? [];

  const pronunciationResults = recentAttempts
    .filter((attempt) => attempt.feedback)
    .slice(0, 5);

  const selectedChildStats =
    parentSummary?.children.find(
      (child) => child.child_id === selectedChildId
    ) ?? null;

  const averageScore =
    parentSummary?.average_score ?? 0;

  return (
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* Header */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <div className="shrink-0">
            <SawtLogo subtitle="Parent space" />
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-2">
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
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        {/* Heading */}
        <section className="flex flex-col gap-5 pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Parent Dashboard
            </p>

            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              {selectedChild
                ? `${selectedChild.full_name}'s week`
                : "Your family's practice"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Keep an eye on practice, celebrate progress, and
              support your child between therapy sessions.
            </p>
          </div>

          {children.length > 0 && (
            <div className="w-full md:w-64">
              <label
                htmlFor="child"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted"
              >
                Current child
              </label>

              <select
                id="child"
                value={selectedChildId ?? ""}
                onChange={(event) =>
                  setSelectedChildId(event.target.value)
                }
                className="w-full rounded-2xl bg-card px-4 py-3 text-sm font-bold outline-none clay-sm"
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
          <div className="mt-8 rounded-2xl bg-soft p-4 text-sm font-semibold text-brand">
            {childrenError}
          </div>
        )}

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ClayCard>
            <p className="text-sm font-semibold text-muted">
              Practice sessions
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              {parentSummary?.total_attempts ??
                attemptsCount}
            </p>

            <p className="mt-1 text-xs text-muted">
              Recorded practice attempts
            </p>
          </ClayCard>

          <ClayCard tone="butter">
            <p className="text-sm font-semibold text-ink/60">
              Average accuracy
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              {parentSummary
                ? `${Math.round(averageScore)}%`
                : "—"}
            </p>

            <p className="mt-1 text-xs text-ink/60">
              Across analyzed practice attempts
            </p>
          </ClayCard>

          <ClayCard tone="mint">
            <p className="text-sm font-semibold text-ink/60">
              Streak
            </p>

            <p className="mt-3 font-display text-4xl font-bold">
              —
            </p>

            <p className="mt-1 text-xs text-ink/60">
              Streak tracking coming with progress data
            </p>
          </ClayCard>

          <ClayCard tone="accent2">
            <p className="text-sm font-semibold text-white/70">
              Assigned exercises
            </p>

            <p className="mt-3 font-display text-4xl font-bold text-white">
              {loadingAssignments
                ? "…"
                : activeAssignments.length}
            </p>

            <p className="mt-1 text-xs text-white/70">
              Current assignments
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

            {weeklyActivity.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-soft p-5 text-sm font-semibold text-muted">
                No practice activity yet.
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

                      <div className="text-xs font-semibold text-gray-500">
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
                    Results will appear here after your
                    child completes analyzed practice.
                  </p>
                </div>
              ) : (
                pronunciationResults.map(
                  (attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-2xl bg-cream p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-ink">
                          {attempt.child_name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-muted">
                          Practice attempt
                        </p>

                        {attempt.created_at && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            {formatDateTime(
                              attempt.created_at
                            )}
                          </p>
                        )}
                      </div>

                      <div className="ml-3 shrink-0 rounded-full bg-mint px-3 py-1 text-sm font-black text-ink">
                        {attempt.score ?? 0}%
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <p className="mt-5 text-xs leading-5 text-muted">
              Pronunciation scores are generated from
              practice attempts and are intended to support,
              not replace, professional speech therapy.
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

            <p className="mt-4 text-sm leading-6 text-ink/70">
              Short, consistent practice sessions can make
              home practice feel easier for children.
              Celebrate the effort rather than focusing only
              on getting every sound right.
            </p>

            <div className="mt-7 rounded-2xl bg-card/70 p-4">
              <p className="text-sm font-bold">
                Professional support matters.
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                SAWT is designed to support practice between
                sessions with a speech therapist.
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
                  Create a child account to start assigning
                  exercises and tracking speech practice.
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
              SAWT supports professional speech therapy. It
              does not replace a speech therapist or provide a
              medical diagnosis.
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
        </div>
      </footer>
    </div>
  );
}

