"use client";

import Link from "next/link";
import {
  ClayCard,
  Pill,
  ProgressBar,
  SectionLabel,
} from "@/components/clay";
import { SawtLogo } from "@/components/role-shell";
import { useEffect, useState } from "react";
import { getChildren } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Child = {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  language_preference: string;
  avatar_url: string | null;
};

const fallbackChildren: Child[] = [];

function calculateAge(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

const phonemes = [
  { phoneme: "/r/", score: 88, tone: "brand" as const },
  { phoneme: "/ʃ/", score: 94, tone: "mint" as const },
  { phoneme: "/p/", score: 81, tone: "butter" as const },
  { phoneme: "/ع/", score: 72, tone: "accent2" as const },
];

export default function Home() {
    const [children, setChildren] = useState<Child[]>(fallbackChildren);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState("");

  useEffect(() => {
    async function loadChildren() {
      const token = getToken();

      if (!token) {
        setChildrenError("Please sign in to view your children.");
        setLoadingChildren(false);
        return;
      }

      try {
        const data = await getChildren(token);
        setChildren(data.children);
      } catch (error) {
        console.error(error);
        setChildrenError("Unable to load your children.");
      } finally {
        setLoadingChildren(false);
      }
    }

    loadChildren();
  }, []);
  return (

    
    <div className="min-h-screen bg-cream font-body text-ink">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <SawtLogo subtitle="Parent dashboard" />

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted md:block">
            Welcome back, Parent 👋
          </span>

          <button className="rounded-full bg-card px-5 py-2.5 text-sm font-bold clay-sm clay-press">
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Welcome */}
        <section className="pt-8">
          <Pill tone="butter">Parent space · Arabic + English</Pill>

          <h1 className="mt-5 font-display text-5xl font-bold leading-tight md:text-6xl">
            Practice.
            <br />
            <span className="text-brand">Improve.</span>
            <br />
            Grow<span className="text-accent2">.</span>
          </h1>

          <p className="mt-4 max-w-xl text-muted">
            Keep track of your children&apos;s speech practice, celebrate
            their progress, and support every sound they learn.
          </p>
        </section>

        {/* Overview */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          <ClayCard>
            <p className="text-sm font-semibold text-muted">Children</p>
            <p className="mt-2 font-display text-4xl font-bold">2</p>
            <p className="mt-1 text-xs text-muted">
              Active practice profiles
            </p>
          </ClayCard>

          <ClayCard tone="butter">
            <p className="text-sm font-semibold text-ink/60">
              This week
            </p>
            <p className="mt-2 font-display text-4xl font-bold">10</p>
            <p className="mt-1 text-xs text-ink/60">
              Practice sessions
            </p>
          </ClayCard>

          <ClayCard tone="mint">
            <p className="text-sm font-semibold text-ink/60">
              Average accuracy
            </p>
            <p className="mt-2 font-display text-4xl font-bold">82%</p>
            <p className="mt-1 text-xs text-ink/60">
              Across all exercises
            </p>
          </ClayCard>
        </section>

        {/* Children */}
        <section className="mt-14">
          <SectionLabel>My children</SectionLabel>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-bold">
              Choose a practice profile
            </h2>

            <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-foreground clay-sm clay-press">
              + Add child
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {children.map((child) => (
              <ClayCard key={child.name} className="rounded-[2rem] p-7">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid size-16 place-items-center rounded-2xl bg-butter text-3xl clay-sm">
                      {child.avatar}
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-bold">
                        {child.name}
                      </h3>
                      <p className="text-sm text-muted">
                        Age {child.age} · {child.language}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold">
                    🔥 {child.streak} days
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">
                      Speech accuracy
                    </span>
                    <span className="text-muted">
                      {child.accuracy}%
                    </span>
                  </div>

                  <ProgressBar
                    value={child.accuracy}
                    tone="brand"
                    label={`${child.name} speech accuracy`}
                    className="h-3"
                  />
                </div>

                <Link
                  href={`/parent/children/${child.name.toLowerCase()}`}
                  className="mt-6 block rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
                >
                  View practice
                </Link>
              </ClayCard>
            ))}
          </div>
        </section>

        {/* Selected child progress */}
        <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ClayCard className="rounded-[2rem] p-7">
            <SectionLabel tone="mint">
              Sara&apos;s progress
            </SectionLabel>

            <h2 className="mt-1 font-display text-3xl font-bold">
              Sounds she&apos;s practicing
            </h2>

            <div className="mt-6 space-y-5">
              {phonemes.map((item) => (
                <div key={item.phoneme}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">{item.phoneme}</span>
                    <span className="text-muted">{item.score}%</span>
                  </div>

                  <ProgressBar
                    value={item.score}
                    tone={item.tone}
                    label={`${item.phoneme} accuracy`}
                    className="h-3"
                  />
                </div>
              ))}
            </div>
          </ClayCard>

          <ClayCard tone="accent2" className="rounded-[2rem] p-7">
            <SectionLabel tone="butter">Keep going</SectionLabel>

            <h2 className="mt-2 font-display text-3xl font-bold">
              7-day streak 🔥
            </h2>

            <p className="mt-3 text-sm text-white/80">
              Sara practiced 6 out of 7 days this week. Every attempt
              helps build confidence.
            </p>

            <div className="mt-7 flex gap-2 text-3xl">
              <span className="star-pop">⭐</span>
              <span
                className="star-pop"
                style={{ animationDelay: "0.15s" }}
              >
                ⭐
              </span>
              <span
                className="star-pop"
                style={{ animationDelay: "0.3s" }}
              >
                ⭐
              </span>
              <span
                className="star-pop"
                style={{ animationDelay: "0.45s" }}
              >
                ⭐
              </span>
            </div>

            <Link
              href="/parent/practice"
              className="mt-7 inline-block rounded-full bg-card px-6 py-3 text-sm font-bold text-ink clay-sm clay-press"
            >
              View exercises →
            </Link>
          </ClayCard>
        </section>

        {/* Today's practice */}
        <section className="mt-14">
          <SectionLabel>Today&apos;s practice</SectionLabel>

          <div className="mt-2 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold">
              Ready for three sounds?
            </h2>

            <span className="hidden text-sm text-muted sm:block">
              3 exercises
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <ClayCard>
              <span className="text-3xl">🐰</span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
                English
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                Rabbit
              </h3>
              <p className="mt-1 text-sm text-muted">
                Practice the /r/ sound
              </p>

              <Link
                href="/parent/practice/rabbit"
                className="mt-5 block rounded-full bg-brand px-4 py-3 text-center text-sm font-bold text-brand-foreground clay-sm clay-press"
              >
                Open exercise
              </Link>
            </ClayCard>

            <ClayCard tone="butter">
              <span className="text-3xl">🐧</span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/50">
                English
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                Penguin
              </h3>
              <p className="mt-1 text-sm text-ink/60">
                Practice the /p/ sound
              </p>

              <Link
                href="/parent/practice/penguin"
                className="mt-5 block rounded-full bg-ink px-4 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
              >
                Open exercise
              </Link>
            </ClayCard>

            <ClayCard tone="mint">
              <span className="text-3xl">🍎</span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/50">
                Arabic
              </p>
              <h3
                className="mt-1 font-display text-2xl font-bold"
                lang="ar"
                dir="rtl"
              >
                رمان
              </h3>
              <p className="mt-1 text-sm text-ink/60">
                Practice the ر sound
              </p>

              <Link
                href="/parent/practice/rumman"
                className="mt-5 block rounded-full bg-ink px-4 py-3 text-center text-sm font-bold text-cream clay-sm clay-press"
              >
                Open exercise
              </Link>
            </ClayCard>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-14">
          <div className="rounded-[2rem] bg-soft p-6 clay-sm">
            <p className="text-center text-xs leading-relaxed text-muted">
              SAWT supports professional speech therapy. It does not replace
              a speech therapist or provide a medical diagnosis.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <p className="text-sm text-muted">
            SAWT — Arabic + English speech practice companion.
          </p>

          <div className="flex gap-5 text-sm text-muted">
            <Link href="/">Home</Link>
            <Link href="/parent">Dashboard</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}