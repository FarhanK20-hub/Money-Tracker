'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

// ─── Page entrance animation ─────────────────────────────────────────────

export function PageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Staggered list item ─────────────────────────────────────────────────

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.04, 0.32), duration: 0.3, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

export function AnimatedItem({
  children,
  index = 0,
  layoutId,
}: {
  children: ReactNode;
  index?: number;
  layoutId?: string;
}) {
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      layoutId={layoutId}
    >
      {children}
    </motion.div>
  );
}

// ─── Presence wrapper for list transitions ───────────────────────────────

export function AnimatedList({ children }: { children: ReactNode }) {
  return <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

// ─── Slide-up modal backdrop ─────────────────────────────────────────────

export function ModalMotion({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative w-full max-w-lg"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
