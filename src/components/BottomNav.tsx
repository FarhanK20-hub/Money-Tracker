'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/lib/data-context';

const navItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#c9a84c' : 'currentColor'}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Log',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#c9a84c' : 'currentColor'}>
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
      <div
        className="w-12 h-12 -mt-5 rounded-full flex items-center justify-center border border-[rgba(201,168,76,0.4)] shadow-[0_4px_20px_rgba(201,168,76,0.35),0_0_0_1px_rgba(201,168,76,0.15)]"
        style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c96a, #b8902e)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
    ),
  },
  {
    href: '/analytics',
    label: 'Stats',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#c9a84c' : 'currentColor'}>
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? '#c9a84c' : 'currentColor'}>
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
      <nav
        className="pointer-events-auto max-w-[420px] mx-auto mb-4 px-2 py-2 flex items-center justify-around rounded-full"
        style={{
          background: 'rgba(10, 10, 15, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 hover:scale-[1.05] active:scale-95 ${
                isActive && item.href !== '/add'
                  ? 'text-[#c9a84c]'
                  : 'text-[#55555f] hover:text-[#888898]'
              }`}
              style={
                isActive && item.href !== '/add'
                  ? {
                      background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.1) 0%, transparent 70%)',
                    }
                  : {}
              }
            >
              <div className={item.href === '/add' ? 'absolute -top-3' : ''}>
                {item.icon(isActive)}
              </div>
              {item.href !== '/add' && (
                <span
                  className={`text-[9px] font-bold mt-0.5 tracking-wide transition-all duration-200 ${
                    isActive ? 'opacity-100 text-[#c9a84c]' : 'opacity-0'
                  }`}
                >
                  {item.label}
                </span>
              )}
              {/* Pending badge */}
              {item.href === '/transactions' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#c9a84c] text-[#0a0a0f] text-[8px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
