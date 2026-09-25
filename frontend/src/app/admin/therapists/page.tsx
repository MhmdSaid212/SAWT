"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { SawtLogo } from "@/components/role-shell";

type Therapist = {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  bio: string | null;
  name: string | null;
  email: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
};

type StatusFilter = "all" | "pending" | "verified";

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<
    Therapist[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [verifyingId, setVerifyingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [therapistToDelete, setTherapistToDelete] =
    useState<Therapist | null>(null);

  useEffect(() => {
    loadTherapists();
  }, []);

  async function loadTherapists() {
    const token = getToken();

    if (!token) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/therapists/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to load therapists"
        );
      }

      setTherapists(data.therapists || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load therapists"
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyTherapist(
    therapistId: string
  ) {
    const token = getToken();

    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    setVerifyingId(therapistId);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/therapists/${therapistId}/verify`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to verify therapist"
        );
      }

      setTherapists(
        (currentTherapists) =>
          currentTherapists.map(
            (therapist) =>
              therapist.id === therapistId
                ? {
                    ...therapist,
                    verification_status:
                      "verified",
                  }
                : therapist
          )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to verify therapist"
      );
    } finally {
      setVerifyingId(null);
    }
  }

  async function deleteTherapist(
    therapistId: string
  ) {
    const token = getToken();

    if (!token) {
      setError("You are not authenticated.");
      return;
    }

    setDeletingId(therapistId);
    setError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/therapists/${therapistId}`,
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
          data.detail ||
            "Failed to delete therapist"
        );
      }

      setTherapists(
        (currentTherapists) =>
          currentTherapists.filter(
            (therapist) =>
              therapist.id !== therapistId
          )
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete therapist"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredTherapists = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return therapists.filter((therapist) => {
      const matchesStatus =
        statusFilter === "all" ||
        therapist.verification_status ===
          statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const name =
        therapist.name?.toLowerCase() || "";

      const email =
        therapist.email?.toLowerCase() || "";

      const specialization =
        therapist.specialization?.toLowerCase() ||
        "";

      const license =
        therapist.license_number?.toLowerCase() ||
        "";

      const bio =
        therapist.bio?.toLowerCase() || "";

      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        specialization.includes(
          normalizedSearch
        ) ||
        license.includes(normalizedSearch) ||
        bio.includes(normalizedSearch)
      );
    });
  }, [
    therapists,
    searchQuery,
    statusFilter,
  ]);

  const statusCounts = useMemo(() => {
    return {
      all: therapists.length,
      pending: therapists.filter(
        (therapist) =>
          therapist.verification_status ===
          "pending"
      ).length,
      verified: therapists.filter(
        (therapist) =>
          therapist.verification_status ===
          "verified"
      ).length,
    };
  }, [therapists]);

  const filterButtons: {
    key: StatusFilter;
    label: string;
  }[] = [
    {
      key: "all",
      label: "All",
    },
    {
      key: "pending",
      label: "Pending",
    },
    {
      key: "verified",
      label: "Verified",
    },
  ];

  return (
    <main className="min-h-screen bg-cream font-body text-ink">
      {/* Navbar */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <SawtLogo />

          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/therapists"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Therapists
            </Link>

            <Link
              href="/admin/users"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Users
            </Link>

            <Link
              href="/admin/activity"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Activity
            </Link>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  "sawt_token"
                );

                window.location.href =
                  "/login";
              }}
              className="ml-2 rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Therapist Management
            </p>

            <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
              Therapists
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Manage therapist accounts and
              verification.
            </p>
          </div>

          <Link
            href="/admin/therapists/new"
            className="w-fit rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground clay-sm clay-press"
          >
            + Add Therapist
          </Link>
        </div>

        {/* Search + Filters */}
        {!loading && !error && (
          <div className="mt-8">
            <div className="rounded-3xl bg-card p-5 clay">
              {/* Search */}
              <div>
                <label
                  htmlFor="therapist-search"
                  className="text-xs font-bold uppercase tracking-[0.15em] text-muted"
                >
                  Search therapists
                </label>

                <div className="relative mt-2">
                  <input
                    id="therapist-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search by name, email, specialization, or license..."
                    className="w-full rounded-2xl border border-ink/10 bg-soft px-4 py-3.5 pr-16 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearchQuery("")
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-bold text-muted hover:bg-card"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filters */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                  Filter by status
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {filterButtons.map(
                    (filter) => {
                      const active =
                        statusFilter ===
                        filter.key;

                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() =>
                            setStatusFilter(
                              filter.key
                            )
                          }
                          className={
                            active
                              ? "rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-cream clay-sm clay-press"
                              : "rounded-full bg-soft px-4 py-2.5 text-sm font-bold text-muted transition hover:bg-cream clay-sm clay-press"
                          }
                        >
                          {filter.label}

                          <span
                            className={
                              active
                                ? "ml-2 text-cream/60"
                                : "ml-2 text-muted/60"
                            }
                          >
                            {
                              statusCounts[
                                filter.key
                              ]
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-muted">
                Showing{" "}
                <span className="font-bold text-ink">
                  {
                    filteredTherapists.length
                  }
                </span>{" "}
                of{" "}
                <span className="font-bold text-ink">
                  {therapists.length}
                </span>{" "}
                therapists
              </p>

              {(searchQuery ||
                statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="text-sm font-bold text-brand hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-5">
          {loading && (
            <div className="rounded-3xl bg-card p-8 clay">
              <p className="text-sm text-muted">
                Loading therapists...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-3xl bg-card p-6 clay">
              <p className="text-sm font-semibold text-brand">
                {error}
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredTherapists.length === 0 && (
              <div className="rounded-3xl bg-card p-8 clay">
                <p className="font-display text-2xl font-bold">
                  No therapists found
                </p>

                <p className="mt-2 text-sm text-muted">
                  Try changing your search or
                  status filter.
                </p>

                {(searchQuery ||
                  statusFilter !==
                    "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter(
                        "all"
                      );
                    }}
                    className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink clay-sm clay-press"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

          {!loading &&
            !error &&
            filteredTherapists.length > 0 && (
              <div className="space-y-5">
                {filteredTherapists.map(
                  (therapist) => (
                    <div
                      key={therapist.id}
                      className="rounded-3xl bg-card p-6 clay"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        {/* Therapist Information */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-display text-2xl font-bold">
                              {therapist.name ||
                                "Unnamed Therapist"}
                            </h2>

                            <span className="w-fit rounded-full bg-butter px-4 py-2 text-xs font-bold uppercase">
                              {
                                therapist.verification_status
                              }
                            </span>
                          </div>

                          {therapist.email && (
                            <p className="mt-2 text-sm text-muted">
                              {therapist.email}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-muted">
                            {
                              therapist.specialization
                            }
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            License:{" "}
                            {
                              therapist.license_number
                            }
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                          {therapist.verification_status ===
                            "pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                verifyTherapist(
                                  therapist.id
                                )
                              }
                              disabled={
                                verifyingId ===
                                therapist.id
                              }
                              className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-brand-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {verifyingId ===
                              therapist.id
                                ? "Verifying..."
                                : "Verify"}
                            </button>
                          )}

                          <Link
                            href={`/admin/therapists/${encodeURIComponent(
                              therapist.id
                            )}/edit`}
                            className="rounded-full bg-soft px-4 py-2 text-xs font-bold text-ink clay-sm clay-press"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setTherapistToDelete(
                                therapist
                              )
                            }
                            disabled={
                              deletingId ===
                              therapist.id
                            }
                            className="rounded-full bg-accent2 px-4 py-2 text-xs font-bold text-accent-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId ===
                            therapist.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>

                      {therapist.bio && (
                        <div className="mt-5 border-t border-ink/10 pt-5">
                          <p className="text-sm leading-6 text-muted">
                            {therapist.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {therapistToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-card p-7 clay">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Delete Therapist
            </p>

            <h2 className="mt-2 font-display text-3xl font-bold">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              You are about to delete{" "}
              <span className="font-bold text-ink">
                {therapistToDelete.name ||
                  "this therapist"}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setTherapistToDelete(
                    null
                  )
                }
                className="rounded-full bg-soft px-5 py-2.5 text-sm font-bold clay-sm clay-press"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const therapistId =
                    therapistToDelete.id;

                  setTherapistToDelete(
                    null
                  );

                  await deleteTherapist(
                    therapistId
                  );
                }}
                disabled={
                  deletingId ===
                  therapistToDelete.id
                }
                className="rounded-full bg-accent2 px-5 py-2.5 text-sm font-bold text-accent-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ===
                therapistToDelete.id
                  ? "Deleting..."
                  : "Delete Therapist"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
