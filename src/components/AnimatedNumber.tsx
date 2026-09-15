'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/constants';

export default function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // ms
    const initialValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart) for that premium deceleration
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      setDisplayValue(initialValue + (value - initialValue) * easeOut);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{formatCurrency(displayValue)}</>;
}
