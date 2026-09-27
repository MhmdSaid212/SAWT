"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ClayCard,
  Pill,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";

import { SawtLogo } from "@/components/role-shell";

import {
  getChildren,
  getChildAssignments,
  getParentSummary,
  updateChild,
  deleteChild,
  type ChildAssignment,
} from "@/lib/api";

import {
  getToken,
  removeToken,
  saveParentToken,
  saveToken,
} from "@/lib/auth";

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

type ParentSummary = {
  children_count: number;
  total_attempts: number;
  average_score: number;
  weekly_activity: {
    date: string;
    count: number;
  }[];
  children: ChildStats[];
  recent_attempts: {
    id: string;
    child_id: string;
    child_name: string;
    exercise_id: string;
    score: number | null;
    feedback: string | null;
    created_at: string | null;
  }[];
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

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age =
    today.getFullYear() - birthDate.getFullYear();

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

function getAssignmentStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Completed";

    case "in_progress":
      return "In Progress";

    case "overdue":
      return "Overdue";

    case "deassigned":
      return "Deassigned";

    case "cancelled":
      return "Cancelled";

    default:
      return "Assigned";
  }
}

function getAssignmentStatusTone(
  status: string
): "mint" | "butter" | "muted" {
  switch (status) {
    case "completed":
      return "mint";

    case "in_progress":
    case "overdue":
      return "butter";

    default:
      return "muted";
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ChildrenPage() {
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);

  const [summary, setSummary] =
    useState<ParentSummary | null>(null);

  const [
    assignmentsByChild,
    setAssignmentsByChild,
  ] = useState<Record<string, ChildAssignment[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Edit state
   */
  const [editingChild, setEditingChild] =
    useState<Child | null>(null);

  const [editName, setEditName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] =
    useState("");
  const [editLanguage, setEditLanguage] =
    useState("");

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [editError, setEditError] =
    useState("");

  /*
   * Delete state
   */
  const [deletingChild, setDeletingChild] =
    useState<Child | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  useEffect(() => {
    async function loadChildrenPage() {
      const storedToken = getToken();

      if (
        typeof storedToken !== "string" ||
        storedToken.length === 0
      ) {
        router.replace("/login");
        return;
      }

      const token: string = storedToken;

      try {
        /*
         * Load children
         */
        const childrenData =
          await getChildren(token);

        const loadedChildren: Child[] =
          childrenData.children ?? [];

        setChildren(loadedChildren);

        /*
         * Load parent summary.
         */
        const summaryData =
          await getParentSummary(token);

        setSummary(summaryData);

        /*
         * Load assignments for every child.
         */
        const assignmentResults =
          await Promise.all(
            loadedChildren.map(
              async (child) => {
                try {
                  const data =
                    await getChildAssignments(
                      child.id,
                      token
                    );

                  return {
                    childId: child.id,
                    assignments:
                      data.assignments ?? [],
                  };
                } catch (assignmentError) {
                  console.error(
                    `Failed to load assignments for ${child.full_name}`,
                    assignmentError
                  );

                  return {
                    childId: child.id,
                    assignments:
                      [] as ChildAssignment[],
                  };
                }
              }
            )
          );

        const assignmentMap: Record<
          string,
          ChildAssignment[]
        > = {};

        assignmentResults.forEach(
          (result) => {
            assignmentMap[result.childId] =
              result.assignments;
          }
        );

        setAssignmentsByChild(
          assignmentMap
        );
      } catch (loadError) {
        console.error(loadError);

        setError(
          "Unable to load your children right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadChildrenPage();
  }, [router]);

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  function getChildStats(
    childId: string
  ) {
    return (
      summary?.children.find(
        (item) =>
          item.child_id === childId
      ) ?? null
    );
  }

  function getAssignmentsForChild(
    childId: string
  ): ChildAssignment[] {
    return assignmentsByChild[childId] ?? [];
  }

  function getActiveAssignments(
    childId: string
  ) {
    return getAssignmentsForChild(
      childId
    ).filter(
      (assignment) =>
        assignment.status !==
          "completed" &&
        assignment.status !==
          "deassigned" &&
        assignment.status !==
          "cancelled"
    );
  }

  function getCompletedAssignments(
    childId: string
  ) {
    return getAssignmentsForChild(
      childId
    ).filter(
      (assignment) =>
        assignment.status ===
        "completed"
    );
  }

  function getRecentAttempt(
    childId: string
  ) {
    return (
      summary?.recent_attempts.find(
        (attempt) =>
          attempt.child_id === childId
      ) ?? null
    );
  }

  /*
   * Open edit modal.
   */
  function handleOpenEdit(child: Child) {
    setEditingChild(child);
    setEditName(child.full_name);
    setEditDateOfBirth(
      child.date_of_birth?.slice(0, 10) ?? ""
    );
    setEditLanguage(
      child.language_preference
    );
    setEditError("");
  }

  /*
   * Save child changes.
   */
  async function handleSaveEdit() {
    if (!editingChild) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!editName.trim()) {
      setEditError("Please enter the child's name.");
      return;
    }

    if (!editDateOfBirth) {
      setEditError(
        "Please enter the child's date of birth."
      );
      return;
    }

    if (!editLanguage) {
      setEditError(
        "Please select a language preference."
      );
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const updatedChild = await updateChild(
        editingChild.id,
        {
          full_name: editName.trim(),
          date_of_birth: editDateOfBirth,
          language_preference: editLanguage,
        },
        token
      );

      /*
       * Update the child card immediately.
       */
      setChildren((currentChildren) =>
        currentChildren.map((child) =>
          child.id === editingChild.id
            ? {
                ...child,
                full_name:
                  updatedChild.full_name ??
                  editName.trim(),
                date_of_birth:
                  updatedChild.date_of_birth ??
                  editDateOfBirth,
                language_preference:
                  updatedChild.language_preference ??
                  editLanguage,
              }
            : child
        )
      );

      /*
       * Update summary child name as well,
       * so progress-related values remain
       * consistent without a refresh.
       */
      setSummary((currentSummary) => {
        if (!currentSummary) return currentSummary;

        return {
          ...currentSummary,
          children:
            currentSummary.children.map(
              (child) =>
                child.child_id ===
                editingChild.id
                  ? {
                      ...child,
                      name:
                        updatedChild.full_name ??
                        editName.trim(),
                    }
                  : child
            ),
        };
      });

      setEditingChild(null);
    } catch (saveError) {
      console.error(saveError);

      setEditError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update child."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  /*
   * Open delete confirmation.
   */
  function handleOpenDelete(child: Child) {
    setDeletingChild(child);
    setDeleteError("");
  }

  /*
   * Delete child.
   */
  async function handleDeleteChild() {
    if (!deletingChild) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteChild(
        deletingChild.id,
        token
      );

      /*
       * Remove child from the UI immediately.
       */
      setChildren((currentChildren) =>
        currentChildren.filter(
          (child) =>
            child.id !== deletingChild.id
        )
      );

      /*
       * Remove assignment data for that child.
       */
      setAssignmentsByChild(
        (currentAssignments) => {
          const updated = {
            ...currentAssignments,
          };

          delete updated[deletingChild.id];

          return updated;
        }
      );

      /*
       * Remove child from summary.
       */
      setSummary((currentSummary) => {
        if (!currentSummary) return currentSummary;

        return {
          ...currentSummary,
          children:
            currentSummary.children.filter(
              (child) =>
                child.child_id !==
                deletingChild.id
            ),
          children_count:
            Math.max(
              0,
              currentSummary.children_count - 1
            ),
        };
      });

      setDeletingChild(null);
    } catch (deleteErr) {
      console.error(deleteErr);

      setDeleteError(
        deleteErr instanceof Error
          ? deleteErr.message
          : "Failed to delete child."
      );
    } finally {
      setDeleting(false);
    }
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
                  item.href ===
                  "/parent/children";

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

      <main className="mx-auto max-w-7xl px-6 pb-20">
        {/* Heading */}
        <section className="flex flex-col gap-5 pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>
              Children
            </SectionLabel>

            <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              Your family
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              View each child's speech
              practice, progress,
              assignments, and recent
              pronunciation activity.
            </p>
          </div>

          <Link
            href="/parent/children/new"
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press"
          >
            + Add a child
          </Link>
        </section>

        {/* Error */}
        {error && (
          <section className="mt-8">
            <div className="rounded-2xl bg-soft p-4 text-sm font-semibold text-brand">
              {error}
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <section className="mt-10">
            <ClayCard className="rounded-[2rem] p-8">
              <div className="text-center">
                <p className="text-sm font-semibold text-muted">
                  Loading your children...
                </p>
              </div>
            </ClayCard>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          children.length === 0 && (
            <section className="mt-10">
              <ClayCard className="rounded-[2rem] p-10 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-butter text-3xl clay-sm">
                  🧒
                </div>

                <h2 className="mt-5 font-display text-2xl font-bold">
                  No children yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  Add your first child to
                  start assigning exercises
                  and tracking their speech
                  practice.
                </p>

                <Link
                  href="/parent/children/new"
                  className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press"
                >
                  + Add a child
                </Link>
              </ClayCard>
            </section>
          )}

        {/* Children */}
        {!loading &&
          !error &&
          children.length > 0 && (
            <section className="mt-10">
              <div className="grid gap-6 md:grid-cols-2">
                {children.map((child) => {
                  const age =
                    calculateAge(
                      child.date_of_birth
                    );

                  const stats =
                    getChildStats(
                      child.id
                    );

                  const assignments =
                    getAssignmentsForChild(
                      child.id
                    );

                  const activeAssignments =
                    getActiveAssignments(
                      child.id
                    );

                  const completedAssignments =
                    getCompletedAssignments(
                      child.id
                    );

                  const recentAttempt =
                    getRecentAttempt(
                      child.id
                    );

                  const averageScore =
                    stats?.average_score ??
                    0;

                  const bestScore =
                    stats?.best_score ?? 0;

                  const attempts =
                    stats?.attempts ?? 0;

                  const assignmentCount =
                    assignments.length;

                  const latestFeedback =
                    recentAttempt?.feedback;

                  return (
                    <ClayCard
                      key={child.id}
                      className="flex h-full flex-col rounded-[2rem] p-7"
                    >
                      <div className="flex-1">
                      {/* Child Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="grid size-16 place-items-center rounded-2xl bg-butter text-3xl clay-sm">
                            {child.avatar_url ||
                              "🧒"}
                          </div>

                          <div>
                            <h2 className="font-display text-2xl font-bold">
                              {child.full_name}
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                              Age {age} ·{" "}
                              {
                                child.language_preference
                              }
                            </p>
                          </div>
                        </div>

                        <Pill tone="mint">
                          Active
                        </Pill>
                      </div>

                      {/* Real Stats */}
                      <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            Sessions
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {attempts}
                          </p>

                          <p className="mt-1 text-[11px] text-muted">
                            Practice attempts
                          </p>
                        </div>

                        <div className="rounded-2xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            Assignments
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {assignmentCount}
                          </p>

                          <p className="mt-1 text-[11px] text-muted">
                            {
                              activeAssignments.length
                            }{" "}
                            active
                          </p>
                        </div>

                        <div className="rounded-2xl bg-cream p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted">
                            Best score
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {attempts > 0
                              ? `${Math.round(
                                  bestScore
                                )}%`
                              : "—"}
                          </p>

                          <p className="mt-1 text-[11px] text-muted">
                            Highest result
                          </p>
                        </div>
                      </div>

                      {/* Accuracy */}
                      <div className="mt-7">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            Average accuracy
                          </span>

                          <span className="text-xs font-bold text-brand">
                            {attempts > 0
                              ? `${Math.round(
                                  averageScore
                                )}%`
                              : "No results yet"}
                          </span>
                        </div>

                        <ProgressBar
                          value={
                            averageScore
                          }
                          tone="brand"
                          label={`${child.full_name} average accuracy`}
                          className="h-3"
                        />
                      </div>

                      {/* Assignment Status */}
                      <div className="mt-7 rounded-2xl bg-cream p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <SectionLabel tone="mint">
                              Exercises
                            </SectionLabel>

                            <p className="mt-2 font-display text-xl font-bold">
                              {activeAssignments.length >
                              0
                                ? `${activeAssignments.length} active exercise${
                                    activeAssignments.length ===
                                    1
                                      ? ""
                                      : "s"
                                  }`
                                : "No active exercises"}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted">
                              {completedAssignments.length >
                              0
                                ? `${completedAssignments.length} completed assignment${
                                    completedAssignments.length ===
                                    1
                                      ? ""
                                      : "s"
                                  }`
                                : "Assignments will appear here when a therapist assigns them."}
                            </p>
                          </div>

                          {activeAssignments.length >
                            0 && (
                            <Pill tone="butter">
                              {
                                activeAssignments.length
                              }{" "}
                              active
                            </Pill>
                          )}
                        </div>

                        {activeAssignments.length >
                          0 && (
                          <div className="mt-4 space-y-2">
                            {activeAssignments
                              .slice(0, 2)
                              .map(
                                (
                                  assignment
                                ) => (
                                  <div
                                    key={
                                      assignment.id
                                    }
                                    className="flex items-center justify-between rounded-xl bg-card p-3"
                                  >
                                    <div>
                                      <p className="text-xs font-bold">
                                        Exercise{" "}
                                        {
                                          assignment.exercise_id
                                        }
                                      </p>

                                      {assignment.due_date && (
                                        <p className="mt-1 text-[11px] text-muted">
                                          Due{" "}
                                          {formatDate(
                                            assignment.due_date
                                          )}
                                        </p>
                                      )}
                                    </div>

                                    <Pill
                                      tone={getAssignmentStatusTone(
                                        assignment.status
                                      )}
                                    >
                                      {getAssignmentStatusLabel(
                                        assignment.status
                                      )}
                                    </Pill>
                                  </div>
                                )
                              )}
                          </div>
                        )}
                      </div>

                      {/* Recent Result */}
                      <div className="mt-4 rounded-2xl bg-soft p-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">
                          Latest practice
                        </p>

                        {recentAttempt ? (
                          <>
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className="text-sm font-bold">
                                Exercise{" "}
                                {
                                  recentAttempt.exercise_id
                                }
                              </p>

                              <Pill
                                tone={
                                  (recentAttempt.score ??
                                    0) >= 80
                                    ? "mint"
                                    : "butter"
                                }
                              >
                                {
                                  recentAttempt.score
                                }
                                %
                              </Pill>
                            </div>

                            {latestFeedback && (
                              <p className="mt-2 text-xs leading-5 text-muted">
                                {
                                  latestFeedback
                                }
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-2 text-sm font-semibold text-muted">
                            No practice sessions
                            yet.
                          </p>
                        )}
                      </div>
                      </div>
                      {/* Actions */}
                      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={async () => {
                            const parentToken =
                              getToken();

                            if (!parentToken) {
                              router.push(
                                "/login"
                              );
                              return;
                            }

                            try {
                              const response =
                                await fetch(
                                  `http://127.0.0.1:8000/auth/parent/enter-child/${encodeURIComponent(
                                    child.id
                                  )}`,
                                  {
                                    method:
                                      "POST",
                                    headers: {
                                      Authorization: `Bearer ${parentToken}`,
                                    },
                                  }
                                );

                              const data =
                                await response.json();

                              if (
                                !response.ok
                              ) {
                                throw new Error(
                                  data?.detail ||
                                    "Failed to enter child practice session"
                                );
                              }

                              saveParentToken(
                                parentToken
                              );

                              saveToken(
                                data.token
                              );

                              router.push(
                                "/child"
                              );
                            } catch (error) {
                              console.error(
                                error
                              );

                              alert(
                                error instanceof
                                  Error
                                  ? error.message
                                  : "Failed to enter child practice session"
                              );
                            }
                          }}
                          className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
                        >
                          Enter
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEdit(
                              child
                            )
                          }
                          className="rounded-full bg-butter px-5 py-3 text-center text-sm font-bold text-ink clay-sm clay-press"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenDelete(
                              child
                            )
                          }
                          className="rounded-full bg-soft px-5 py-3 text-center text-sm font-bold text-brand clay-sm clay-press"
                        >
                          Delete
                        </button>
                      </div>
                    </ClayCard>
                  );
                })}
              </div>
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
      </main>

      {/* Edit Modal */}
      {editingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10">
          <ClayCard className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>
                  Edit child
                </SectionLabel>

                <h2 className="mt-2 font-display text-3xl font-bold">
                  Update {editingChild.full_name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Update the child's basic profile
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingChild(null)
                }
                className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-lg font-bold clay-sm"
              >
                ×
              </button>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="text-sm font-bold">
                  Full name
                </label>

                <input
                  value={editName}
                  onChange={(event) =>
                    setEditName(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm font-semibold outline-none clay-sm"
                  placeholder="Child's full name"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Date of birth
                </label>

                <input
                  type="date"
                  value={editDateOfBirth}
                  onChange={(event) =>
                    setEditDateOfBirth(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm font-semibold outline-none clay-sm"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Language preference
                </label>

                <select
                  value={editLanguage}
                  onChange={(event) =>
                    setEditLanguage(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 text-sm font-semibold outline-none clay-sm"
                >
                  <option value="english">
                    English
                  </option>

                  <option value="arabic">
                    Arabic
                  </option>

                  <option value="both">
                    Arabic + English
                  </option>
                </select>
              </div>

              {editError && (
                <div className="rounded-2xl bg-soft p-4 text-sm font-semibold text-brand">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingChild(null)
                  }
                  disabled={savingEdit}
                  className="flex-1 rounded-full bg-cream px-5 py-3 text-sm font-bold clay-sm clay-press disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveEdit
                  }
                  disabled={savingEdit}
                  className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press disabled:opacity-50"
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </div>
          </ClayCard>
        </div>
      )}

      {/* Delete Modal */}
      {deletingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10">
          <ClayCard className="w-full max-w-md rounded-[2rem] p-7">
            <SectionLabel>
              Delete child
            </SectionLabel>

            <h2 className="mt-2 font-display text-3xl font-bold">
              Delete {deletingChild.full_name}?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              This will remove the child's profile
              and account. This action cannot be
              undone.
            </p>

            {deleteError && (
              <div className="mt-5 rounded-2xl bg-soft p-4 text-sm font-semibold text-brand">
                {deleteError}
              </div>
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeletingChild(null)
                }
                disabled={deleting}
                className="flex-1 rounded-full bg-cream px-5 py-3 text-sm font-bold clay-sm clay-press disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteChild
                }
                disabled={deleting}
                className="flex-1 rounded-full bg-brand px-5 py-3 text-sm font-bold text-brand-foreground clay-sm clay-press disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete child"}
              </button>
            </div>
          </ClayCard>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — English speech
            practice companion.
          </p>
        </div>
      </footer>
    </div>
  );
}