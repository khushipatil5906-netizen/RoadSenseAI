import React from 'react';
import { Flame, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface PriorityBadgeProps {
  score?: number | null;
  band?: 'Lower' | 'Medium' | 'High' | string | null;
  isProvisional?: boolean;
  showScore?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  score,
  band = 'Medium',
  isProvisional = false,
  showScore = true,
}) => {
  const b = band || 'Medium';

  let color = 'bg-slate-100 text-slate-700 border-slate-300';
  let Icon = HelpCircle;

  if (b === 'High') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = Flame;
  } else if (b === 'Medium') {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
  } else if (b === 'Lower') {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
    Icon = ShieldCheck;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs md:text-sm font-bold border shadow-2xs ${color}`}
      title={isProvisional ? 'Provisional calculation: some environmental inputs were estimated' : 'Calculated priority score'}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{b} Priority</span>
      {showScore && score !== undefined && score !== null && (
        <span className="font-mono ml-0.5 opacity-90 font-extrabold">({score.toFixed(2)})</span>
      )}
      {isProvisional && (
        <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-xs uppercase font-extrabold" title="Provisional Score">
          PROV
        </span>
      )}
    </span>
  );
};
