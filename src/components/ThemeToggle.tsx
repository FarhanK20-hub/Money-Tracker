'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full" />; // Placeholder
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/5 hover:bg-white/10 dark:bg-white/10 dark:hover:bg-white/20 active:scale-95 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={14} strokeWidth={2.5} />
      ) : (
        <Moon size={14} strokeWidth={2.5} />
      )}
    </button>
  );
}
