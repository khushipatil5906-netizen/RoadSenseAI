import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { OverviewStats, CategoryCount, TrendPoint, RoadReport } from '../types';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Clock,
  PieChart as PieIcon,
  TrendingUp,
  RefreshCw,
  Printer,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { SeverityBadge } from '../components/SeverityBadge';
import { PriorityBadge } from '../components/PriorityBadge';

const SEVERITY_COLORS: Record<string, string> = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#059669',
};

const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [damageTypes, setDamageTypes] = useState<CategoryCount[]>([]);
  const [allReports, setAllReports] = useState<RoadReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewData, trendsData, damageData, reportsData] = await Promise.all([
        api.getOverview(),
        api.getTrends(14),
        api.getDamageTypeBreakdown(),
        api.getReports({ limit: 100 }),
      ]);
      setStats(overviewData);
      setTrends(trendsData);
      setDamageTypes(damageData);
      setAllReports(reportsData.items);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    window.location.href = api.getCsvExportUrl();
  };

  if (loading && !stats) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <span>Aggregating municipal road damage dataset...</span>
      </div>
    );
  }

  // Calculate locality breakdown from real records
  const localityMap: Record<string, number> = {};
  allReports.forEach((r) => {
    const loc = r.location_description || r.road_name || 'Unspecified';
    const cleanLoc = loc.split(',')[0].trim();
    localityMap[cleanLoc] = (localityMap[cleanLoc] || 0) + 1;
  });
  const localityData = Object.entries(localityMap)
    .map(([locality, count]) => ({ locality, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Status breakdown data
  const statusData = [
    { name: 'Pending Review', value: stats?.awaiting_review || 0, color: '#8b5cf6' },
    { name: 'Inspection Queued', value: stats?.inspections_pending || 0, color: '#f59e0b' },
    { name: 'Repairs Active', value: stats?.repairs_in_progress || 0, color: '#3b82f6' },
    { name: 'Repairs Completed', value: stats?.resolved_repairs || 0, color: '#10b981' },
  ];

  return (
    <div className="space-y-7 pb-16 print:p-0">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <span>Analytics & Engineering Reports</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Real data visualizations, resolution times, and downloadable municipal CSV audit logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500">Total Recorded Defect Volume</span>
          <p className="text-3xl sm:text-4xl font-black text-slate-900">{stats?.total_reports || 0}</p>
          <p className="text-xs text-slate-500 font-medium">Database verified records</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500">Average Turnaround to Repair</span>
          <p className="text-3xl sm:text-4xl font-black text-blue-600">
            {stats && stats.avg_turnaround_days > 0 ? `${stats.avg_turnaround_days} Days` : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 font-medium">Submission to resolution</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500">Repairs Finalized & Closed</span>
          <p className="text-3xl sm:text-4xl font-black text-emerald-600">{stats?.resolved_repairs || 0}</p>
          <p className="text-xs text-slate-500 font-medium">Compacted & traffic restored</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500">Critical High Severity Queue</span>
          <p className="text-3xl sm:text-4xl font-black text-red-600">{stats?.severity_breakdown['High'] || 0}</p>
          <p className="text-xs text-slate-500 font-medium">Prioritized triage</p>
        </div>
      </div>

      {/* Visual Analytics Grid 1: Defect Types & Status Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
        {/* Damage Type Distribution Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Damage Category Breakdown</h3>
            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md">RDD2022 Defect Classes</span>
          </div>

          <div className="h-72 xl:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={damageTypes} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fontWeight: 500 }}
                  interval={0}
                  tickFormatter={(val) => val.replace('_crack', '').replace('_', ' ')}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Status Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Repair Status Breakdown</h3>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">Field Lifecycle</span>
          </div>

          <div className="h-72 xl:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  formatter={(val: any, name: any) => [`${val} reports`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm font-semibold pt-1">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-700">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid 2: Locality Breakdown */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Top Road Defect Localities</h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Geographic hotspots recorded across urban sectors</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {localityData.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold text-slate-800">{item.locality}</p>
                <span className="text-xs text-slate-500 font-medium">Municipal corridor</span>
              </div>
              <span className="px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded-lg font-bold font-mono text-xs">
                {item.count} defects
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Downloadable Summary Report Box */}
      <div className="p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="font-black text-lg sm:text-xl">Export Official Municipal Triage Report</h3>
          <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-2xl">
            Download complete CSV dataset with GPS coordinates, RDD2022 defect tags, predicted severity, and repair dates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="px-6 py-3.5 bg-white text-blue-900 hover:bg-blue-50 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 shadow-lg shrink-0 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5 text-blue-700" />
          <span>Download reports.csv</span>
        </button>
      </div>
    </div>
  );
};
