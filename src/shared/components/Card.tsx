import type { CSSProperties, ReactNode } from 'react';

type CardSize = 'sm' | 'md' | 'lg';

type CardProps = {
  children: ReactNode;
  size?: CardSize;
  ring?: boolean;
  ringColor?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

const paddings: Record<CardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({ children, size = 'md', ring = false, ringColor, className = '', style, onClick }: CardProps) {
  const base = `bg-slate-900 rounded-[1.25rem] ${paddings[size]}`;
  const ringClass = ring ? (ringColor ? `ring-1 ${ringColor}` : 'ring-1 ring-slate-800/50') : '';
  const interactive = onClick ? 'active:bg-slate-800 transition-colors cursor-pointer' : '';

  return (
    <div
      className={`${base} ${ringClass} ${interactive} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
