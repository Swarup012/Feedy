'use client';

export type ExpertRange = '7d' | '30d' | '90d';

const RANGES: { value: ExpertRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

export function RangePills({
  range,
  onChange,
}: {
  range: ExpertRange;
  onChange: (r: ExpertRange) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Date range">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={range === r.value}
          onClick={() => onChange(r.value)}
          className="seg__btn"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
