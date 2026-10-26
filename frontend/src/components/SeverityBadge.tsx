import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface SeverityBadgeProps {
  severity?: 'Low' | 'Medium' | 'High' | 'Pending' | string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity = 'Pending', size = 'md' }) => {
  const s = severity || 'Pending';

  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = Clock;

  if (s === 'High') {
    bg = 'bg-red-50 text-red-700 border-red-200';
    Icon = AlertCircle;
  } else if (s === 'Medium') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
  } else if (s === 'Low') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1 font-semibold',
    md: 'text-xs md:text-sm px-3 py-1 gap-1.5 font-bold',
    lg: 'text-sm md:text-base px-4 py-1.5 gap-2 font-extrabold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border shadow-2xs ${bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{s} Severity</span>
    </span>
  );
};
