"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Child = {
  id: string;
  full_name: string;
  date_of_birth?: string;
  language_preference?: string;
  avatar_url?: string;
};

type Assignment = {
  id: string;
  exercise_id: string;
  exercise_title?: string;
  assigned_at?: string;
  due_date?: string;
  status?: string;
};

type Exercise = {
  id: string;
  title: string;
  description?: string;
  language: string;
  difficulty_level: string;
};

type PracticeAttempt = {
  id: string;
  exercise_id?: string;
  assignment_id?: string;
  score?: number | null;
  transcript?: string | null;
  ai_feedback?: string | null;
  therapist_feedback?: string | null;
  therapist_feedback_updated_at?: string | null;
  recording?: {
    file_url?: string;
    duration_seconds?: number;
  } | null;
  ai_analysis?: {
    target_phoneme_id?: string | null;
    estimated_phoneme_id?: string | null;
    confidence?: number;
    pronunciation_score?: number;
    details?: string;
  }[];
  created_at?: string;
};

const ATTEMPTS_PER_PAGE = 3;

export default function TherapistChildDetailsPage() {
  const params = useParams();
  const childId = params.id as string;

  const [showAssignModal, setShowAssignModal] = useState(false);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [assignError, setAssignError] = useState("");

  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  const [editingFeedback, setEditingFeedback] =
    useState<string | null>(null);

  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [openAssignmentMenu, setOpenAssignmentMenu] =
    useState<string | null>(null);

  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);

  const [editExercise, setEditExercise] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  const [deassigningAssignment, setDeassigningAssignment] =
    useState<Assignment | null>(null);

  const [child, setChild] = useState<Child | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Each exercise has its own pagination state.
   *
   * Example:
   * {
   *   "exercise-id-1": 1,
   *   "exercise-id-2": 2
   * }
   */
  const [exerciseAttemptPages, setExerciseAttemptPages] =
    useState<Record<string, number>>({});

  const getExerciseAttempts = (exerciseId: string) => {
    return attempts
      .filter(
        (attempt) => attempt.exercise_id === exerciseId
      )
      .sort((a, b) => {
        const dateA = a.created_at
          ? new Date(a.created_at).getTime()
          : 0;

        const dateB = b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        return dateB - dateA;
      });
  };

  const getExercisePage = (exerciseId: string) => {
    return exerciseAttemptPages[exerciseId] ?? 1;
  };

  const setExercisePage = (
    exerciseId: string,
    page: number
  ) => {
    setExerciseAttemptPages((current) => ({
      ...current,
      [exerciseId]: page,
    }));
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) {
      return;
    }

    if (!editExercise) {
      setAssignError("Please select an exercise.");
      return;
    }

    if (!editDueDate) {
      setAssignError("Please select a due date.");
      return;
    }

    try {
      setSavingAssignment(true);
      setAssignError("");

      const token = localStorage.getItem("sawt_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/assignments/${editingAssignment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exercise_id: editExercise,
            due_date: editDueDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update assignment"
        );
      }

      const selectedExerciseData = exercises.find(
        (exercise) => exercise.id === editExercise
      );

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === editingAssignment.id
            ? {
                ...assignment,
                exercise_id: editExercise,
                exercise_title:
                  selectedExerciseData?.title ||
                  assignment.exercise_title,
                due_date: editDueDate,
              }
            : assignment
        )
      );

      setEditingAssignment(null);
      setEditExercise("");
      setEditDueDate("");
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : "Unable to update assignment"
      );
    } finally {
      setSavingAssignment(false);
    }
  };

  useEffect(() => {
    const loadChild = async () => {
      try {
        const token = localStorage.getItem("sawt_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        /*
         * Load exercises
         */
        const exercisesResponse = await fetch(
          "http://127.0.0.1:8000/exercises/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!exercisesResponse.ok) {
          throw new Error("Unable to load exercises");
        }

        const exercisesData =
          await exercisesResponse.json();

        setExercises(exercisesData.exercises ?? []);

        /*
         * Verify therapist
         */
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

        /*
         * Load child
         */
        const childResponse = await fetch(
          `http://127.0.0.1:8000/children/${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!childResponse.ok) {
          throw new Error("Unable to load child");
        }

        const childData = await childResponse.json();

        setChild(childData.child ?? childData);

        /*
         * Load assignments
         */
        const assignmentsResponse = await fetch(
          `http://127.0.0.1:8000/assignments/child/${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error(
            "Unable to load child assignments"
          );
        }

        const assignmentsData =
          await assignmentsResponse.json();

        const assignmentList = Array.isArray(
          assignmentsData
        )
          ? assignmentsData
          : assignmentsData.assignments ?? [];

        const assignmentsWithTitles =
          await Promise.all(
            assignmentList.map(
              async (assignment: Assignment) => {
                const exerciseResponse =
                  await fetch(
                    `http://127.0.0.1:8000/exercises/${assignment.exercise_id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                if (!exerciseResponse.ok) {
                  return assignment;
                }

                const exerciseData =
                  await exerciseResponse.json();

                return {
                  ...assignment,
                  exercise_title: exerciseData.title,
                };
              }
            )
          );

        setAssignments(assignmentsWithTitles);

        /*
         * Load practice attempts
         */
        const attemptsResponse = await fetch(
          `http://127.0.0.1:8000/attempts/therapist/child/${childId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (attemptsResponse.ok) {
          const attemptsData =
            await attemptsResponse.json();

          setAttempts(
            attemptsData.attempts ?? []
          );
        }

        setAttemptsLoading(false);
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

    loadChild();
  }, [childId]);

  const handleDeassign = async () => {
    if (!deassigningAssignment) {
      return;
    }

    try {
      const token = localStorage.getItem("sawt_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/assignments/${deassigningAssignment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to deassign exercise"
        );
      }

      setAssignments((current) =>
        current.filter(
          (item) =>
            item.id !== deassigningAssignment.id
        )
      );

      setDeassigningAssignment(null);
      setOpenAssignmentMenu(null);
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : "Unable to deassign exercise"
      );

      setDeassigningAssignment(null);
    }
  };

  const handleSaveTherapistFeedback = async (
    attemptId: string
  ) => {
    if (!feedbackText.trim()) {
      setFeedbackError(
        "Feedback cannot be empty."
      );
      return;
    }

    try {
      setSavingFeedback(true);
      setFeedbackError("");

      const token = localStorage.getItem("sawt_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/attempts/${attemptId}/therapist-feedback`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            therapist_feedback:
              feedbackText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to save feedback"
        );
      }

      setAttempts((current) =>
        current.map((attempt) =>
          attempt.id === attemptId
            ? {
                ...attempt,
                therapist_feedback:
                  data.therapist_feedback,
                therapist_feedback_updated_at:
                  data.updated_at,
              }
            : attempt
        )
      );

      setEditingFeedback(null);
      setFeedbackText("");
    } catch (err) {
      setFeedbackError(
        err instanceof Error
          ? err.message
          : "Unable to save feedback"
      );
    } finally {
      setSavingFeedback(false);
    }
  };


  function getAssignmentStatusLabel(status?: string) {
  switch (status) {
    case "completed":
      return "Completed";

    case "in_progress":
      return "In Progress";

    case "overdue":
      return "Overdue";

    case "deassigned":
      return "Deassigned";

    case "assigned":
    default:
      return "Assigned";
  }
}

function getAssignmentStatusClasses(status?: string) {
  switch (status) {
    case "completed":
      return "bg-mint text-ink";

    case "in_progress":
      return "bg-butter text-ink";

    case "overdue":
      return "bg-red-100 text-red-700";

    case "deassigned":
      return "bg-gray-200 text-gray-600";

    case "assigned":
    default:
      return "bg-soft text-ink";
  }
}

function getAssignmentStatusIcon(status?: string) {
  switch (status) {
    case "completed":
      return "✓";

    case "in_progress":
      return "◐";

    case "overdue":
      return "!";

    case "deassigned":
      return "×";

    case "assigned":
    default:
      return "•";
  }
}

  return (
    <main className="min-h-screen bg-cream text-ink">
      {/* HEADER */}
      <header className="border-b border-black/5 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/therapist"
            className="font-display text-2xl font-bold"
          >
            SAWT
          </Link>

          <nav className="flex items-center gap-6 text-sm font-semibold">
            <Link
              href="/therapist"
              className="text-muted hover:text-ink"
            >
              Dashboard
            </Link>

            <Link
              href="/therapist/children"
              className="text-ink"
            >
              Children
            </Link>

            <Link
              href="/therapist/exercises"
              className="text-muted hover:text-ink"
            >
              Exercises
            </Link>

            <Link
              href="/therapist/progress"
              className="text-muted hover:text-ink"
            >
              Progress
            </Link>

            <button
              onClick={() => {
                localStorage.removeItem(
                  "sawt_token"
                );

                window.location.href = "/login";
              }}
              className="rounded-full bg-ink px-4 py-2 text-white"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* BACK */}
        <Link
          href="/therapist/children"
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          ← Back to Children
        </Link>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-3xl bg-card p-8">
            <p className="text-muted">
              Loading child...
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-3xl bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && child && (
          <>
            {/* CHILD PROFILE */}
            <div className="mt-8 rounded-3xl bg-card p-8 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-butter font-display text-3xl font-bold">
                  {child.full_name
                    ?.charAt(0)
                    ?.toUpperCase() || "C"}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Child Profile
                  </p>

                  <h1 className="mt-1 font-display text-4xl font-bold">
                    {child.full_name}
                  </h1>

                  <p className="mt-1 text-muted">
                    Therapist view
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-soft p-5">
                  <p className="text-sm text-muted">
                    Date of birth
                  </p>

                  <p className="mt-2 font-semibold">
                    {child.date_of_birth || "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-soft p-5">
                  <p className="text-sm text-muted">
                    Language
                  </p>

                  <p className="mt-2 font-semibold">
                    {child.language_preference ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-soft p-5">
                  <p className="text-sm text-muted">
                    Assigned exercises
                  </p>

                  <p className="mt-2 font-display text-2xl font-bold">
                    {assignments.length}
                  </p>
                </div>
              </div>
            </div>

            {/* ASSIGNED EXERCISES */}
            <div className="mt-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Practice Plan
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold">
                    Assigned Exercises
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAssignError("");
                    setSelectedExercise("");
                    setDueDate("");
                    setShowAssignModal(true);
                  }}
                  className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-ink shadow-clay transition hover:scale-[1.02]"
                >
                  + Assign Exercise
                </button>
              </div>

              {attemptsLoading && (
                <div className="mb-6 rounded-2xl bg-soft p-4">
                  <p className="text-sm text-muted">
                    Loading practice history...
                  </p>
                </div>
              )}

              {assignments.length === 0 ? (
                <div className="rounded-3xl bg-card p-8 shadow-sm">
                  <p className="text-muted">
                    No exercises have been assigned to
                    this child yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {assignments.map(
                    (assignment) => {
                      const exerciseAttempts =
                        getExerciseAttempts(
                          assignment.exercise_id
                        );

                      const currentPage =
                        getExercisePage(
                          assignment.exercise_id
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

                      return (
                        <div
                          key={assignment.id}
                          className="rounded-3xl bg-card p-6 shadow-sm"
                        >
                          {/* ASSIGNMENT HEADER */}
                          <div className="relative flex items-center justify-between">
                            <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold">
                              Assignment
                            </span>

                            <div className="flex items-center gap-2">
                              <span
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${getAssignmentStatusClasses(
                                  assignment.status
                                )}`}
                              >
                                <span>
                                  {getAssignmentStatusIcon(
                                    assignment.status
                                  )}
                                </span>

                                {getAssignmentStatusLabel(
                                  assignment.status
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenAssignmentMenu(
                                    openAssignmentMenu ===
                                      assignment.id
                                      ? null
                                      : assignment.id
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-full bg-soft text-lg font-bold"
                              >
                                ⋮
                              </button>

                              {openAssignmentMenu ===
                                assignment.id && (
                                <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl bg-white p-2 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditExercise(
                                        assignment.exercise_id
                                      );

                                      setEditDueDate(
                                        assignment.due_date
                                          ? assignment.due_date.slice(
                                              0,
                                              10
                                            )
                                          : ""
                                      );

                                      setEditingAssignment(
                                        assignment
                                      );

                                      setOpenAssignmentMenu(
                                        null
                                      );
                                    }}
                                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-soft"
                                  >
                                    Reassign / Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeassigningAssignment(
                                        assignment
                                      );

                                      setOpenAssignmentMenu(
                                        null
                                      );

                                      setAssignError("");
                                    }}
                                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    Deassign
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* EXERCISE INFO */}
                          <h3 className="mt-5 font-display text-xl font-bold">
                            {assignment.exercise_title ||
                              "Exercise"}
                          </h3>

                          <p className="mt-2 text-sm text-muted">
                            Exercise ID:{" "}
                            {assignment.exercise_id}
                          </p>

                          <div className="mt-5 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted">
                                Assigned
                              </span>

                              <span className="font-semibold">
                                {assignment.assigned_at
                                  ? new Date(
                                      assignment.assigned_at
                                    ).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-muted">
                                Due date
                              </span>

                              <span className="font-semibold">
                                {assignment.due_date
                                  ? new Date(
                                      assignment.due_date
                                    ).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          {/* EXERCISE PRACTICE HISTORY */}
                          <div className="mt-7 border-t border-black/5 pt-6">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                  Practice History
                                </p>

                                <h4 className="mt-1 font-display text-lg font-bold">
                                  {
                                    exerciseAttempts.length
                                  }{" "}
                                  {exerciseAttempts.length ===
                                  1
                                    ? "attempt"
                                    : "attempts"}
                                </h4>
                              </div>

                              {exerciseAttempts.length >
                                0 && (
                                <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold">
                                  {
                                    exerciseAttempts.length
                                  }{" "}
                                  total
                                </span>
                              )}
                            </div>

                            {exerciseAttempts.length ===
                            0 ? (
                              <div className="mt-4 rounded-2xl bg-soft p-5">
                                <p className="text-sm text-muted">
                                  No practice attempts
                                  for this exercise
                                  yet.
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="mt-4 space-y-4">
                                  {visibleAttempts.map(
                                    (attempt) => (
                                      <div
                                        key={attempt.id}
                                        className="rounded-2xl bg-soft p-4"
                                      >
                                        {/* ATTEMPT HEADER */}
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                              Practice
                                              Attempt
                                            </p>

                                            <p className="mt-1 text-xs text-muted">
                                              {attempt.created_at
                                                ? new Date(
                                                    attempt.created_at
                                                  ).toLocaleString()
                                                : "—"}
                                            </p>
                                          </div>

                                          <span className="rounded-full bg-mint px-3 py-1 text-sm font-bold">
                                            {attempt.score !==
                                              null &&
                                            attempt.score !==
                                              undefined
                                              ? `${Math.round(
                                                  attempt.score
                                                )}%`
                                              : "Not analyzed"}
                                          </span>
                                        </div>

                                        {/* RECORDING */}
                                        {attempt.recording
                                          ?.file_url && (
                                          <div className="mt-4 rounded-2xl bg-card p-4">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                                              Recording
                                            </p>

                                            <audio
                                              controls
                                              src={`http://127.0.0.1:8000${attempt.recording.file_url}`}
                                              className="w-full"
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

                                        {/* AI FEEDBACK */}
                                        {attempt.ai_feedback && (
                                          <div className="mt-4 rounded-2xl bg-butter p-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                              AI Feedback
                                            </p>

                                            <p className="mt-2 text-sm font-semibold leading-6">
                                              {
                                                attempt.ai_feedback
                                              }
                                            </p>
                                          </div>
                                        )}

                                        {/* AI ANALYSIS */}
                                        {attempt.ai_analysis &&
                                          attempt
                                            .ai_analysis
                                            .length >
                                            0 && (
                                            <div className="mt-4">
                                              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                                Pronunciation
                                                Analysis
                                              </p>

                                              <div className="mt-2 space-y-2">
                                                {attempt.ai_analysis.map(
                                                  (
                                                    analysis,
                                                    index
                                                  ) => (
                                                    <div
                                                      key={
                                                        index
                                                      }
                                                      className="rounded-xl bg-card p-3"
                                                    >
                                                      <p className="text-sm font-semibold">
                                                        {
                                                          analysis.details
                                                        }
                                                      </p>

                                                      {analysis.confidence !==
                                                        undefined && (
                                                        <p className="mt-1 text-xs text-muted">
                                                          Confidence:{" "}
                                                          {Math.round(
                                                            analysis.confidence *
                                                              100
                                                          )}
                                                          %
                                                        </p>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* THERAPIST FEEDBACK */}
                                        <div className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                                Therapist
                                                Feedback
                                              </p>

                                              {attempt.therapist_feedback ? (
                                                <p className="mt-2 text-sm font-semibold leading-6">
                                                  {
                                                    attempt.therapist_feedback
                                                  }
                                                </p>
                                              ) : (
                                                <p className="mt-2 text-sm text-muted">
                                                  No therapist
                                                  feedback
                                                  added yet.
                                                </p>
                                              )}

                                              {attempt.therapist_feedback_updated_at && (
                                                <p className="mt-2 text-xs text-muted">
                                                  Updated{" "}
                                                  {new Date(
                                                    attempt.therapist_feedback_updated_at
                                                  ).toLocaleString()}
                                                </p>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingFeedback(
                                                  attempt.id
                                                );

                                                setFeedbackText(
                                                  attempt.therapist_feedback ||
                                                    ""
                                                );

                                                setFeedbackError(
                                                  ""
                                                );
                                              }}
                                              className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-cream"
                                            >
                                              {attempt.therapist_feedback
                                                ? "Edit"
                                                : "Add Feedback"}
                                            </button>
                                          </div>

                                          {editingFeedback ===
                                            attempt.id && (
                                            <div className="mt-4">
                                              <textarea
                                                value={
                                                  feedbackText
                                                }
                                                onChange={(
                                                  event
                                                ) =>
                                                  setFeedbackText(
                                                    event
                                                      .target
                                                      .value
                                                  )
                                                }
                                                rows={3}
                                                placeholder="Write feedback for the child and parent..."
                                                className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none"
                                              />

                                              {feedbackError && (
                                                <p className="mt-2 text-sm text-red-600">
                                                  {
                                                    feedbackError
                                                  }
                                                </p>
                                              )}

                                              <div className="mt-3 flex justify-end gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingFeedback(
                                                      null
                                                    );

                                                    setFeedbackText(
                                                      ""
                                                    );

                                                    setFeedbackError(
                                                      ""
                                                    );
                                                  }}
                                                  className="rounded-xl bg-soft px-4 py-2 text-xs font-bold"
                                                >
                                                  Cancel
                                                </button>

                                                <button
                                                  type="button"
                                                  disabled={
                                                    savingFeedback
                                                  }
                                                  onClick={() =>
                                                    handleSaveTherapistFeedback(
                                                      attempt.id
                                                    )
                                                  }
                                                  className="rounded-xl bg-brand px-4 py-2 text-xs font-bold disabled:opacity-50"
                                                >
                                                  {savingFeedback
                                                    ? "Saving..."
                                                    : "Save"}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>

                                {/* PAGINATION */}
                                {totalPages > 1 && (
  <div className="mt-5 flex w-full items-center justify-between gap-2 overflow-hidden">
    <button
      type="button"
      disabled={currentPage === 1}
      onClick={() =>
        setExercisePage(
          assignment.exercise_id,
          currentPage - 1
        )
      }
      className="shrink-0 rounded-xl bg-soft px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
    >
      ← Previous
    </button>

    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      {/* First page */}
      <button
        type="button"
        onClick={() =>
          setExercisePage(
            assignment.exercise_id,
            1
          )
        }
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
          currentPage === 1
            ? "bg-ink text-white"
            : "bg-soft text-ink"
        }`}
      >
        1
      </button>

      {/* Left ellipsis */}
      {currentPage > 3 && (
        <span className="shrink-0 px-1 text-xs font-bold text-muted">
          ...
        </span>
      )}

      {/* Middle pages */}
      {Array.from(
        {
          length: 3,
        },
        (_, index) =>
          currentPage - 1 + index
      )
        .filter(
          (page) =>
            page > 1 &&
            page < totalPages
        )
        .map((page) => (
          <button
            key={page}
            type="button"
            onClick={() =>
              setExercisePage(
                assignment.exercise_id,
                page
              )
            }
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
              page === currentPage
                ? "bg-ink text-white"
                : "bg-soft text-ink"
            }`}
          >
            {page}
          </button>
        ))}

      {/* Right ellipsis */}
      {currentPage < totalPages - 2 && (
        <span className="shrink-0 px-1 text-xs font-bold text-muted">
          ...
        </span>
      )}

      {/* Last page */}
      {totalPages > 1 && (
        <button
          type="button"
          onClick={() =>
            setExercisePage(
              assignment.exercise_id,
              totalPages
            )
          }
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
            currentPage === totalPages
              ? "bg-ink text-white"
              : "bg-soft text-ink"
          }`}
        >
          {totalPages}
        </button>
      )}
    </div>

    <button
      type="button"
      disabled={currentPage === totalPages}
      onClick={() =>
        setExercisePage(
          assignment.exercise_id,
          currentPage + 1
        )
      }
      className="shrink-0 rounded-xl bg-soft px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
    >
      Next →
    </button>
  </div>
)}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ASSIGN EXERCISE MODAL */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-6">
            <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Practice Plan
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold">
                    Assign Exercise
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAssignModal(false)
                  }
                  className="grid h-10 w-10 place-items-center rounded-full bg-soft text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Exercise
                  </label>

                  <select
                    value={selectedExercise}
                    onChange={(event) =>
                      setSelectedExercise(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  >
                    <option value="">
                      Select an exercise
                    </option>

                    {exercises.map(
                      (exercise) => (
                        <option
                          key={exercise.id}
                          value={exercise.id}
                        >
                          {exercise.title}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Due date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                </div>

                {assignError && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {assignError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAssignModal(false)
                    }
                    className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={assigning}
                    onClick={async () => {
                      if (!selectedExercise) {
                        setAssignError(
                          "Please select an exercise."
                        );
                        return;
                      }

                      if (!dueDate) {
                        setAssignError(
                          "Please select a due date."
                        );
                        return;
                      }

                      try {
                        setAssigning(true);
                        setAssignError("");

                        const token =
                          localStorage.getItem(
                            "sawt_token"
                          );

                        if (!token) {
                          window.location.href =
                            "/login";
                          return;
                        }

                        const response =
                          await fetch(
                            "http://127.0.0.1:8000/assignments/",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type":
                                  "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                child_id:
                                  childId,
                                exercise_id:
                                  selectedExercise,
                                due_date:
                                  dueDate,
                              }),
                            }
                          );

                        const data =
                          await response.json();

                        if (!response.ok) {
                          throw new Error(
                            data?.detail ||
                              "Unable to assign exercise"
                          );
                        }

                        setShowAssignModal(false);

                        window.location.reload();
                      } catch (err) {
                        setAssignError(
                          err instanceof Error
                            ? err.message
                            : "Unable to assign exercise"
                        );
                      } finally {
                        setAssigning(false);
                      }
                    }}
                    className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-ink disabled:opacity-50"
                  >
                    {assigning
                      ? "Assigning..."
                      : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEASSIGN MODAL */}
        {deassigningAssignment && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6">
            <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                Assignment
              </p>

              <h2 className="mt-2 font-display text-2xl font-bold">
                Deassign Exercise
              </h2>

              <p className="mt-4 text-sm leading-6 text-muted">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-ink">
                  {deassigningAssignment.exercise_title ||
                    "this exercise"}
                </span>{" "}
                from this child's practice plan?
              </p>

              {assignError && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  {assignError}
                </div>
              )}

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeassigningAssignment(null);
                    setAssignError("");
                  }}
                  className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeassign}
                  className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  Deassign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT ASSIGNMENT MODAL */}
        {editingAssignment && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6">
            <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Assignment
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold">
                    Reassign / Edit Exercise
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingAssignment(null);
                    setAssignError("");
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-soft text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Exercise
                  </label>

                  <select
                    value={editExercise}
                    onChange={(event) =>
                      setEditExercise(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  >
                    <option value="">
                      Select an exercise
                    </option>

                    {exercises.map(
                      (exercise) => (
                        <option
                          key={exercise.id}
                          value={exercise.id}
                        >
                          {exercise.title}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Due date
                  </label>

                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(event) =>
                      setEditDueDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                  />
                </div>

                {assignError && (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {assignError}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssignment(null);
                      setAssignError("");
                    }}
                    className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={savingAssignment}
                    onClick={
                      handleUpdateAssignment
                    }
                    className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-ink disabled:opacity-50"
                  >
                    {savingAssignment
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}