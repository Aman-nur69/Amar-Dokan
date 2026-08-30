// ==============================================================================
// MudiDokan (মুদিদোকান) Bengali Number & Currency Badge Component
// ==============================================================================

import React from 'react';
import { formatBengaliCurrency, toBanglaDigits } from '../../lib/banglaNumberFormatter';

interface BengaliNumberProps {
  value: number | string | null | undefined;
  isCurrency?: boolean;
  decimals?: number;
  className?: string;
  showSymbol?: boolean;
  type?: 'neutral' | 'cash' | 'due' | 'alert';
}

export const BengaliNumber: React.FC<BengaliNumberProps> = ({
  value,
  isCurrency = false,
  decimals = 2,
  className = '',
  showSymbol = true,
  type = 'neutral',
}) => {
  const formatted = isCurrency
    ? formatBengaliCurrency(value, showSymbol, decimals)
    : toBanglaDigits(value);

  const typeStyles = {
    neutral: 'text-slate-900',
    cash: 'text-emerald-600 font-bold',
    due: 'text-rose-600 font-bold',
    alert: 'text-amber-600 font-bold',
  };

  return <span className={`${typeStyles[type]} ${className}`}>{formatted}</span>;
};
