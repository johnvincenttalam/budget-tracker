import { getServiceAvatar } from '../utils/serviceLogos';

type ServiceAvatarProps = {
  name: string;
  size?: number;
  className?: string;
};

export function ServiceAvatar({ name, size = 32, className = '' }: ServiceAvatarProps) {
  const { bg, text, initial } = getServiceAvatar(name);
  const fontSize = Math.round(size * 0.4);

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: text,
        fontSize,
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
}
