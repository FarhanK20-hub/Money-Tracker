'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/lib/data-context';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'currentColor' : '#a1a1aa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Log',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'currentColor' : '#a1a1aa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/add',
    label: 'Add',
    icon: () => (
      <div className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-600 dark:from-zinc-200 dark:to-white flex items-center justify-center shadow-lg shadow-zinc-800/30 dark:shadow-white/20 border-2 border-white dark:border-[#2c2c2e]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white dark:text-zinc-900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'currentColor' : '#a1a1aa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/fixed-deposits',
    label: 'FDs',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'currentColor' : '#a1a1aa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="18" y2="14" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { dashboardData } = useData();
  const pendingCount = dashboardData?.unverifiedCount || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe">
      <nav className="pointer-events-auto max-w-[400px] mx-auto mb-4 bg-white/80 dark:bg-[#2c2c2e]/90 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-full px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/5 dark:shadow-black/50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 hover:scale-[1.05] active:scale-95 ${
                isActive ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              <div className={item.href === '/add' ? 'absolute -top-3' : ''}>
                {item.icon(isActive)}
              </div>
              {item.href !== '/add' && (
                <span className={`text-[9px] font-bold mt-1 tracking-wide ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
              )}

              {/* Badge for review */}
              {item.badge && pendingCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold bg-pending-500 text-white rounded-full px-1 shadow-sm shadow-pending-500/30">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
