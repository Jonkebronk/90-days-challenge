'use client';

interface MacroBadgeProps {
  label: string;
  value: number;
  color: 'green' | 'red' | 'blue' | 'amber';
}

const colorClasses = {
  green: 'bg-emerald-500 text-white',  // K (kalorier)
  red: 'bg-rose-500 text-white',       // P (protein)
  blue: 'bg-blue-500 text-white',      // F (fett)
  amber: 'bg-amber-500 text-white'     // C (kolhydrater)
};

export function MacroBadge({ label, value, color }: MacroBadgeProps) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClasses[color]}`}>
        {label}
      </div>
      <span className="text-sm text-zinc-700">{Math.round(value)}</span>
    </div>
  );
}
