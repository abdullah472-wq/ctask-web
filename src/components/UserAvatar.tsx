export const AVATARS = [
  { id: 'avatar-1', seed: 'Felix', style: 'adventurer' },
  { id: 'avatar-2', seed: 'Aneka', style: 'adventurer' },
  { id: 'avatar-3', seed: 'Oliver', style: 'adventurer' },
  { id: 'avatar-4', seed: 'Lilly', style: 'adventurer' },
  { id: 'avatar-5', seed: 'Jack', style: 'adventurer' },
  { id: 'avatar-6', seed: 'Mia', style: 'adventurer' },
  { id: 'avatar-7', seed: 'Leo', style: 'adventurer' },
  { id: 'avatar-8', seed: 'Coco', style: 'adventurer' }
];

interface UserAvatarProps {
  avatarId?: string;
  className?: string;
}

export function UserAvatar({ avatarId = 'avatar-1', className = 'w-10 h-10' }: UserAvatarProps) {
  const avatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const url = `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}&backgroundColor=transparent`;

  return (
    <div className={`rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 ${className}`}>
      <img src={url} alt={`Avatar ${avatarId}`} className="w-full h-full object-cover" />
    </div>
  );
}
