"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SawtLogo } from "@/components/role-shell";
import { ClayCard, Pill, SectionLabel } from "@/components/clay";

type ActivityLog = {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sawt_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://127.0.0.1:8000/audit-logs/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(
            data?.detail || "Failed to load activity"
          );
        }

        return response.json();
      })
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load activity"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatEntity = (entity: string) => {
    return entity
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

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
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-cream"
            >
              Users
            </Link>

            <Link
              href="/admin/activity"
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Activity
            </Link>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("sawt_token");
                window.location.href = "/login";
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
        <SectionLabel tone="brand">
          System Activity
        </SectionLabel>

        <div className="mt-2">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Activity
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Review important system actions and administrative
            activity across the SAWT platform.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <ClayCard className="mt-8">
            <p className="text-sm text-muted">
              Loading activity...
            </p>
          </ClayCard>
        )}

        {/* Error */}
        {error && (
          <ClayCard tone="accent2" className="mt-8">
            <p className="font-bold">
              Unable to load activity
            </p>

            <p className="mt-2 text-sm">
              {error}
            </p>
          </ClayCard>
        )}

        {/* Empty */}
        {!loading && !error && logs.length === 0 && (
          <ClayCard className="mt-8">
            <p className="font-display text-2xl font-bold">
              No activity yet
            </p>

            <p className="mt-2 text-sm text-muted">
              Administrative actions will appear here once
              activity tracking is connected.
            </p>
          </ClayCard>
        )}

        {/* Activity List */}
        {!loading && !error && logs.length > 0 && (
          <div className="mt-8 grid gap-5">
            {logs.map((log) => (
              <ClayCard
                key={log.id}
                className="flex flex-col gap-5 md:flex-row md:items-center"
              >
                {/* Main information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-bold">
                      {formatAction(log.action)}
                    </h2>

                    <Pill tone="brand">
                      {formatEntity(log.entity_type)}
                    </Pill>
                  </div>

                  <p className="mt-2 text-sm text-muted">
                    Actor ID: {log.actor_user_id}
                  </p>

                  {log.entity_id && (
                    <p className="mt-1 break-all text-xs text-muted">
                      Entity ID: {log.entity_id}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="shrink-0 md:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">
                    Date
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {formatDate(log.created_at)}
                  </p>

                  {log.ip_address && (
                    <p className="mt-1 text-xs text-muted">
                      IP: {log.ip_address}
                    </p>
                  )}
                </div>
              </ClayCard>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}