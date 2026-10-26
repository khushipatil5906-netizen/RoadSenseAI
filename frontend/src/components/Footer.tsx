import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-5 px-6 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-slate-700">RoadSense AI Platform</span>
        <span>•</span>
        <span>College ML Mini-Project &copy; 2026</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500 text-center md:text-right">
        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          Operational triage support only. Defect severity predictions must be verified by certified municipal engineers.
        </span>
      </div>
    </footer>
  );
};
