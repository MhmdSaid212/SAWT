"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClayCard } from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";

type Child = {
  id: string;
  full_name: string;
  date_of_birth?: string;
  language_preference?: string;
  avatar_url?: string;
};

const CHILDREN_PER_PAGE = 6;

export default function TherapistChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const token = localStorage.getItem("sawt_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

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

        const response = await fetch(
          "http://127.0.0.1:8000/assignments/therapist/children",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load children");
        }

        const data = await response.json();

        setChildren(data.children ?? []);
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

    loadChildren();
  }, []);

  const filteredChildren = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return children;
    }

    return children.filter((child) => {
      const name = child.full_name?.toLowerCase() || "";
      const language =
        child.language_preference?.toLowerCase() || "";

      return (
        name.includes(query) ||
        language.includes(query)
      );
    });
  }, [children, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredChildren.length / CHILDREN_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedChildren = filteredChildren.slice(
    (safeCurrentPage - 1) * CHILDREN_PER_PAGE,
    safeCurrentPage * CHILDREN_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-6 py-5">
          <SawtLogo subtitle="Therapist space" />

          <nav className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <Link
              href="/therapist"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Dashboard
            </Link>

            <Link
              href="/therapist/children"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Children
            </Link>

            <Link
              href="/therapist/exercises"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Exercises
            </Link>

            <Link
              href="/therapist/phonemes"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Phonemes
            </Link>

            <Link
              href="/therapist/progress"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Progress
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("sawt_token");
              window.location.href = "/login";
            }}
            className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Therapist
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold">
            My Children
          </h1>

          <p className="mt-2 max-w-2xl text-muted">
            View children who have exercises assigned by you
            and open their practice information.
          </p>
        </div>

        {loading && (
          <ClayCard className="p-8">
            <p className="text-muted">
              Loading children...
            </p>
          </ClayCard>
        )}

        {error && (
          <ClayCard className="border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </ClayCard>
        )}

        {!loading && !error && children.length === 0 && (
          <ClayCard className="p-10 text-center">
            <h2 className="font-display text-2xl font-bold">
              No children yet
            </h2>

            <p className="mt-2 text-muted">
              Children will appear here once you assign
              exercises to them.
            </p>
          </ClayCard>
        )}

        {!loading && !error && children.length > 0 && (
          <>
            {/* Search */}
            <ClayCard className="mb-6 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search children by name or language..."
                    className="w-full rounded-2xl border border-ink/10 bg-cream px-5 py-3.5 pr-12 text-sm font-medium outline-none transition placeholder:text-muted/70 focus:border-ink/30"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted transition hover:text-ink"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="shrink-0 text-sm font-semibold text-muted">
                  {filteredChildren.length}{" "}
                  {filteredChildren.length === 1
                    ? "child"
                    : "children"}
                </div>
              </div>
            </ClayCard>

            {/* No search results */}
            {filteredChildren.length === 0 && (
              <ClayCard className="p-10 text-center">
                <h2 className="font-display text-2xl font-bold">
                  No children found
                </h2>

                <p className="mt-2 text-muted">
                  Try searching with a different name or
                  language.
                </p>

                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Clear Search
                </button>
              </ClayCard>
            )}

            {/* Children */}
            {filteredChildren.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {paginatedChildren.map((child) => (
                    <ClayCard
                      key={child.id}
                      className="p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-butter">
                          {child.avatar_url ? (
                            <img
                              src={child.avatar_url}
                              alt={`${child.full_name} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center font-display text-xl font-bold">
                              {child.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || "C"}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate font-display text-xl font-bold">
                            {child.full_name}
                          </h2>

                          <p className="text-sm text-muted">
                            {child.language_preference ||
                              "Language not set"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted">
                            Date of birth
                          </span>

                          <span className="text-right font-semibold">
                            {child.date_of_birth || "—"}
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-muted">
                            Language
                          </span>

                          <span className="text-right font-semibold">
                            {child.language_preference || "—"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/therapist/children/${child.id}`}
                        className="mt-6 block rounded-2xl bg-ink px-5 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
                      >
                        View Child
                      </Link>
                    </ClayCard>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex w-full items-center justify-center gap-2 overflow-hidden">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage(
                          safeCurrentPage - 1
                        )
                      }
                      className="shrink-0 rounded-xl bg-soft px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                    >
                      ← Previous
                    </button>

                    <div className="rounded-xl bg-card px-4 py-2 text-xs font-bold sm:text-sm">
                      {safeCurrentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      disabled={
                        safeCurrentPage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          safeCurrentPage + 1
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
          </>
        )}
      </section>
    </main>
  );
}