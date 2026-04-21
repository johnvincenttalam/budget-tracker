type BrandInfo = {
  color: string;
  textColor: string;
  initial: string;
};

const BRANDS: Record<string, BrandInfo> = {
  netflix: { color: '#E50914', textColor: '#fff', initial: 'N' },
  spotify: { color: '#1DB954', textColor: '#fff', initial: 'S' },
  youtube: { color: '#FF0000', textColor: '#fff', initial: 'Y' },
  apple: { color: '#A2AAAD', textColor: '#fff', initial: 'A' },
  amazon: { color: '#FF9900', textColor: '#000', initial: 'A' },
  disney: { color: '#113CCF', textColor: '#fff', initial: 'D' },
  hbo: { color: '#B530F7', textColor: '#fff', initial: 'H' },
  globe: { color: '#009CDE', textColor: '#fff', initial: 'G' },
  smart: { color: '#00A650', textColor: '#fff', initial: 'S' },
  pldt: { color: '#E42313', textColor: '#fff', initial: 'P' },
  converge: { color: '#0072CE', textColor: '#fff', initial: 'C' },
  meralco: { color: '#F7941D', textColor: '#fff', initial: 'M' },
  gcash: { color: '#007DFE', textColor: '#fff', initial: 'G' },
  maya: { color: '#3DDC84', textColor: '#fff', initial: 'M' },
  bpi: { color: '#C8102E', textColor: '#fff', initial: 'B' },
  bdo: { color: '#003DA5', textColor: '#fff', initial: 'B' },
  metrobank: { color: '#003B7B', textColor: '#fff', initial: 'M' },
  water: { color: '#0EA5E9', textColor: '#fff', initial: 'W' },
  internet: { color: '#6366F1', textColor: '#fff', initial: 'I' },
  electric: { color: '#EAB308', textColor: '#000', initial: 'E' },
};

export function getServiceBrand(name: string): BrandInfo | null {
  const lower = name.toLowerCase();
  for (const [key, brand] of Object.entries(BRANDS)) {
    if (lower.includes(key)) return brand;
  }
  return null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getServiceAvatar(name: string): { bg: string; text: string; initial: string } {
  const brand = getServiceBrand(name);
  if (brand) {
    return { bg: brand.color, text: brand.textColor, initial: brand.initial };
  }
  // Deterministic HSL fallback
  const hue = hashString(name) % 360;
  return {
    bg: `hsl(${hue}, 50%, 30%)`,
    text: `hsl(${hue}, 60%, 85%)`,
    initial: name.charAt(0).toUpperCase() || '?',
  };
}
