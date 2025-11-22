import * as React from 'react';
import { AvatarProps } from '@radix-ui/react-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps extends AvatarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  };
  fontSize?: string | number;
}

const colorFamilies = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'neutral',
  'zinc',
  'gray',
  'slate',
  'stone',
];

const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900];

// Generate all Tailwind classes
export const tailwindColors = colorFamilies.flatMap((color) =>
  shades.map((shade) => `bg-${color}-${shade}`),
);

const getInitials = (fullName?: string) => {
  if (!fullName) {
    return '';
  }

  const names = fullName.trim().split(' ');
  const firstName = names[0]?.charAt(0).toUpperCase() ?? '';
  const lastName = names.length > 1 ? names[names.length - 1].charAt(0).toUpperCase() : '';
  return `${firstName}${lastName}`;
};

const getColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % tailwindColors.length;
  return tailwindColors[index];
};

export function UserAvatar({ user, fontSize, ...props }: UserAvatarProps) {
  const name = user?.name ?? '';

  const { initials, bgColor } = React.useMemo(() => {
    const calculatedInitials = getInitials(name);
    const calculatedBgColor = getColorFromName(name);
    return { initials: calculatedInitials, bgColor: calculatedBgColor };
  }, [name]);

  if (!user) {
    return <Avatar {...props} />;
  }

  return (
    <Avatar {...props}>
      <AvatarImage
        src={user.image ?? undefined}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <AvatarFallback
        className={cn(bgColor, 'text-white font-medium')}
        style={fontSize ? { fontSize } : undefined}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
