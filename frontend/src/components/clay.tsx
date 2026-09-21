import type { ReactNode } from "react";

type Tone = "brand" | "butter" | "mint" | "accent2" | "muted";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand text-brand-foreground",
  butter: "bg-butter text-ink",
  mint: "bg-mint text-ink",
  accent2: "bg-accent2 text-accent-foreground",
  muted: "bg-soft text-muted",
};

type ClayCardProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

export function ClayCard({
  children,
  tone,
  className = "",
}: ClayCardProps) {
  return (
    <div
      className={`rounded-3xl p-6 clay ${
        tone ? toneClasses[tone] : "bg-card"
      } ${className}`}
    >
      {children}
    </div>
  );
}

type PillProps = {
  children: ReactNode;
  tone?: Tone;
};

export function Pill({ children, tone = "butter" }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

type ProgressBarProps = {
  value: number;
  tone?: Tone;
  label?: string;
  className?: string;
};

export function ProgressBar({
  value,
  tone = "brand",
  label,
  className = "",
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-soft ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${toneClasses[tone].split(" ")[0]}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

type SectionLabelProps = {
  children: ReactNode;
  tone?: Tone;
};

export function SectionLabel({
  children,
  tone = "brand",
}: SectionLabelProps) {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-[0.15em] ${
        tone === "muted"
          ? "text-muted"
          : tone === "butter"
            ? "text-ink/60"
            : tone === "mint"
              ? "text-ink/70"
              : `text-${tone}`
      }`}
    >
      {children}
    </span>
  );
}