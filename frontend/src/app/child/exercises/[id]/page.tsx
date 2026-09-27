"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ClayCard, Pill, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import {
  getToken,
  removeToken,
  restoreParentSession,
} from "@/lib/auth";

type ExerciseTarget = {
  id: string;
  phoneme_id: string;
  target_word: string;
  visual_emoji: string | null;
};

type Exercise = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  difficulty_level: string;
  targets: ExerciseTarget[];
};

type ChildProfile = {
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





export default function ChildPracticePage() {
  const params = useParams();
  const router = useRouter();

  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState("");

  // Gemini TTS state
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isLoadingWordAudio, setIsLoadingWordAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sawt_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadPracticeData() {
      try {
        setLoading(true);
        setError("");

        const meResponse = await fetch(
          "http://127.0.0.1:8000/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!meResponse.ok) {
          router.replace("/login");
          return;
        }

        const meData = await meResponse.json();

        if (meData.user?.role !== "child") {
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

        setChild(childData.child);

        const assignmentsResponse = await fetch(
          `http://127.0.0.1:8000/assignments/child/${childData.child.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error("Unable to load assignments.");
        }

        const assignmentsData = await assignmentsResponse.json();

        const assignments: Assignment[] =
          assignmentsData.assignments ?? [];

        const matchingAssignment = assignments.find(
          (item) =>
            item.exercise_id === exerciseId &&
            item.status !== "cancelled"
        );

        if (!matchingAssignment) {
          throw new Error(
            "This exercise is not currently assigned to you."
          );
        }

        setAssignment(matchingAssignment);

        const exerciseResponse = await fetch(
          `http://127.0.0.1:8000/exercises/${exerciseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!exerciseResponse.ok) {
          throw new Error("Unable to load exercise.");
        }

        const exerciseData = await exerciseResponse.json();

        setExercise(exerciseData.exercise ?? exerciseData);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPracticeData();
  }, [exerciseId, router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      if (wordAudioRef.current) {
        wordAudioRef.current.pause();
        wordAudioRef.current.currentTime = 0;
        wordAudioRef.current = null;
      }
    };
  }, [audioUrl]);

  function handleSignOut() {
    localStorage.removeItem("sawt_token");
    router.replace("/login");
  }

  function handleBackToParent() {
    const restored = restoreParentSession();

    if (restored) {
      router.push("/parent/children");
      return;
    }

    removeToken();
    router.push("/login");
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  async function playTargetWord() {
    if (!exercise) {
      return;
    }

    const targetWord =
      exercise.targets?.[0]?.target_word ||
      "Practice word";

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setRecordingError("");
      setIsLoadingWordAudio(true);

      if (wordAudioRef.current) {
        wordAudioRef.current.pause();
        wordAudioRef.current.currentTime = 0;
        wordAudioRef.current = null;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/ai/tts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: targetWord,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to play the example pronunciation."
        );
      }

      const audio = new Audio(
        `data:${data.mime_type || "audio/wav"};base64,${data.audio_base64}`
      );

      wordAudioRef.current = audio;

      audio.onplay = () => {
        setIsPlayingWord(true);
      };

      audio.onended = () => {
        setIsPlayingWord(false);
      };

      audio.onerror = () => {
        setIsPlayingWord(false);

        setRecordingError(
          "We couldn't play the example pronunciation."
        );
      };

      await audio.play();
    } catch (err) {
      console.error(err);

      setIsPlayingWord(false);

      setRecordingError(
        err instanceof Error
          ? err.message
          : "Unable to play the example pronunciation."
      );
    } finally {
      setIsLoadingWordAudio(false);
    }
  }

  async function startRecording() {
    try {
      setRecordingError("");
      setAudioBlob(null);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Your browser does not support microphone recording."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      let mimeType = "";

      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType = "audio/webm;codecs=opus";
      } else if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        mimeType = "audio/webm";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        setAudioBlob(recordedBlob);

        const url = URL.createObjectURL(
          recordedBlob
        );

        setAudioUrl(url);

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
        }
      };

      recorder.start();

      setRecordingTime(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(
          (current) => current + 1
        );
      }, 1000);
    } catch (err) {
      console.error(err);

      setRecordingError(
        err instanceof Error
          ? err.message
          : "Unable to access your microphone."
      );

      setIsRecording(false);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state === "inactive"
    ) {
      return;
    }

    recorder.stop();

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function submitRecording() {
    if (
      !audioBlob ||
      !child ||
      !exercise ||
      !assignment
    ) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      setRecordingError("");
      setSubmissionMessage("");

      // 1. Create the practice attempt
      const attemptResponse = await fetch(
        "http://127.0.0.1:8000/attempts/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            child_id: child.id,
            exercise_id: exercise.id,
            assignment_id: assignment.id,
          }),
        }
      );

      const attemptData =
        await attemptResponse.json();

      if (!attemptResponse.ok) {
        throw new Error(
          attemptData.detail ||
            "Unable to create practice attempt."
        );
      }

      const attemptId =
        attemptData.attempt_id;

      // 2. Upload recorded audio
      const formData = new FormData();

      const extension =
        audioBlob.type.includes("webm")
          ? "webm"
          : "wav";

      formData.append(
        "audio",
        audioBlob,
        `practice-${Date.now()}.${extension}`
      );

      const uploadResponse = await fetch(
        `http://127.0.0.1:8000/attempts/${attemptId}/audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadData =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.detail ||
            "Unable to upload recording."
        );
      }

      setTranscript(
        uploadData.transcript ?? ""
      );

      setAiScore(
        uploadData.ai_score ?? null
      );

      setAiFeedback(
        uploadData.ai_feedback ?? ""
      );

      setSubmissionMessage(
        "Great job! SAWT finished analyzing your pronunciation."
      );
    } catch (err) {
      console.error(err);

      setRecordingError(
        err instanceof Error
          ? err.message
          : "Unable to submit your recording."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetRecording() {
    if (isRecording) {
      stopRecording();
    }

    setAudioBlob(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setRecordingTime(0);
    setRecordingError("");
    setSubmissionMessage("");
    setTranscript("");
    setAiScore(null);
    setAiFeedback("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto flex max-w-7xl items-center px-6 py-5">
            <SawtLogo subtitle="Let's practice!" />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-12">
          <ClayCard>
            <p className="text-sm text-muted">
              Loading your practice...
            </p>
          </ClayCard>
        </div>
      </main>
    );
  }

  if (
    error ||
    !exercise ||
    !child ||
    !assignment
  ) {
    return (
      <main className="min-h-screen bg-cream">
        <header className="border-b border-ink/10 bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <SawtLogo subtitle="Let's practice!" />

            <button
              type="button"
              onClick={handleBackToParent}
              className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream clay-sm clay-press"
            >
              Back to Parent
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-12">
          <ClayCard>
            <SectionLabel>Oops!</SectionLabel>

            <h1 className="mt-3 font-display text-3xl font-bold text-ink">
              We couldn't open this exercise.
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted">
              {error ||
                "This exercise is unavailable."}
            </p>

            <Link
              href="/child/exercises"
              className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-bold text-white clay-press"
            >
              Back to exercises
            </Link>
          </ClayCard>
        </div>
      </main>
    );
  }

  const targetWord =
    exercise.targets?.[0]?.target_word ||
    "Practice word";

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <SawtLogo subtitle="Let's practice!" />

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Link
              href="/child"
              className="rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-soft"
            >
              Home
            </Link>

            <Link
              href="/child/exercises"
              className="rounded-full bg-butter px-4 py-2 text-sm font-bold text-ink"
            >
              Exercises
            </Link>

            <Link
              href="/child/progress"
              className="rounded-full px-4 py-2 text-sm font-bold text-muted transition hover:bg-soft"
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

      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/child/exercises"
          className="text-sm font-bold text-muted hover:text-ink"
        >
          ← Back to exercises
        </Link>

        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>{exercise.language}</Pill>
            <Pill>
              {exercise.difficulty_level}
            </Pill>
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold text-ink">
            {exercise.title}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            {exercise.description ||
              "Practice this word and improve your pronunciation."}
          </p>
        </section>

        <ClayCard className="mt-8">
          <SectionLabel>
            Your target word
          </SectionLabel>

          {/* Target word + Gemini pronunciation */}
          <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-butter px-6 py-10 text-center">
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-accent2/50" />

            <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-mint/60" />

            <div className="absolute right-12 top-8 h-4 w-4 rounded-full bg-card" />

            <div className="absolute bottom-10 left-16 h-3 w-3 rounded-full bg-card" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
                Meet your word! 👋
              </p>

              <div
                  className={`mx-auto mt-5 grid h-28 w-28 place-items-center rounded-[2rem] bg-card text-6xl shadow-sm transition ${
                    isPlayingWord
                      ? "scale-110 animate-pulse"
                      : ""
                  }`}
                >
                  {exercise.targets?.[0]?.visual_emoji || "🌟"}
                </div>

              <p className="mt-6 font-display text-6xl font-bold tracking-tight text-ink">
                {targetWord}
              </p>

              <p className="mt-4 text-sm font-semibold text-muted">
                Listen first, then try it yourself! 👂
              </p>

              <button
                type="button"
                onClick={playTargetWord}
                disabled={isLoadingWordAudio}
                className={`mx-auto mt-6 flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-ink clay-sm clay-press transition ${
                  isPlayingWord
                    ? "bg-mint"
                    : "bg-card hover:scale-105"
                } disabled:cursor-wait disabled:opacity-70`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full ${
                    isPlayingWord
                      ? "bg-ink text-cream"
                      : "bg-butter text-ink"
                  }`}
                >
                  {isLoadingWordAudio
                    ? "…"
                    : isPlayingWord
                      ? "🔊"
                      : "▶️"}
                </span>

                <span>
                  {isLoadingWordAudio
                    ? "Getting example..."
                    : isPlayingWord
                      ? "Listen!"
                      : "Play me"}
                </span>
              </button>

              <p className="mt-3 text-xs font-semibold text-muted">
                Tap me to hear SAWT pronounce the word.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-soft p-4 text-center">
              <div className="text-2xl">👂</div>

              <p className="mt-2 text-sm font-bold text-ink">
                1. Listen
              </p>

              <p className="mt-1 text-xs font-semibold text-muted">
                Hear the example.
              </p>
            </div>

            <div className="rounded-2xl bg-soft p-4 text-center">
              <div className="text-2xl">🧠</div>

              <p className="mt-2 text-sm font-bold text-ink">
                2. Get ready
              </p>

              <p className="mt-1 text-xs font-semibold text-muted">
                Think about the sound.
              </p>
            </div>

            <div className="rounded-2xl bg-soft p-4 text-center">
              <div className="text-2xl">🎤</div>

              <p className="mt-2 text-sm font-bold text-ink">
                3. Say it
              </p>

              <p className="mt-1 text-xs font-semibold text-muted">
                Your turn!
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-soft p-5">
            <p className="text-sm font-bold text-ink">
              🎤 Your turn!
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              Record yourself saying the target word.
              SAWT will analyze your pronunciation after
              you submit it.
            </p>

            {recordingError && (
              <div className="mt-5 rounded-2xl bg-card p-4 text-sm font-semibold text-ink clay-sm">
                {recordingError}
              </div>
            )}

            <div className="mt-5 rounded-2xl bg-card p-6 text-center clay-sm">
              {isRecording ? (
                <>
                  <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-accent2 text-3xl">
                    🎙️
                  </div>

                  <p className="mt-5 font-display text-3xl font-bold text-ink">
                    {formatTime(recordingTime)}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-muted">
                    Recording... say "{targetWord}" clearly.
                  </p>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white clay-press"
                  >
                    ⏹ Stop Recording
                  </button>
                </>
              ) : audioUrl ? (
                <>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mint text-3xl">
                    ✓
                  </div>

                  <p className="mt-5 font-display text-2xl font-bold text-ink">
                    Recording ready!
                  </p>

                  <p className="mt-2 text-sm font-semibold text-muted">
                    Listen to your recording before submitting.
                  </p>

                  <audio
                    controls
                    src={audioUrl}
                    className="mx-auto mt-6 w-full max-w-md"
                  />

                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="rounded-full bg-card px-6 py-3 text-sm font-bold text-ink clay-sm clay-press"
                    >
                      🔄 Record Again
                    </button>

                    <button
                      type="button"
                      onClick={submitRecording}
                      disabled={
                        !audioBlob || isSubmitting
                      }
                      className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white clay-press disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Analyzing..."
                        : "Submit Recording"}
                    </button>
                  </div>

                  {submissionMessage && (
                    <div className="mt-4 rounded-2xl bg-mint p-4 text-sm font-semibold text-ink">
                      {submissionMessage}
                    </div>
                  )}

                  {aiFeedback && (
                    <div className="mt-4 rounded-2xl bg-butter p-5 clay-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        SAWT feedback
                      </p>

                      {aiScore !== null && (
                        <p className="mt-2 font-display text-3xl font-bold text-ink">
                          {Math.round(aiScore)}%
                        </p>
                      )}

                      <p className="mt-3 text-base font-semibold leading-7 text-ink">
                        {aiFeedback}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-butter text-3xl">
                    🎤
                  </div>

                  <p className="mt-5 font-display text-2xl font-bold text-ink">
                    Ready to practice?
                  </p>

                  <p className="mt-2 text-sm font-semibold text-muted">
                    You listened to the example.
                    Now it's your turn!
                  </p>

                  <button
                    type="button"
                    onClick={startRecording}
                    className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-bold text-white clay-press"
                  >
                    🎤 Start Recording
                  </button>
                </>
              )}
            </div>
          </div>
        </ClayCard>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Practice calmly and speak naturally. There is no rush. 💛
          </p>
        </div>
      </div>
    </main>
  );
}