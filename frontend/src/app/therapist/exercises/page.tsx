"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClayCard, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken, removeToken } from "@/lib/auth";

type ExerciseTarget = {
  id: string;
  phoneme_id: string;
  target_word: string;
  phoneme_symbol: string | null;
};

type Exercise = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  difficulty_level: string;
  created_by: string;
  targets: ExerciseTarget[];
};

type TherapistExercise = {
  id: string;
  therapist_id: string;
  exercise_id: string;
  customization_notes: string | null;
};

type Phoneme = {
  id: string;
  symbol: string;
  name: string;
  language: string;
};

type ExerciseForm = {
  title: string;
  description: string;
  language: string;
  difficulty_level: string;
  target_word: string;
  phoneme_id: string;
};

type GeneratedExercise = {
  title: string;
  instructions: string;
  words: string[];
};

const emptyForm: ExerciseForm = {
  title: "",
  description: "",
  language: "English",
  difficulty_level: "Beginner",
  target_word: "",
  phoneme_id: "",
};

export default function TherapistExercisesPage() {
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>(
    []
  );

  const [customized, setCustomized] = useState<
    TherapistExercise[]
  >([]);

  const [phonemes, setPhonemes] = useState<Phoneme[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedExercise, setSelectedExercise] =
    useState<Exercise | null>(null);

  const [customizationNotes, setCustomizationNotes] =
    useState("");

  const [showExerciseModal, setShowExerciseModal] =
    useState(false);

  const [editingExercise, setEditingExercise] =
    useState<Exercise | null>(null);

  const [exerciseForm, setExerciseForm] =
    useState<ExerciseForm>(emptyForm);

  const [deletingExercise, setDeletingExercise] =
    useState<Exercise | null>(null);

  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------
  // AI Exercise Generation
  // ---------------------------------------

  const [showAiModal, setShowAiModal] =
    useState(false);

  const [aiLanguage, setAiLanguage] =
    useState("English");

  const [aiDifficulty, setAiDifficulty] =
    useState("Beginner");

  const [aiPhonemeId, setAiPhonemeId] =
    useState("");

  const [aiWordCount, setAiWordCount] =
    useState("5");

  const [aiGenerating, setAiGenerating] =
    useState(false);

  const [aiSaving, setAiSaving] =
    useState(false);

  const [generatedExercise, setGeneratedExercise] =
    useState<GeneratedExercise | null>(null);

  useEffect(() => {
    async function loadExercises() {
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

        if (role !== "therapist") {
          if (role === "admin") {
            router.replace("/admin");
          } else if (role === "parent") {
            router.replace("/parent");
          } else if (role === "child") {
            router.replace("/child");
          } else {
            removeToken();
            router.replace("/login");
          }

          return;
        }

        const [
          exerciseResponse,
          customizedResponse,
          phonemeResponse,
        ] = await Promise.all([
          fetch(
            "http://127.0.0.1:8000/exercises/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch(
            "http://127.0.0.1:8000/therapist-exercises/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch(
            "http://127.0.0.1:8000/phonemes/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

        if (!exerciseResponse.ok) {
          throw new Error(
            "Unable to load exercises"
          );
        }

        if (!customizedResponse.ok) {
          throw new Error(
            "Unable to load customized exercises"
          );
        }

        if (!phonemeResponse.ok) {
          throw new Error(
            "Unable to load phonemes"
          );
        }

        const exerciseData =
          await exerciseResponse.json();

        const customizedData =
          await customizedResponse.json();

        const phonemeData =
          await phonemeResponse.json();

        setExercises(
          exerciseData.exercises || []
        );

        setCustomized(
          customizedData || []
        );

        setPhonemes(
          phonemeData.phonemes ||
            phonemeData ||
            []
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load exercises."
        );
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, [router]);

  function isCustomized(
    exerciseId: string
  ) {
    return customized.some(
      (item) =>
        item.exercise_id === exerciseId
    );
  }

  function openCustomization(
    exercise: Exercise
  ) {
    setSelectedExercise(exercise);
    setCustomizationNotes("");
    setError("");
    setSuccess("");
  }

  function closeCustomization() {
    if (saving) {
      return;
    }

    setSelectedExercise(null);
    setCustomizationNotes("");
  }

  function openCreateModal() {
    setEditingExercise(null);
    setExerciseForm(emptyForm);
    setError("");
    setSuccess("");
    setShowExerciseModal(true);
  }

  function openEditModal(
    exercise: Exercise
  ) {
    const target = exercise.targets[0];

    setEditingExercise(exercise);

    setExerciseForm({
      title: exercise.title,
      description:
        exercise.description || "",
      language: exercise.language,
      difficulty_level:
        exercise.difficulty_level,
      target_word:
        target?.target_word || "",
      phoneme_id:
        target?.phoneme_id || "",
    });

    setError("");
    setSuccess("");
    setShowExerciseModal(true);
  }

  function closeExerciseModal() {
    if (saving) {
      return;
    }

    setShowExerciseModal(false);
    setEditingExercise(null);
    setExerciseForm(emptyForm);
  }

  function updateForm(
    field: keyof ExerciseForm,
    value: string
  ) {
    setExerciseForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // ---------------------------------------
  // AI Modal
  // ---------------------------------------

  function openAiModal() {
    setAiLanguage("English");
    setAiDifficulty("Beginner");
    setAiWordCount("5");
    setAiPhonemeId("");
    setGeneratedExercise(null);
    setError("");
    setSuccess("");
    setShowAiModal(true);
  }

  function closeAiModal() {
    if (aiGenerating || aiSaving) {
      return;
    }

    setShowAiModal(false);
    setGeneratedExercise(null);
  }

  function getAiPhonemes() {
    return phonemes.filter(
      (phoneme) =>
        phoneme.language.toLowerCase() ===
        aiLanguage.toLowerCase()
    );
  }

  function getSelectedAiPhoneme() {
    return phonemes.find(
      (phoneme) =>
        phoneme.id === aiPhonemeId
    );
  }

  async function generateAiExercise() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    const selectedPhoneme =
      getSelectedAiPhoneme();

    if (!selectedPhoneme) {
      setError(
        "Please select a target phoneme."
      );
      return;
    }

    setAiGenerating(true);
    setError("");
    setSuccess("");
    setGeneratedExercise(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/ai-exercises/generate",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            language: aiLanguage,
            phoneme: selectedPhoneme.symbol,
            difficulty: aiDifficulty,
            word_count: Number(aiWordCount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to generate exercise"
        );
      }

      if (!data?.exercise) {
        throw new Error(
          "AI did not return a valid exercise."
        );
      }

      setGeneratedExercise({
        title:
          data.exercise.title ||
          "AI Generated Exercise",

        instructions:
          data.exercise.instructions ||
          "Practice each word carefully.",

        words:
          Array.isArray(data.exercise.words)
            ? data.exercise.words
            : [],
      });
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate exercise."
      );
    } finally {
      setAiGenerating(false);
    }
  }

  async function saveAiExercise() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!generatedExercise) {
      return;
    }

    const selectedPhoneme =
      getSelectedAiPhoneme();

    if (!selectedPhoneme) {
      setError(
        "Please select a target phoneme."
      );
      return;
    }

    if (
      generatedExercise.words.length === 0
    ) {
      setError(
        "The generated exercise has no target words."
      );
      return;
    }

    setAiSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/exercises/",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title:
              generatedExercise.title.trim(),

            description:
              generatedExercise.instructions.trim(),

            language: aiLanguage,

            difficulty_level:
              aiDifficulty,

            targets:
              generatedExercise.words.map(
                (word) => ({
                  phoneme_id:
                    selectedPhoneme.id,

                  target_word:
                    word.trim(),
                })
              ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to save AI exercise"
        );
      }

      const exercisesResponse =
        await fetch(
          "http://127.0.0.1:8000/exercises/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (!exercisesResponse.ok) {
        throw new Error(
          "Exercise was saved, but the list could not be refreshed."
        );
      }

      const refreshed =
        await exercisesResponse.json();

      setExercises(
        refreshed.exercises || []
      );

      setShowAiModal(false);
      setGeneratedExercise(null);

      setSuccess(
        "AI-generated exercise saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save AI exercise."
      );
    } finally {
      setAiSaving(false);
    }
  }

  async function saveExercise() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!exerciseForm.title.trim()) {
      setError(
        "Please enter an exercise title."
      );
      return;
    }

    if (!exerciseForm.description.trim()) {
      setError(
        "Please enter an exercise description."
      );
      return;
    }

    if (!exerciseForm.target_word.trim()) {
      setError(
        "Please enter a target word."
      );
      return;
    }

    if (!exerciseForm.phoneme_id) {
      setError(
        "Please select a target phoneme."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing =
        editingExercise !== null;

      const url = isEditing
        ? `http://127.0.0.1:8000/exercises/${editingExercise.id}`
        : "http://127.0.0.1:8000/exercises/";

      const response = await fetch(
        url,
        {
          method: isEditing
            ? "PATCH"
            : "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title:
              exerciseForm.title.trim(),

            description:
              exerciseForm.description.trim(),

            language:
              exerciseForm.language,

            difficulty_level:
              exerciseForm.difficulty_level,

            targets: [
              {
                phoneme_id:
                  exerciseForm.phoneme_id,

                target_word:
                  exerciseForm.target_word.trim(),
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to save exercise"
        );
      }

      const exercisesResponse =
        await fetch(
          "http://127.0.0.1:8000/exercises/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (!exercisesResponse.ok) {
        throw new Error(
          "Exercise was saved, but the list could not be refreshed."
        );
      }

      const refreshed =
        await exercisesResponse.json();

      setExercises(
        refreshed.exercises || []
      );

      setShowExerciseModal(false);
      setEditingExercise(null);
      setExerciseForm(emptyForm);

      setSuccess(
        isEditing
          ? "Exercise updated successfully."
          : "Exercise created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save exercise."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExercise() {
    if (!deletingExercise) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/exercises/${deletingExercise.id}`,
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
            "Unable to delete exercise"
        );
      }

      setExercises((current) =>
        current.filter(
          (exercise) =>
            exercise.id !==
            deletingExercise.id
        )
      );

      setDeletingExercise(null);

      setSuccess(
        "Exercise deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete exercise."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function saveCustomization() {
    if (!selectedExercise) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/therapist-exercises/",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            exercise_id:
              selectedExercise.id,

            customization_notes:
              customizationNotes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to customize this exercise"
        );
      }

      setCustomized((current) => [
        ...current,
        {
          id:
            data.therapist_exercise_id,
          therapist_id: "",
          exercise_id:
            selectedExercise.id,
          customization_notes:
            customizationNotes.trim(),
        },
      ]);

      setSuccess(
        "Exercise customized successfully."
      );

      setSelectedExercise(null);
      setCustomizationNotes("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to customize exercise."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    removeToken();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-black/5 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <SawtLogo />

          <nav className="flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() =>
                router.push("/therapist")
              }
              className="text-muted transition hover:text-ink"
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                router.push(
                  "/therapist/children"
                )
              }
              className="text-muted transition hover:text-ink"
            >
              Children
            </button>

            <button
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Exercises
            </button>

            <button
              onClick={() =>
                router.push(
                  "/therapist/phonemes"
                )
              }
              className="text-muted transition hover:text-ink"
            >
              Phonemes
            </button>

            <button
              onClick={() =>
                router.push(
                  "/therapist/progress"
                )
              }
              className="text-muted transition hover:text-ink"
            >
              Progress
            </button>

            <button
              onClick={handleSignOut}
              className="rounded-full bg-ink px-4 py-2 text-white transition hover:opacity-90"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel>
              Exercise Library
            </SectionLabel>

            <h1 className="mt-2 text-3xl font-black">
              Therapist Exercises
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted">
              Create, manage, and customize
              pronunciation exercises for your
              children.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openAiModal}
              className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-clay transition hover:scale-[1.02]"
            >
              ✨ Generate with AI
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-clay transition hover:scale-[1.02]"
            >
              + Add Exercise
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-mint px-5 py-4 text-sm font-semibold text-ink">
            {success}
          </div>
        )}

        {loading ? (
          <ClayCard>
            <p className="text-sm font-semibold text-muted">
              Loading exercises...
            </p>
          </ClayCard>
        ) : exercises.length === 0 ? (
          <ClayCard>
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-muted">
                No exercises are available yet.
              </p>

              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={openAiModal}
                  className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-white"
                >
                  ✨ Generate with AI
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white"
                >
                  Create manually
                </button>
              </div>
            </div>
          </ClayCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {exercises.map((exercise) => {
              const customizedExercise =
                customized.find(
                  (item) =>
                    item.exercise_id ===
                    exercise.id
                );

              return (
                <ClayCard key={exercise.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        {exercise.language}
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        {exercise.title}
                      </h2>

                      <p className="mt-2 text-sm text-muted">
                        {exercise.description ||
                          "No description available."}
                      </p>
                    </div>

                    <span className="rounded-full bg-butter px-3 py-1 text-xs font-bold">
                      {exercise.difficulty_level}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Target
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {exercise.targets.length >
                      0 ? (
                        exercise.targets.map(
                          (target) => (
                            <span
                              key={target.id}
                              className="rounded-full bg-soft px-3 py-2 text-sm font-bold"
                            >
                              {target.target_word}

                              {target.phoneme_symbol
                                ? ` · ${target.phoneme_symbol}`
                                : ""}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-muted">
                          No targets defined.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 border-t border-black/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {customizedExercise ? (
                        <span className="rounded-full bg-mint px-3 py-2 text-xs font-bold">
                          Customized
                        </span>
                      ) : (
                        <span className="rounded-full bg-soft px-3 py-2 text-xs font-bold text-muted">
                          Standard exercise
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isCustomized(
                        exercise.id
                      ) && (
                        <button
                          onClick={() =>
                            openCustomization(
                              exercise
                            )
                          }
                          className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          Customize
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            exercise
                          )
                        }
                        className="rounded-full bg-soft px-4 py-2 text-sm font-bold"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeletingExercise(
                            exercise
                          )
                        }
                        className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </ClayCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------------------------------
          AI GENERATION MODAL
      --------------------------------------- */}

      {showAiModal && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 px-6 py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  AI Assistant
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  ✨ Generate Exercise
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Let SAWT create a pronunciation exercise
                  draft for you. Review it before saving.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAiModal}
                disabled={
                  aiGenerating || aiSaving
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Language
                  </label>

                  <select
                    value={aiLanguage}
                    onChange={(event) => {
                      setAiLanguage(
                        event.target.value
                      );
                      setAiPhonemeId("");
                      setGeneratedExercise(null);
                    }}
                    disabled={aiGenerating}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="English">
                      English
                    </option>

                    <option value="Arabic">
                      Arabic
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Difficulty
                  </label>

                  <select
                    value={aiDifficulty}
                    onChange={(event) =>
                      setAiDifficulty(
                        event.target.value
                      )
                    }
                    disabled={aiGenerating}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="Beginner">
                      Beginner
                    </option>

                    <option value="Intermediate">
                      Intermediate
                    </option>

                    <option value="Advanced">
                      Advanced
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Target Phoneme
                  </label>

                  <select
                    value={aiPhonemeId}
                    onChange={(event) =>
                      setAiPhonemeId(
                        event.target.value
                      )
                    }
                    disabled={aiGenerating}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="">
                      Select phoneme
                    </option>

                    {getAiPhonemes().map(
                      (phoneme) => (
                        <option
                          key={phoneme.id}
                          value={phoneme.id}
                        >
                          {phoneme.symbol} —{" "}
                          {phoneme.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Number of Words
                  </label>

                  <select
                    value={aiWordCount}
                    onChange={(event) =>
                      setAiWordCount(
                        event.target.value
                      )
                    }
                    disabled={aiGenerating}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="3">
                      3 words
                    </option>

                    <option value="5">
                      5 words
                    </option>

                    <option value="7">
                      7 words
                    </option>

                    <option value="10">
                      10 words
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl bg-soft p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-butter text-lg">
                    ✨
                  </div>

                  <div>
                    <p className="font-bold">
                      Therapist review
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted">
                      AI creates a draft only. You can
                      review it before saving it to the
                      exercise library.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {generatedExercise && (
                <div className="rounded-3xl border border-black/5 bg-cream p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">
                        Generated Draft
                      </p>

                      <h3 className="mt-1 text-xl font-black">
                        {generatedExercise.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold">
                      {aiDifficulty}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted">
                    {generatedExercise.instructions}
                  </p>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Target Words
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {generatedExercise.words.map(
                        (word, index) => (
                          <span
                            key={`${word}-${index}`}
                            className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm"
                          >
                            {word}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAiModal}
                  disabled={
                    aiGenerating || aiSaving
                  }
                  className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>

                {generatedExercise && (
                  <button
                    type="button"
                    onClick={
                      generateAiExercise
                    }
                    disabled={aiGenerating || aiSaving}
                    className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold disabled:opacity-50"
                  >
                    {aiGenerating
                      ? "Generating..."
                      : "↻ Regenerate"}
                  </button>
                )}

                {!generatedExercise ? (
                  <button
                    type="button"
                    onClick={
                      generateAiExercise
                    }
                    disabled={aiGenerating}
                    className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {aiGenerating
                      ? "Generating..."
                      : "✨ Generate Exercise"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveAiExercise}
                    disabled={
                      aiSaving ||
                      generatedExercise.words
                        .length === 0
                    }
                    className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {aiSaving
                      ? "Saving..."
                      : "Save AI Exercise"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------
          MANUAL EXERCISE MODAL
      --------------------------------------- */}

      {showExerciseModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Exercise Library
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingExercise
                    ? "Edit Exercise"
                    : "Add Exercise"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeExerciseModal
                }
                disabled={saving}
                className="grid h-10 w-10 place-items-center rounded-full bg-soft text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Title
                </label>

                <input
                  value={exerciseForm.title}
                  onChange={(event) =>
                    updateForm(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="Example: Practice the R Sound"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <textarea
                  value={
                    exerciseForm.description
                  }
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe what the child should practice."
                  rows={4}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Language
                  </label>

                  <select
                    value={
                      exerciseForm.language
                    }
                    onChange={(event) =>
                      updateForm(
                        "language",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="English">
                      English
                    </option>

                    <option value="Arabic">
                      Arabic
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Difficulty
                  </label>

                  <select
                    value={
                      exerciseForm.difficulty_level
                    }
                    onChange={(event) =>
                      updateForm(
                        "difficulty_level",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    <option value="Beginner">
                      Beginner
                    </option>

                    <option value="Intermediate">
                      Intermediate
                    </option>

                    <option value="Advanced">
                      Advanced
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl bg-soft p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Pronunciation Target
                </p>

                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Target Word
                    </label>

                    <input
                      value={
                        exerciseForm.target_word
                      }
                      onChange={(event) =>
                        updateForm(
                          "target_word",
                          event.target.value
                        )
                      }
                      placeholder={
                        exerciseForm.language ===
                        "Arabic"
                          ? "مثال: رمان"
                          : "Example: rabbit"
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Target Phoneme
                    </label>

                    <select
                      value={
                        exerciseForm.phoneme_id
                      }
                      onChange={(event) =>
                        updateForm(
                          "phoneme_id",
                          event.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">
                        Select phoneme
                      </option>

                      {phonemes
                        .filter(
                          (phoneme) =>
                            phoneme.language
                              .toLowerCase() ===
                            exerciseForm.language.toLowerCase()
                        )
                        .map(
                          (phoneme) => (
                            <option
                              key={phoneme.id}
                              value={
                                phoneme.id
                              }
                            >
                              {phoneme.symbol} —{" "}
                              {phoneme.name}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeExerciseModal
                  }
                  disabled={saving}
                  className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveExercise}
                  disabled={saving}
                  className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingExercise
                    ? "Save Changes"
                    : "Create Exercise"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------
          CUSTOMIZATION MODAL
      --------------------------------------- */}

      {selectedExercise && (
        <div className="fixed inset-0 z-[55] grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-3xl bg-card p-7 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Customize Exercise
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {selectedExercise.title}
            </h2>

            <p className="mt-2 text-sm text-muted">
              Add notes describing how you want to
              adapt this exercise for your therapy
              sessions.
            </p>

            <textarea
              value={customizationNotes}
              onChange={(event) =>
                setCustomizationNotes(
                  event.target.value
                )
              }
              placeholder="Example: Focus on the initial /r/ sound..."
              rows={5}
              className="mt-5 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={
                  closeCustomization
                }
                disabled={saving}
                className="rounded-full bg-soft px-5 py-2 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveCustomization
                }
                disabled={saving}
                className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Customization"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------
          DELETE MODAL
      --------------------------------------- */}

      {deletingExercise && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Exercise Library
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Delete Exercise
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted">
              Are you sure you want to delete{" "}
              <span className="font-bold text-ink">
                {deletingExercise.title}
              </span>
              ?
            </p>

            <p className="mt-3 text-xs leading-5 text-muted">
              This will also remove its
              pronunciation targets.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingExercise(null);
                  setError("");
                }}
                disabled={deleting}
                className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  deleteExercise
                }
                disabled={deleting}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Exercise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}