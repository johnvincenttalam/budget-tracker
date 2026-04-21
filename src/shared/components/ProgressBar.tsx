type ProgressBarProps = {
  value: number; // 0–100
  color?: string;
  bgColor?: string;
  height?: string;
  className?: string;
  animated?: boolean;
};

export function ProgressBar({
  value,
  color = 'bg-emerald-500',
  bgColor = 'bg-slate-700',
  height = 'h-1.5',
  className = '',
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`${bgColor} ${height} rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${color} ${animated ? 'transition-all duration-500 ease-out' : ''}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
