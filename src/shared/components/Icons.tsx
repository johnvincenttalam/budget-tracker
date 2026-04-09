import React, { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function defaults(size: number, props: IconProps): SVGProps<SVGSVGElement> {
  const { size: _, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  };
}

export function FoodIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M15 11h.01M11 15h.01M16 16h.01M2 16l20-7" />
      <path d="M5.71 17.11a10.96 10.96 0 0 1-.36-2.83c0-5.8 4.47-10.5 9.98-10.5 1.2 0 2.35.22 3.42.62" />
      <path d="M12 21c5.52 0 10-4.7 10-10.5 0-.34-.02-.68-.05-1.01" />
      <path d="M2 16c.16 2.85 1.25 5 2.91 5h14.18C20.85 21 22 17.42 22 12.5" />
    </svg>
  );
}

export function TransportIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-3-5H7L4 10l-2.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

export function BillsIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}

export function BabyIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M9 12h.01M15 12h.01" />
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5S14 8 12 8" />
    </svg>
  );
}

export function OtherIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

export function WalletIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}

export function ReceiptIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="m12 19-7-7 7-7M19 12H5" />
    </svg>
  );
}

export function DeleteIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6" />
    </svg>
  );
}

export function EmptyWalletIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
      <path d="m2 2 20 20" strokeWidth="2" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SearchIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function RepeatIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function EditIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  );
}

// Preset icons for custom categories
export function ShoppingIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function HealthIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

export function PetIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="8" cy="4" r="2" />
      <path d="M9 10a5 5 0 0 1 3 5c0 2-1.5 3-3 4s-2 2-2 4" />
      <path d="M15 10a5 5 0 0 0-3 5c0 2 1.5 3 3 4s2 2 2 4" />
    </svg>
  );
}

export function GymIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M6.5 6.5h11M2 12h20" />
      <path d="M4 8v8M6 7v10M18 7v10M20 8v8" />
      <path d="M6.5 17.5h11" />
    </svg>
  );
}

export function GiftIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C15 3 12 8 12 8" />
    </svg>
  );
}

export function CoffeeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M10 2v2M14 2v2M6 2v2" />
      <path d="M16 8a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z" />
      <path d="M16 8h1a3 3 0 0 1 0 6h-1" />
      <path d="M6 19h8" />
    </svg>
  );
}

export function EntertainmentIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </svg>
  );
}

export function EducationIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

export function HomeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function ClothingIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M6 2l-4 6 3 1 1-3v16h12V6l1 3 3-1-4-6" />
      <path d="M9 2a3 3 0 0 0 6 0" />
    </svg>
  );
}

export function TravelIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3s-3-.5-4.5 1L13 7l-8.2-1.8a.5.5 0 0 0-.5.2l-1.1 1.1a.5.5 0 0 0 .1.7L9 11l-5 5-.7-.7a.5.5 0 0 0-.7 0l-.6.6a.5.5 0 0 0 0 .7l3.4 3.4a.5.5 0 0 0 .7 0l.6-.6a.5.5 0 0 0 0-.7L6.4 19l5-5 3.7 5.7a.5.5 0 0 0 .7.1l1.1-1.1a.5.5 0 0 0 .2-.5z" />
    </svg>
  );
}

export function ClipboardCheckIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 2h6v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V2z" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

export function ChartPieIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...defaults(size, props)}>
      <path d="M21 12c0-4.97-4.03-9-9-9v9h9z" />
      <path d="M21 15a9 9 0 1 1-6-8.49" />
    </svg>
  );
}

// Savings-specific icons
export function TargetIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg className={`w-${size/4} h-${size/4}`} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 1 0 10 10M12 6a6 6 0 1 0 6 6m-6-2a2 2 0 1 0 2 2m2-8h4m0 0v4m0-4l-6 6" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg className={`w-${size/4} h-${size/4}`} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export function RingIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg className={`w-${size/4} h-${size/4}`} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2 4h-4l2-4zm-5 9a5 5 0 1 0 10 0 5 5 0 1 0-10 0z" />
    </svg>
  );
}

export function CarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg className={`w-${size/4} h-${size/4}`} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

export function PiggyBankIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg className={`w-${size/4} h-${size/4}`} width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

// Savings icon map
export const SAVINGS_ICON_MAP: Record<string, (props: IconProps) => React.JSX.Element> = {
  Target: TargetIcon,
  Home: HomeIcon,
  Car: CarIcon,
  Travel: TravelIcon,
  Phone: PhoneIcon,
  Education: EducationIcon,
  Health: HealthIcon,
  Shield: ShieldIcon,
  Baby: BabyIcon,
  Ring: RingIcon,
  Gift: GiftIcon,
  PiggyBank: PiggyBankIcon,
};

export function SavingsIconComponent({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Icon = SAVINGS_ICON_MAP[name] ?? TargetIcon;
  return <Icon size={size} className={className} />;
}

// Map category names to icon components
const CATEGORY_ICON_MAP: Record<string, (props: IconProps) => React.JSX.Element> = {
  Food: FoodIcon,
  Transport: TransportIcon,
  Bills: BillsIcon,
  Baby: BabyIcon,
  Other: OtherIcon,
  Shopping: ShoppingIcon,
  Health: HealthIcon,
  Pet: PetIcon,
  Gym: GymIcon,
  Gift: GiftIcon,
  Coffee: CoffeeIcon,
  Entertainment: EntertainmentIcon,
  Education: EducationIcon,
  Home: HomeIcon,
  Phone: PhoneIcon,
  Clothing: ClothingIcon,
  Travel: TravelIcon,
};

export function CategoryIcon({ name, size = 18, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = CATEGORY_ICON_MAP[name] ?? OtherIcon;
  return <Icon size={size} className={className} style={style} />;
}
