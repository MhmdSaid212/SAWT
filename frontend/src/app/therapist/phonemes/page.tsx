"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClayCard, SectionLabel } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { getToken, removeToken } from "@/lib/auth";

type Phoneme = {
  id: string;
  symbol: string;
  name: string;
  language: string;
  description: string | null;
};

type PhonemeForm = {
  symbol: string;
  name: string;
  language: string;
  description: string;
};

const emptyForm: PhonemeForm = {
  symbol: "",
  name: "",
  language: "English",
  description: "",
};

export default function TherapistPhonemesPage() {
  const router = useRouter();

  const [phonemes, setPhonemes] = useState<Phoneme[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingPhoneme, setEditingPhoneme] =
    useState<Phoneme | null>(null);

  const [deletingPhoneme, setDeletingPhoneme] =
    useState<Phoneme | null>(null);

  const [phonemeForm, setPhonemeForm] =
    useState<PhonemeForm>(emptyForm);

   useEffect(() => {
    async function loadPhonemes() {
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

        const response = await fetch(
          "http://127.0.0.1:8000/phonemes/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load phonemes");
        }

        const data = await response.json();

        setPhonemes(data.phonemes || []);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load phonemes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPhonemes();
  }, [router]);




  function openCreateModal() {
    setEditingPhoneme(null);
    setPhonemeForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(phoneme: Phoneme) {
    setEditingPhoneme(phoneme);

    setPhonemeForm({
      symbol: phoneme.symbol,
      name: phoneme.name,
      language: phoneme.language,
      description: phoneme.description || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingPhoneme(null);
    setPhonemeForm(emptyForm);
  }

  function updateForm(
    field: keyof PhonemeForm,
    value: string
  ) {
    setPhonemeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }


  async function savePhoneme() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!phonemeForm.symbol.trim()) {
      setError("Please enter a phoneme symbol.");
      return;
    }

    if (!phonemeForm.name.trim()) {
      setError("Please enter a phoneme name.");
      return;
    }

    if (!phonemeForm.language.trim()) {
      setError("Please select a language.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing =
        editingPhoneme !== null;

      const url = isEditing
        ? `http://127.0.0.1:8000/phonemes/${editingPhoneme.id}`
        : "http://127.0.0.1:8000/phonemes/";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          symbol: phonemeForm.symbol.trim(),
          name: phonemeForm.name.trim(),
          language: phonemeForm.language,
          description:
            phonemeForm.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to save phoneme."
        );
      }

      const refreshedResponse =
        await fetch(
          "http://127.0.0.1:8000/phonemes/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (!refreshedResponse.ok) {
        throw new Error(
          "Phoneme was saved, but the list could not be refreshed."
        );
      }

      const refreshed =
        await refreshedResponse.json();

      setPhonemes(
        refreshed.phonemes || []
      );

      setShowModal(false);
      setEditingPhoneme(null);
      setPhonemeForm(emptyForm);

      setSuccess(
        isEditing
          ? "Phoneme updated successfully."
          : "Phoneme created successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save phoneme."
      );
    } finally {
      setSaving(false);
    }
  }




  async function deletePhoneme() {
    if (!deletingPhoneme) {
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/phonemes/${deletingPhoneme.id}`,
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
            "Unable to delete phoneme."
        );
      }

      setPhonemes((current) =>
        current.filter(
          (phoneme) =>
            phoneme.id !==
            deletingPhoneme.id
        )
      );

      setDeletingPhoneme(null);

      setSuccess(
        "Phoneme deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete phoneme."
      );
    } finally {
      setDeleting(false);
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
                router.push("/therapist/children")
              }
              className="text-muted transition hover:text-ink"
            >
              Children
            </button>

            <button
              onClick={() =>
                router.push("/therapist/exercises")
              }
              className="text-muted transition hover:text-ink"
            >
              Exercises
            </button>

            <button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
              Phonemes
            </button>

            <button
              onClick={() =>
                router.push("/therapist/progress")
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
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <SectionLabel>
              Pronunciation Library
            </SectionLabel>

            <h1 className="mt-2 text-3xl font-black">
              Therapist Phonemes
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted">
              Create and manage the phonemes used
              as pronunciation targets in exercises.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-clay transition hover:scale-[1.02]"
          >
            + Add Phoneme
          </button>
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
              Loading phonemes...
            </p>
          </ClayCard>
        ) : phonemes.length === 0 ? (
          <ClayCard>
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-muted">
                No phonemes are available yet.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-bold text-white"
              >
                Create your first phoneme
              </button>
            </div>
          </ClayCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {phonemes.map((phoneme) => (
              <ClayCard key={phoneme.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      {phoneme.language}
                    </p>

                    <h2 className="mt-2 text-4xl font-black">
                      {phoneme.symbol}
                    </h2>

                    <p className="mt-2 text-lg font-bold">
                      {phoneme.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-butter px-3 py-1 text-xs font-bold">
                    Phoneme
                  </span>
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-muted">
                  {phoneme.description ||
                    "No description available."}
                </p>

                <div className="mt-6 flex gap-2 border-t border-black/5 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(phoneme)
                    }
                    className="flex-1 rounded-full bg-soft px-4 py-2 text-sm font-bold transition hover:opacity-80"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeletingPhoneme(phoneme)
                    }
                    className="flex-1 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </ClayCard>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Pronunciation Library
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingPhoneme
                    ? "Edit Phoneme"
                    : "Add Phoneme"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="grid h-10 w-10 place-items-center rounded-full bg-soft text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Symbol
                </label>

                <input
                  value={phonemeForm.symbol}
                  onChange={(event) =>
                    updateForm(
                      "symbol",
                      event.target.value
                    )
                  }
                  placeholder="Example: /r/"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Name
                </label>

                <input
                  value={phonemeForm.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Example: R sound"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Language
                </label>

                <select
                  value={phonemeForm.language}
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
                  Description
                </label>

                <textarea
                  value={phonemeForm.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Describe the pronunciation target."
                  rows={4}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={savePhoneme}
                  disabled={saving}
                  className="rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingPhoneme
                    ? "Save Changes"
                    : "Create Phoneme"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletingPhoneme && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Pronunciation Library
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Delete Phoneme
            </h2>

            <p className="mt-4 text-sm leading-6 text-muted">
              Are you sure you want to delete{" "}
              <span className="font-bold text-ink">
                {deletingPhoneme.symbol}{" "}
                {deletingPhoneme.name}
              </span>
              ?
            </p>

            <p className="mt-3 text-xs leading-5 text-muted">
              Make sure this phoneme is not being
              used by an existing exercise.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingPhoneme(null);
                  setError("");
                }}
                disabled={deleting}
                className="rounded-2xl bg-soft px-5 py-3 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deletePhoneme}
                disabled={deleting}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Phoneme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}