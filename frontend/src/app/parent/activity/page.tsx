"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ClayCard,
  SectionLabel,
  Pill,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getParentActivity } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type Activity = {
  id: string;
  type: "exercise_assigned" | "therapist_feedback";

  child_id: string;
  child_name: string;

  exercise_id: string;
  exercise_title: string;
  target_word?: string | null;

  therapist_name?: string | null;

  assigned_at?: string | null;
  due_date?: string | null;
  status?: string;

  therapist_feedback?: string | null;
  created_at?: string | null;
  attempt_id?: string;
};

type ActivityResponse = {
  activities: Activity[];
  total: number;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/parent",
  },
  {
    label: "Children",
    href: "/parent/children",
  },
  {
    label: "Progress",
    href: "/parent/progress",
  },
  {
    label: "Activity",
    href: "/parent/activity",
  },
  {
    label: "Profile",
    href: "/parent/profile",
  },
];

function formatDate(date: string | null | undefined) {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getActivityDate(activity: Activity) {
  return activity.created_at || activity.assigned_at || null;
}

function getStatusLabel(status?: string) {
  if (!status) return "";

  return status
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusTone(
  status?: string
): "mint" | "butter" | "muted" {
  switch (status) {
    case "completed":
      return "mint";

    case "overdue":
    case "in_progress":
      return "butter";

    default:
      return "muted";
  }
}

export default function ParentActivityPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivity() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data: ActivityResponse =
          await getParentActivity(token);

        setActivities(data.activities || []);
      } catch (err) {
        console.error("Activity error:", err);
        setError("Unable to load activity.");
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

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
              {navItems.map((item) => {
                const isActive =
                  item.href === "/parent/activity";

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
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="min-w-0 flex-1 px-6 pb-20 pt-10 md:px-10 lg:px-14">
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionLabel>
                Activity
              </SectionLabel>

              <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
                Recent activity
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Stay up to date with assignments,
                therapist feedback, and important
                moments in your child&apos;s speech
                therapy journey.
              </p>
            </div>
          </section>

          {/* Loading */}
          {loading && (
            <section className="mt-10">
              <ClayCard className="rounded-[2rem] p-8">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl bg-butter text-xl clay-sm">
                    ✨
                  </div>

                  <div>
                    <p className="font-display text-xl font-bold">
                      Loading activity
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      Fetching the latest updates...
                    </p>
                  </div>
                </div>
              </ClayCard>
            </section>
          )}

          {/* Error */}
          {!loading && error && (
            <section className="mt-10">
              <ClayCard className="rounded-[2rem] p-8">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-soft text-xl font-bold text-brand clay-sm">
                    !
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-bold">
                      Unable to load activity
                    </h2>

                    <p className="mt-1 text-sm text-brand">
                      {error}
                    </p>
                  </div>
                </div>
              </ClayCard>
            </section>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            activities.length === 0 && (
              <section className="mt-10">
                <ClayCard className="rounded-[2rem] p-10 text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-butter text-3xl clay-sm">
                    ✨
                  </div>

                  <h2 className="mt-5 font-display text-2xl font-bold">
                    No activity yet
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                    New exercise assignments and
                    therapist feedback will appear
                    here as your child continues
                    practicing.
                  </p>

                  <Link
                    href="/parent/children"
                    className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
                  >
                    View children
                  </Link>
                </ClayCard>
              </section>
            )}

          {/* Activity list */}
          {!loading &&
            !error &&
            activities.length > 0 && (
              <section className="mt-10 space-y-5">
                {activities.map((activity) => (
                  <ClayCard
                    key={activity.id}
                    className="rounded-[2rem] p-6 sm:p-7"
                  >
                    <div className="flex items-start gap-4">
                      {/* Activity icon */}
                      <div
                        className={`grid size-12 shrink-0 place-items-center rounded-2xl text-xl clay-sm ${
                          activity.type ===
                          "exercise_assigned"
                            ? "bg-butter"
                            : "bg-mint"
                        }`}
                      >
                        {activity.type ===
                        "exercise_assigned"
                          ? "📚"
                          : "💬"}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="font-display text-xl font-bold">
                              {activity.type ===
                              "exercise_assigned"
                                ? "Exercise assigned"
                                : "Therapist feedback added"}
                            </h2>

                            <p className="mt-1 text-xs font-semibold text-muted">
                              {formatDate(
                                getActivityDate(
                                  activity
                                )
                              )}
                            </p>
                          </div>

                          <Pill tone="muted">
                            {activity.child_name}
                          </Pill>
                        </div>

                        {/* Exercise assigned */}
                        {activity.type ===
                          "exercise_assigned" && (
                          <div className="mt-5 rounded-[1.5rem] bg-soft p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-display text-xl font-bold">
                                  {
                                    activity.exercise_title
                                  }
                                </p>

                                {activity.target_word && (
                                  <p className="mt-1 text-sm text-muted">
                                    Target word:{" "}
                                    <span className="font-bold text-ink">
                                      {
                                        activity.target_word
                                      }
                                    </span>
                                  </p>
                                )}
                              </div>

                              {activity.status && (
                                <Pill
                                  tone={getStatusTone(
                                    activity.status
                                  )}
                                >
                                  {getStatusLabel(
                                    activity.status
                                  )}
                                </Pill>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {activity.therapist_name && (
                                <span className="rounded-full bg-card px-3 py-1.5 text-xs font-bold clay-sm">
                                  Assigned by{" "}
                                  {
                                    activity.therapist_name
                                  }
                                </span>
                              )}

                              {activity.due_date && (
                                <span className="rounded-full bg-card px-3 py-1.5 text-xs font-bold clay-sm">
                                  Due{" "}
                                  {formatDate(
                                    activity.due_date
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Therapist feedback */}
                        {activity.type ===
                          "therapist_feedback" && (
                          <div className="mt-5 rounded-[1.5rem] bg-soft p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-display text-xl font-bold">
                                  {
                                    activity.exercise_title
                                  }
                                </p>

                                {activity.target_word && (
                                  <p className="mt-1 text-sm text-muted">
                                    Target word:{" "}
                                    <span className="font-bold text-ink">
                                      {
                                        activity.target_word
                                      }
                                    </span>
                                  </p>
                                )}
                              </div>

                              <Pill tone="mint">
                                Feedback
                              </Pill>
                            </div>

                            <div className="mt-4 rounded-2xl bg-card p-5">
                              <p className="text-sm leading-7 text-muted">
                                &ldquo;
                                {
                                  activity.therapist_feedback
                                }
                                &rdquo;
                              </p>
                            </div>

                            {activity.attempt_id && (
                              <div className="mt-4">
                                <Link
                                  href={`/parent/progress/attempt/${activity.attempt_id}`}
                                  className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
                                >
                                  View attempt
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ClayCard>
                ))}
              </section>
            )}

          {/* Disclaimer */}
          <section className="mt-10">
            <div className="rounded-[2rem] bg-soft p-6 clay-sm">
              <p className="text-center text-xs leading-relaxed text-muted">
                SAWT supports professional speech
                therapy. It does not replace a
                speech therapist or provide a
                medical diagnosis.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — English speech practice
            companion.
          </p>
        </div>
      </footer>
    </div>
  );
}