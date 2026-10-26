import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadReport } from '../types';
import { MapComponent } from '../components/MapComponent';
import {
  MapPin,
  Filter,
  RefreshCw,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

interface DamageMapPageProps {
  onNavigate: (page: string, reportId?: number) => void;
}

export const DamageMapPage: React.FC<DamageMapPageProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<RoadReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [damageTypeFilter, setDamageTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReports({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        damage_type: damageTypeFilter || undefined,
        search: searchQuery || undefined,
        limit: 100,
      });
      setReports(res.items);
      if (res.items.length > 0 && !selectedReport) {
        setSelectedReport(res.items[0]);
      }
    } catch (err: any) {
      console.error('Map reports error:', err);
      setError(err.message || 'Failed to load geocoded road reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [severityFilter, statusFilter, damageTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    setSeverityFilter('');
    setStatusFilter('');
    setDamageTypeFilter('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-600" />
            <span>Interactive Road Damage GIS Map</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
            Geographic distribution of recorded road defects color-coded by predicted severity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchReports}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Refresh Map</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Report Defect</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search road name or locality..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </form>

          {/* Severity Filter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Severities</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="inspection_scheduled">Inspection Scheduled</option>
              <option value="repair_recommended">Repair Recommended</option>
              <option value="repair_in_progress">Repair In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Damage Type Filter */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 font-semibold">Defect:</span>
            <select
              value={damageTypeFilter}
              onChange={(e) => setDamageTypeFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Types</option>
              <option value="pothole">Pothole (D40)</option>
              <option value="alligator_crack">Alligator Crack (D20)</option>
              <option value="longitudinal_crack">Longitudinal (D00)</option>
              <option value="transverse_crack">Transverse (D10)</option>
            </select>
          </div>

          {(severityFilter || statusFilter || damageTypeFilter || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:underline font-bold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 pt-2 border-t border-slate-100 font-medium">
          <span>Showing {reports.length} geolocated road damage report(s)</span>
          <span className="italic">Click any marker pin on the map to inspect details</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-sm flex items-center gap-3 font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Map + Side Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Leaflet Map (2 cols) */}
        <div className="lg:col-span-2">
          <MapComponent
            reports={reports}
            selectedReportId={selectedReport?.id}
            onSelectReport={(r) => setSelectedReport(r)}
            className="h-[640px] xl:h-[720px] 2xl:h-[780px] rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          />
        </div>

        {/* Selected Report Detail Card (1 col) */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Selected Location Details</span>
              {selectedReport && (
                <span className="font-mono text-sm font-extrabold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">#{selectedReport.id}</span>
              )}
            </div>

            {selectedReport ? (
              <div className="space-y-4 text-sm">
                {selectedReport.image_path && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                    <img
                      src={selectedReport.annotated_image_path || selectedReport.image_path}
                      alt={selectedReport.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="font-extrabold text-base lg:text-lg text-slate-900 leading-snug">{selectedReport.title}</h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {selectedReport.location_description || selectedReport.road_name || 'Location recorded'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs text-slate-500 font-bold block">Severity</span>
                    <SeverityBadge severity={selectedReport.predicted_severity} size="sm" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-xs text-slate-500 font-bold block">Priority</span>
                    <PriorityBadge
                      score={selectedReport.priority_score}
                      band={selectedReport.priority_band}
                      isProvisional={selectedReport.is_provisional_priority}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Road Hierarchy:</span>
                    <span className="font-bold text-slate-900">{selectedReport.road_category}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Coordinates:</span>
                    <span className="font-mono text-xs text-slate-700 font-semibold">
                      {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('analysis', selectedReport.id)}
                  className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect AI Bounding Boxes</span>
                </button>
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-400 space-y-2 font-medium">
                <MapPin className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <p>Select any pin on the map to display its damage details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
