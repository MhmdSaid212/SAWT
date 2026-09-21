import Link from "next/link";

type SawtLogoProps = {
  subtitle?: string;
};

export function SawtLogo({ subtitle }: SawtLogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-brand text-xl clay-sm">
        🔊
      </div>

      <div>
        <p className="font-display text-2xl font-bold leading-none text-ink">
          SAWT
        </p>

        {subtitle && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}