interface UserAvatarProps {
  avatarUrl?: string | null;
  avatarId?: string | null;
  fallbackName?: string | null;
  className?: string;
}

export function UserAvatar({ avatarUrl, avatarId, fallbackName, className = 'w-10 h-10' }: UserAvatarProps) {
  const url = avatarUrl || avatarId;
  
  if (url && url.startsWith('http')) {
    return (
      <div className={`overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 ${className}`}>
        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  const initial = fallbackName ? fallbackName.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`flex items-center justify-center font-bold text-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-inner ${className}`}>
      {initial}
    </div>
  );
}
