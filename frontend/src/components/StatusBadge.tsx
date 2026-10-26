import React from 'react';
import { Send, Eye, Calendar, Wrench, Hammer, CheckCircle2, XCircle, Copy } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    submitted: {
      label: 'Submitted',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: Send,
    },
    under_review: {
      label: 'Under Review',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: Eye,
    },
    inspection_scheduled: {
      label: 'Inspection Scheduled',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Calendar,
    },
    repair_recommended: {
      label: 'Repair Recommended',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: Wrench,
    },
    repair_in_progress: {
      label: 'Repair In Progress',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Hammer,
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircle,
    },
    duplicate: {
      label: 'Duplicate',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      icon: Copy,
    },
  };

  const current = configs[status] || {
    label: status.replace(/_/g, ' '),
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Send,
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-semibold border shadow-2xs capitalize ${current.bg} ${current.text} ${current.border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};
