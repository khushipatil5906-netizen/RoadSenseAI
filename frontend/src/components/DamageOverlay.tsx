import React, { useState } from 'react';
import { DetectionBox } from '../types';
import { Layers, Eye, Tag } from 'lucide-react';

interface DamageOverlayProps {
  imageSrc: string;
  annotatedSrc?: string | null;
  detections?: DetectionBox[] | null;
  className?: string;
}

export const DamageOverlay: React.FC<DamageOverlayProps> = ({
  imageSrc,
  annotatedSrc,
  detections = [],
  className = '',
}) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [useServerAnnotated, setUseServerAnnotated] = useState(!!annotatedSrc);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displaySrc = useServerAnnotated && annotatedSrc ? annotatedSrc : imageSrc;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm ${className}`}>
      {/* Image container */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-black/40">
        <img
          src={displaySrc}
          alt="Road damage capture"
          className="w-full h-full object-cover select-none"
        />

        {/* Client-rendered dynamic bounding box overlay if not using server-baked image */}
        {showBoxes && !useServerAnnotated && detections && detections.map((det, idx) => {
          const [ymin, xmin, ymax, xmax] = det.normalized_box;
          const top = `${ymin * 100}%`;
          const left = `${xmin * 100}%`;
          const width = `${(xmax - xmin) * 100}%`;
          const height = `${(ymax - ymin) * 100}%`;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="absolute transition-all duration-150 pointer-events-auto cursor-pointer"
              style={{
                top,
                left,
                width,
                height,
                border: `2.5px solid ${det.color || '#ef4444'}`,
                backgroundColor: isHovered ? `${det.color}33` : 'transparent',
                boxShadow: isHovered ? '0 0 12px rgba(0,0,0,0.5)' : 'none',
              }}
            >
              <div
                className="absolute -top-6 left-0 text-[11px] font-semibold text-white px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 whitespace-nowrap"
                style={{ backgroundColor: det.color || '#ef4444' }}
              >
                <span>{det.display_name}</span>
                <span className="opacity-80">({Math.round(det.confidence * 100)}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control bar */}
      <div className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-civic-sky" />
          <span>
            {detections && detections.length > 0
              ? `${detections.length} defect region(s) identified`
              : 'Defect localization active'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {annotatedSrc && (
            <button
              type="button"
              onClick={() => setUseServerAnnotated(!useServerAnnotated)}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                useServerAnnotated ? 'bg-civic-blue text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{useServerAnnotated ? 'Server Annotation' : 'Raw Photo'}</span>
            </button>
          )}

          {!useServerAnnotated && (
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                showBoxes ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showBoxes ? 'Hide Boxes' : 'Show Boxes'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
