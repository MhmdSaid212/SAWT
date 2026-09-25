"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getChild } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getExercises } from "@/lib/api";
import { getChildAssignments } from "@/lib/api";

type Child = {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  language_preference: string;
  avatar_url: string | null;
};

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
export default function PracticePage() {
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"ready" | "recording" | "complete">("ready");

  useEffect(() => {
    async function loadChild() {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getChild(childId, token);
        setChild(data);
        const exerciseData = await getExercises(token);
        setExercises(exerciseData.exercises);
        const assignments = await getChildAssignments(childId, token);
        console.log("Child assignments:", JSON.stringify(assignments, null, 2));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadChild();
  }, [childId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-muted">Loading practice...</p>
        </div>
      </main>
    );
  }

  if (!child) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-semibold text-brand">
            Unable to load child.
          </p>
        </div>
      </main>
    );
  }

 async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: "audio/webm",
      });

      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);
      setRecordingStatus("complete");
    };

    recorder.start();

    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingStatus("recording");
  } catch (error) {
    console.error("Microphone access failed:", error);
  }
}

function stopRecording() {
  if (!mediaRecorder) return;

  mediaRecorder.stop();

  mediaRecorder.stream.getTracks().forEach((track) => {
    track.stop();
  });

  setIsRecording(false);
  setMediaRecorder(null);
}

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand">
          Practice
        </p>

        <h1 className="mt-2 font-display text-4xl font-bold text-ink">
          Speech Exercises
        </h1>

        <p className="mt-3 text-muted">
          Practice exercises for <span className="font-bold text-ink">{child.full_name}</span>
        </p>

        <div className="mt-10 space-y-5">
  {exercises.length === 0 ? (
    <div className="rounded-3xl bg-card p-8 clay">
      <p className="text-sm text-muted">
        No exercises are available yet.
      </p>
    </div>
  ) : (
    exercises.map((exercise) => (
      <div
        key={exercise.id}
        className="rounded-3xl bg-card p-6 clay"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
              {exercise.language}
            </p>

            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              {exercise.title}
            </h2>

            {exercise.description && (
              <p className="mt-2 text-sm text-muted">
                {exercise.description}
              </p>
            )}
          </div>

          <span className="rounded-full bg-butter px-3 py-1 text-xs font-bold text-ink">
            {exercise.difficulty_level}
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-cream p-5">
  <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
    Target Phoneme
  </p>

  <p className="mt-2 font-display text-2xl font-bold text-brand">
    {exercise.targets[0]?.phoneme_symbol ?? "Not specified"}
  </p>

  <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-muted">
    Target Word
  </p>

  <p className="mt-2 font-display text-3xl font-bold text-ink">
    {exercise.targets[0]?.target_word ?? "No target word"}
  </p>
</div>

<div className="mt-6 rounded-3xl bg-card p-6 clay">
  <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">
    Practice Recording
  </p>

  <h3 className="mt-2 font-display text-xl font-bold text-ink">
    Say the target word
  </h3>

  <p className="mt-2 text-sm text-muted">
    Record yourself saying the word, then listen back to your recording.
  </p>

  <div className="mt-5 flex flex-wrap items-center gap-3">
    {!isRecording ? (
      <button
        onClick={startRecording}
        className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
      >
        🎙️ Start Recording
      </button>
    ) : (
      <button
        onClick={stopRecording}
        className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
      >
        ⏹ Stop Recording
      </button>
    )}

    {recordingStatus === "ready" && (
      <span className="text-sm text-muted">
        Ready to record
      </span>
    )}

    {recordingStatus === "recording" && (
      <span className="text-sm font-bold text-brand">
        Recording...
      </span>
    )}

    {recordingStatus === "complete" && (
      <span className="text-sm font-bold text-accent2">
        Recording complete ✓
      </span>
    )}
  </div>

  {audioUrl && (
    <div className="mt-5 rounded-2xl bg-cream p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted">
        Your Recording
      </p>

      <audio
        controls
        src={audioUrl}
        className="w-full"
      />
    </div>
  )}
</div>
      </div>
    ))
  )}
</div>
      </div>
    </main>
  );
}