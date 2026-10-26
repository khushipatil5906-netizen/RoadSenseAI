import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RoadReport } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { MapPin, Navigation, ExternalLink, AlertTriangle } from 'lucide-react';

interface MapComponentProps {
  reports?: RoadReport[];
  selectedReportId?: number | null;
  onSelectReport?: (report: RoadReport) => void;
  // Picker mode for Report Damage form
  isPickerMode?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationPick?: (lat: number, lng: number) => void;
  className?: string;
}

// Custom Leaflet DivIcon generator
function createCustomPin(severity: string, isSelected: boolean) {
  let color = '#3b82f6';
  if (severity === 'High') color = '#dc2626';
  else if (severity === 'Medium') color = '#d97706';
  else if (severity === 'Low') color = '#059669';

  const pulseRing = isSelected
    ? `<div class="absolute -inset-2 rounded-full border-2 border-${severity === 'High' ? 'red-500' : 'blue-500'} animate-ping opacity-75"></div>`
    : '';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulseRing}
        <div style="background-color: ${color}; width: ${isSelected ? '28px' : '22px'}; height: ${isSelected ? '28px' : '22px'};"
             class="rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all duration-200">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
    iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
  });
}

const pickerIcon = L.divIcon({
  className: 'custom-picker-marker',
  html: `
    <div class="flex items-center justify-center">
      <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center animate-bounce text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Helper component to auto-fit map view bounds
function FitBoundsToMarkers({ reports }: { reports?: RoadReport[] }) {
  const map = useMap();
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    const validReports = reports.filter((r) => r.latitude && r.longitude);
    if (validReports.length === 0) return;

    if (validReports.length === 1) {
      map.setView([validReports[0].latitude, validReports[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(validReports.map((r) => [r.latitude, r.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [reports, map]);
  return null;
}

// Map click handler for location picking
function MapEventsHandler({ onLocationPick }: { onLocationPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationPick) {
        onLocationPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    },
  });
  return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  reports = [],
  selectedReportId,
  onSelectReport,
  isPickerMode = false,
  selectedLocation,
  onLocationPick,
  className = 'h-[500px]',
}) => {
  // Default coordinates: center around reports or initial municipal centroid (e.g., Mumbai / Pune urban cluster: 19.0760, 72.8777)
  const defaultCenter: [number, number] =
    reports.length > 0 && reports[0].latitude && reports[0].longitude
      ? [reports[0].latitude, reports[0].longitude]
      : [19.0760, 72.8777];

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm z-0 ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {!isPickerMode && <FitBoundsToMarkers reports={reports} />}
        {isPickerMode && <MapEventsHandler onLocationPick={onLocationPick} />}

        {/* Picker Mode Marker */}
        {isPickerMode && selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={pickerIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-semibold text-slate-800">Selected Location</p>
                <p className="font-mono text-slate-600">
                  {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Damage Reports Markers */}
        {!isPickerMode &&
          reports.map((report) => {
            if (!report.latitude || !report.longitude) return null;
            const isSelected = selectedReportId === report.id;
            const icon = createCustomPin(report.predicted_severity, isSelected);

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelectReport) onSelectReport(report);
                  },
                }}
              >
                <Popup className="roadsense-popup">
                  <div className="p-1 max-w-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500">#{report.id}</span>
                      <SeverityBadge severity={report.predicted_severity} size="sm" />
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 leading-tight">
                      {report.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {report.location_description || report.road_name || 'Location recorded'}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <StatusBadge status={report.status} />
                      <PriorityBadge score={report.priority_score} band={report.priority_band} isProvisional={report.is_provisional_priority} />
                    </div>

                    {onSelectReport && (
                      <button
                        type="button"
                        onClick={() => onSelectReport(report)}
                        className="w-full mt-2 py-1 px-2.5 bg-civic-blue text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>View Analysis Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Map Legend Overlay */}
      {!isPickerMode && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-3 py-2.5 rounded-lg shadow-md border border-slate-200 text-xs z-[1000] pointer-events-auto">
          <p className="font-semibold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wider">Severity Legend</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
              <span className="text-slate-700">High Severity Defect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
              <span className="text-slate-700">Medium Severity Defect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
              <span className="text-slate-700">Low Severity Defect</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
