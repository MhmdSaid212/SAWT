"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SawtLogo } from "@/components/role-shell";
import { ClayCard, Pill, SectionLabel } from "@/components/clay";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
  updated_at: string | null;
};

type ChildProfile = {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  language_preference: string;
  avatar_url: string | null;
  therapist_id?: string | null;
};

type Therapist = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  specialization: string | null;
  license_number: string | null;
  verification_status: string;
};

type RoleFilter =
  | "all"
  | "parent"
  | "child"
  | "therapist"
  | "admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [childProfiles, setChildProfiles] = useState<
    Record<string, ChildProfile>
  >({});
  const [therapists, setTherapists] = useState<Therapist[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("all");

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [childToAssign, setChildToAssign] =
    useState<ChildProfile | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] =
    useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sawt_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const loadData = async () => {
      try {
        const usersResponse = await fetch(
          "http://127.0.0.1:8000/users/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const usersData = await usersResponse.json();

        if (!usersResponse.ok) {
          throw new Error(
            usersData?.detail || "Failed to load users"
          );
        }

        const loadedUsers: User[] =
          usersData.users || [];

        setUsers(loadedUsers);

        const therapistsResponse = await fetch(
          "http://127.0.0.1:8000/therapists/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const therapistsData =
          await therapistsResponse.json();

        if (!therapistsResponse.ok) {
          throw new Error(
            therapistsData?.detail ||
              "Failed to load therapists"
          );
        }

        setTherapists(
          therapistsData.therapists || []
        );

        const children = loadedUsers.filter(
          (user) => user.role === "child"
        );

        const childResults = await Promise.all(
          children.map(async (child) => {
            try {
              const response = await fetch(
                `http://127.0.0.1:8000/children/by-user/${child.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!response.ok) {
                return null;
              }

              const data = await response.json();

              return data.child as ChildProfile;
            } catch {
              return null;
            }
          })
        );

        const profileMap: Record<
          string,
          ChildProfile
        > = {};

        childResults.forEach((profile) => {
          if (profile) {
            profileMap[profile.user_id] = profile;
          }
        });

        setChildProfiles(profileMap);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "parent":
        return "Parent";

      case "child":
        return "Child";

      case "therapist":
        return "Therapist";

      case "admin":
        return "Administrator";

      default:
        return role;
    }
  };

  const getRoleTone = (
    role: string
  ):
    | "brand"
    | "butter"
    | "mint"
    | "accent2"
    | "muted" => {
    switch (role) {
      case "parent":
        return "brand";

      case "child":
        return "mint";

      case "therapist":
        return "butter";

      case "admin":
        return "accent2";

      default:
        return "muted";
    }
  };

  const getTherapistName = (
    therapistId: string | null | undefined
  ) => {
    if (!therapistId) {
      return null;
    }

    const therapist = therapists.find(
      (item) => item.id === therapistId
    );

    if (!therapist) {
      return "Assigned therapist";
    }

    return (
      therapist.name ||
      therapist.specialization ||
      "Assigned therapist"
    );
  };

  const getUserTherapistName = (
    userId: string
  ) => {
    const childProfile =
      childProfiles[userId];

    if (!childProfile) {
      return null;
    }

    return getTherapistName(
      childProfile.therapist_id
    );
  };

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      if (!matchesRole) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const name =
        user.name?.toLowerCase() || "";

      const email =
        user.email?.toLowerCase() || "";

      const therapistName =
        getUserTherapistName(user.id)
          ?.toLowerCase() || "";

      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        therapistName.includes(
          normalizedSearch
        )
      );
    });
  }, [
    users,
    roleFilter,
    searchQuery,
    childProfiles,
    therapists,
  ]);

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      parent: users.filter(
        (user) => user.role === "parent"
      ).length,
      child: users.filter(
        (user) => user.role === "child"
      ).length,
      therapist: users.filter(
        (user) => user.role === "therapist"
      ).length,
      admin: users.filter(
        (user) => user.role === "admin"
      ).length,
    };
  }, [users]);

  const verifiedTherapists =
    therapists.filter(
      (therapist) =>
        therapist.verification_status ===
        "verified"
    );

  const openAssignTherapist = (
    childProfile: ChildProfile
  ) => {
    setChildToAssign(childProfile);

    setSelectedTherapistId(
      childProfile.therapist_id || ""
    );

    setAssignError("");
  };

  const assignTherapist = async () => {
    if (
      !childToAssign ||
      !selectedTherapistId
    ) {
      setAssignError(
        "Please select a verified therapist."
      );
      return;
    }

    const token =
      localStorage.getItem("sawt_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setAssigning(true);
    setAssignError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/children/${childToAssign.id}/therapist`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            therapist_id:
              selectedTherapistId,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to assign therapist"
        );
      }

      setChildProfiles((current) => ({
        ...current,
        [childToAssign.user_id]: {
          ...current[
            childToAssign.user_id
          ],
          therapist_id:
            selectedTherapistId,
        },
      }));

      setChildToAssign(null);
      setSelectedTherapistId("");
      setAssignError("");
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : "Failed to assign therapist"
      );
    } finally {
      setAssigning(false);
    }
  };

  const deleteUser = async (
    userId: string
  ) => {
    const token =
      localStorage.getItem("sawt_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setDeletingId(userId);
    setDeleteError("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete user"
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) =>
            user.id !== userId
        )
      );

      setChildProfiles((current) => {
        const updated = {
          ...current,
        };

        delete updated[userId];

        return updated;
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete user"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filterButtons: {
    key: RoleFilter;
    label: string;
  }[] = [
    {
      key: "all",
      label: "All",
    },
    {
      key: "parent",
      label: "Parents",
    },
    {
      key: "child",
      label: "Children",
    },
    {
      key: "admin",
      label: "Admins",
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
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Therapists
            </Link>

            <Link
              href="/admin/users"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
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

      {/* Page */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <SectionLabel tone="brand">
          User Management
        </SectionLabel>

        <div className="mt-2">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Users
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Manage parent, child, therapist,
            and administrator accounts across
            the SAWT platform.
          </p>
        </div>

        {/* Search + Filters */}
        {!loading && !error && (
          <div className="mt-8">
            <div className="rounded-3xl bg-card p-5 clay">
              {/* Search */}
              <div>
                <label
                  htmlFor="user-search"
                  className="text-xs font-bold uppercase tracking-[0.15em] text-muted"
                >
                  Search users
                </label>

                <div className="relative mt-2">
                  <input
                    id="user-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search by name, email, or assigned therapist..."
                    className="w-full rounded-2xl border border-ink/10 bg-soft px-4 py-3.5 pr-10 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand"
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

              {/* Role Filters */}
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                  Filter by role
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {filterButtons.map(
                    (filter) => {
                      const active =
                        roleFilter ===
                        filter.key;

                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() =>
                            setRoleFilter(
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
                              roleCounts[
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
                  {filteredUsers.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-ink">
                  {users.length}
                </span>{" "}
                users
              </p>

              {(searchQuery ||
                roleFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("all");
                  }}
                  className="text-sm font-bold text-brand hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <ClayCard className="mt-8">
            <p className="text-sm text-muted">
              Loading users...
            </p>
          </ClayCard>
        )}

        {/* Error */}
        {error && (
          <ClayCard
            tone="accent2"
            className="mt-8"
          >
            <p className="font-bold">
              Unable to load users
            </p>

            <p className="mt-2 text-sm">
              {error}
            </p>
          </ClayCard>
        )}

        {/* Delete Error */}
        {deleteError && (
          <ClayCard
            tone="accent2"
            className="mt-8"
          >
            <p className="font-bold">
              Unable to delete user
            </p>

            <p className="mt-2 text-sm">
              {deleteError}
            </p>
          </ClayCard>
        )}

        {/* Users */}
        {!loading && !error && (
          <div className="mt-5 grid gap-5">
            {filteredUsers.length === 0 ? (
              <ClayCard>
                <p className="font-display text-2xl font-bold">
                  No users found
                </p>

                <p className="mt-2 text-sm text-muted">
                  Try changing your search or
                  role filter.
                </p>

                {(searchQuery ||
                  roleFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("all");
                    }}
                    className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink clay-sm clay-press"
                  >
                    Clear Filters
                  </button>
                )}
              </ClayCard>
            ) : (
              filteredUsers.map((user) => {
                const childProfile =
                  user.role === "child"
                    ? childProfiles[user.id]
                    : null;

                const therapistName =
                  childProfile
                    ? getTherapistName(
                        childProfile.therapist_id
                      )
                    : null;

                return (
                  <ClayCard
                    key={user.id}
                    className="flex flex-col gap-5 md:flex-row md:items-center"
                  >
                    {/* User Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-bold">
                          {user.name ||
                            "Unnamed User"}
                        </h2>

                        <Pill
                          tone={getRoleTone(
                            user.role
                          )}
                        >
                          {getRoleLabel(
                            user.role
                          )}
                        </Pill>
                      </div>

                      <p className="mt-2 text-sm text-muted">
                        {user.email ||
                          "No email"}
                      </p>

                      {/* Child Therapist */}
                      {user.role ===
                        "child" &&
                        childProfile && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                              Therapist
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              {therapistName ? (
                                <span className="text-sm font-semibold">
                                  {therapistName}
                                </span>
                              ) : (
                                <span className="text-sm text-muted">
                                  No therapist assigned
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  openAssignTherapist(
                                    childProfile
                                  )
                                }
                                className="rounded-full bg-brand px-4 py-2 text-xs font-bold text-ink clay-sm clay-press"
                              >
                                {therapistName
                                  ? "Change Therapist"
                                  : "Assign Therapist"}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Account ID */}
                    <div className="md:w-72 md:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                        Account ID
                      </p>

                      <p className="mt-1 break-all text-xs text-muted">
                        {user.id}
                      </p>
                    </div>

                    {/* Delete */}
                    {user.role !==
                      "admin" && (
                      <div className="flex shrink-0 justify-end md:ml-4">
                        <button
                          type="button"
                          onClick={() =>
                            setUserToDelete(
                              user
                            )
                          }
                          className="rounded-full bg-accent2 px-5 py-2.5 text-sm font-bold text-accent-foreground clay-sm clay-press"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </ClayCard>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Assign Therapist Modal */}
      {childToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-card p-7 clay">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Therapist Assignment
            </p>

            <h2 className="mt-2 font-display text-3xl font-bold">
              Assign therapist
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              Choose a verified therapist for{" "}
              <span className="font-bold text-ink">
                {childToAssign.full_name}
              </span>
              .
            </p>

            {verifiedTherapists.length ===
            0 ? (
              <div className="mt-6 rounded-2xl bg-soft p-4">
                <p className="font-bold">
                  No verified therapists
                  available
                </p>

                <p className="mt-1 text-sm text-muted">
                  A therapist must be
                  verified by an
                  administrator before
                  they can be assigned to
                  a child.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <label
                  htmlFor="therapist"
                  className="text-sm font-bold"
                >
                  Therapist
                </label>

                <select
                  id="therapist"
                  value={
                    selectedTherapistId
                  }
                  onChange={(event) =>
                    setSelectedTherapistId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-soft px-4 py-3 text-sm outline-none transition focus:border-brand"
                >
                  <option value="">
                    Select a therapist
                  </option>

                  {verifiedTherapists.map(
                    (therapist) => (
                      <option
                        key={therapist.id}
                        value={therapist.id}
                      >
                        {therapist.name ||
                          therapist.specialization ||
                          "Therapist"}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {assignError && (
              <div className="mt-4 rounded-2xl bg-accent2 p-4">
                <p className="text-sm font-bold">
                  {assignError}
                </p>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setChildToAssign(null);
                  setSelectedTherapistId(
                    ""
                  );
                  setAssignError("");
                }}
                className="rounded-full bg-soft px-5 py-2.5 text-sm font-bold clay-sm clay-press"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  assignTherapist
                }
                disabled={
                  assigning ||
                  verifiedTherapists.length ===
                    0
                }
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigning
                  ? "Assigning..."
                  : "Assign Therapist"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-card p-7 clay">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
              Delete User
            </p>

            <h2 className="mt-2 font-display text-3xl font-bold">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              You are about to delete{" "}
              <span className="font-bold text-ink">
                {userToDelete.name ||
                  "this user"}
              </span>
              . This action cannot be
              undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setUserToDelete(null)
                }
                className="rounded-full bg-soft px-5 py-2.5 text-sm font-bold clay-sm clay-press"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const userId =
                    userToDelete.id;

                  setUserToDelete(null);

                  await deleteUser(
                    userId
                  );
                }}
                disabled={
                  deletingId ===
                  userToDelete.id
                }
                className="rounded-full bg-accent2 px-5 py-2.5 text-sm font-bold text-accent-foreground clay-sm clay-press disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ===
                userToDelete.id
                  ? "Deleting..."
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

