// src/components/Avatar.tsx
import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

interface AvatarProps {
  username: string;
  size?: number;
}

const Avatar = ({ username, size = 64 }: AvatarProps) => {
  const avatarDataUri = useMemo(() => {
    return createAvatar(lorelei, {
      seed: username,
      size,
      backgroundColor: ['dcfce7', 'bbf7d0', '86efac'], // emerald-100, 200, 300
      backgroundType: ['solid'],
      // optional tweaks for variety
      eyes: ['variant01', 'variant02', 'variant03', 'variant04'],
      mouth: ['happy01', 'happy02', 'surprised01'] as any,
      hairAccessoriesProbability: 50,
    }).toDataUri();
  }, [username, size]);

  return (
    <img
      src={avatarDataUri}
      alt={`${username}'s avatar`}
      className="rounded-full border border-emerald-400/20 shadow-md"
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;