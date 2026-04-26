import type { Brand } from '../utils/walletBrands';

type LogoProps = {
  brand: Brand;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function WalletBrandLogo({ brand, size = 18, className, style }: LogoProps) {
  // Mastercard: iconic two-circle mark.
  if (brand.key === 'mastercard') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <rect width="24" height="24" rx="5" fill="#000" />
        <circle cx="9.5" cy="12" r="5" fill="#EB001B" />
        <circle cx="14.5" cy="12" r="5" fill="#F79E1B" />
        <ellipse cx="12" cy="12" rx="2.2" ry="4" fill="#FF5F00" />
      </svg>
    );
  }

  const len = brand.mark.length;
  const fontSize = len <= 1 ? 14 : len === 2 ? 10 : len === 3 ? 7.5 : 6;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <rect width="24" height="24" rx="5" fill={brand.bg} />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill={brand.fg}
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {brand.mark}
      </text>
    </svg>
  );
}
