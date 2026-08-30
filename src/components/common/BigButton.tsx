// ==============================================================================
// MudiDokan (মুদিদোকান) BigButton Component
// Guaranteed >= 56px Touch Target with High-Affordance Bengali Semantics
// ==============================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cash' | 'baki' | 'primary' | 'secondary' | 'warning' | 'outline';
  icon?: LucideIcon;
  subLabel?: string;
  badge?: string | number;
  fullWidth?: boolean;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  variant = 'primary',
  icon: Icon,
  subLabel,
  badge,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const variantStyles = {
    cash: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-600/20 border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1',
    baki: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-lg shadow-rose-600/20 border-b-4 border-rose-800 active:border-b-0 active:translate-y-1',
    primary: 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-lg shadow-teal-700/20 border-b-4 border-teal-950 active:border-b-0 active:translate-y-1',
    secondary: 'bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-md border-b-4 border-slate-950 active:border-b-0 active:translate-y-1',
    warning: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 shadow-md border-b-4 border-amber-700 active:border-b-0 active:translate-y-1',
    outline: 'bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 border-2 border-slate-300 active:border-slate-400',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed active:translate-y-0 active:border-b-4 filter grayscale';

  return (
    <button
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-3 px-5 py-3.5 
        min-h-[56px] text-lg font-bold rounded-2xl transition-all duration-150 select-none
        ${variantStyles[variant]}
        ${disabled ? disabledStyles : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2.5} />}
      <div className="flex flex-col items-center justify-center leading-tight">
        <span>{children}</span>
        {subLabel && (
          <span className="text-xs font-normal opacity-90 tracking-wide mt-0.5">{subLabel}</span>
        )}
      </div>
      {badge !== undefined && (
        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow">
          {badge}
        </span>
      )}
    </button>
  );
};
