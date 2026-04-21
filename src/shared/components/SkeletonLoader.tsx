type SkeletonVariant = 'text' | 'circle' | 'card';

type SkeletonLoaderProps = {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
};

export function SkeletonLoader({ variant = 'text', width, height, className = '' }: SkeletonLoaderProps) {
  const base = 'skeleton';

  if (variant === 'circle') {
    return (
      <div
        className={`${base} rounded-full ${className}`}
        style={{ width: width || '2.5rem', height: height || '2.5rem' }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`${base} rounded-[1.25rem] ${className}`}
        style={{ width: width || '100%', height: height || '6rem' }}
      />
    );
  }

  return (
    <div
      className={`${base} rounded ${className}`}
      style={{ width: width || '100%', height: height || '0.875rem' }}
    />
  );
}
