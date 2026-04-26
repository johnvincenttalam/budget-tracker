export type Brand = {
  key: string;
  bg: string;
  fg: string;
  mark: string;
};

// Order matters: more specific brands first. Bank issuer takes precedence over
// card network so "BPI Visa" resolves to BPI rather than Visa.
const BRANDS: Brand[] = [
  // PH banks
  { key: 'security bank', bg: '#003F87', fg: '#FFFFFF', mark: 'SB' },
  { key: 'metrobank',     bg: '#003B7B', fg: '#FFFFFF', mark: 'M' },
  { key: 'unionbank',     bg: '#F58220', fg: '#FFFFFF', mark: 'UB' },
  { key: 'landbank',      bg: '#006A4D', fg: '#FFFFFF', mark: 'LB' },
  { key: 'eastwest',      bg: '#E31837', fg: '#FFFFFF', mark: 'EW' },
  { key: 'china bank',    bg: '#D6212A', fg: '#FFFFFF', mark: 'CB' },
  { key: 'rcbc',          bg: '#0F3D7E', fg: '#FFFFFF', mark: 'RC' },
  { key: 'bpi',           bg: '#C8102E', fg: '#FFFFFF', mark: 'BPI' },
  { key: 'bdo',           bg: '#003DA5', fg: '#FFFFFF', mark: 'BDO' },
  { key: 'pnb',           bg: '#9F1B1F', fg: '#FFFFFF', mark: 'PNB' },
  // E-wallets
  { key: 'gcash',         bg: '#007DFE', fg: '#FFFFFF', mark: 'G' },
  { key: 'maya',          bg: '#3DDC84', fg: '#0B2540', mark: 'm' },
  { key: 'gotyme',        bg: '#E91D2C', fg: '#FFFFFF', mark: 'gt' },
  { key: 'shopeepay',     bg: '#EE4D2D', fg: '#FFFFFF', mark: 'S' },
  { key: 'coins.ph',      bg: '#0066FF', fg: '#FFFFFF', mark: 'c' },
  { key: 'paypal',        bg: '#003087', fg: '#FFFFFF', mark: 'P' },
  // Card networks (least specific, last)
  { key: 'mastercard',    bg: '#000000', fg: '#FFFFFF', mark: 'MC' },
  { key: 'american express', bg: '#016FD0', fg: '#FFFFFF', mark: 'A' },
  { key: 'amex',          bg: '#016FD0', fg: '#FFFFFF', mark: 'A' },
  { key: 'visa',          bg: '#1A1F71', fg: '#FFFFFF', mark: 'V' },
  { key: 'jcb',           bg: '#0E4C92', fg: '#FFFFFF', mark: 'JCB' },
  { key: 'unionpay',      bg: '#E21836', fg: '#FFFFFF', mark: 'UP' },
];

export function getWalletBrand(walletName: string | undefined | null): Brand | null {
  if (!walletName) return null;
  const lower = walletName.toLowerCase();
  for (const b of BRANDS) {
    if (lower.includes(b.key)) return b;
  }
  return null;
}
