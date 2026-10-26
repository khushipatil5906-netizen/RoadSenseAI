import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Eye,
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

import { api } from '../services/api';
import { RoadReport, OverviewStats, TrendPoint, CategoryCount } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  onNavigate: (page: string, reportId?: number) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#059669',
  Pending: '#64748b',
};

const DAMAGE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [damageTypes, setDamageTypes] = useState<CategoryCount[]>([]);
  const [recentReports, setRecentReports] = useState<RoadReport[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<RoadReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, trendsData, damageData, reportsData, queueData] = await Promise.all([
        api.getOverview(),
        api.getTrends(14),
        api.getDamageTypeBreakdown(),
        api.getReports({ limit: 6 }),
        api.getPriorityQueue(5),
      ]);
      setStats(overviewData);
      setTrends(trendsData);
      setDamageTypes(damageData);
      setRecentReports(reportsData.items);
      setPriorityQueue(queueData);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Unable to load real dashboard metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading live database records & analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Dashboard Connection Notice</span>
        </div>
        <p className="text-xs text-red-700">{error}</p>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Format severity pie data
  const severityPieData = stats?.severity_breakdown
    ? Object.entries(stats.severity_breakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Municipal Infrastructure Overview
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
            Live operational data calculated directly from recorded road inspections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>New Damage Report</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>Total Records</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900">{stats?.total_reports ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Persisted in database</p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>Awaiting Review</span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-purple-700">{stats?.awaiting_review ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Initial intake triage</p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>High Severity</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-red-700">{stats?.severity_breakdown['High'] ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Critical structural risk</p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>Inspection Queued</span>
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-amber-700">{stats?.inspections_pending ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Field visit assigned</p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>Repairs Active</span>
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-blue-700">{stats?.repairs_in_progress ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Contractor assigned</p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-600 text-sm font-bold">
            <span>Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-emerald-700">{stats?.resolved_repairs ?? 0}</p>
          <p className="text-xs text-slate-500 font-medium">Pavement restored</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Severity Distribution Pie Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Severity Distribution</h3>
            <span className="text-xs text-slate-500 font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded-md">
              RDD2022 Random Forest
            </span>
          </div>
          <div className="h-72 xl:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} reports`, `${name} Severity`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center flex-wrap gap-4 text-xs sm:text-sm font-semibold pt-1">
            {severityPieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shadow-2xs"
                  style={{ backgroundColor: SEVERITY_COLORS[d.name] || '#94a3b8' }}
                />
                <span className="text-slate-800">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reports Over Time Trends */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Damage Intake & Resolution Trends</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Recorded reports vs. completed repairs over last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-700">Submissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700">Resolved</span>
              </div>
            </div>
          </div>

          <div className="h-72 xl:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="reports"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Reports"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High-Priority Triage Queue */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Immediate Inspection & Repair Queue</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Prioritized by weighted multi-criteria triage formula</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('priority')}
            className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5"
          >
            <span>View Full Engine</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl font-medium">
            No high-priority repairs currently queued.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Priority Score</th>
                  <th className="py-3.5 px-4">Report Details</th>
                  <th className="py-3.5 px-4">Road Category</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {priorityQueue.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge score={rep.priority_score} band={rep.priority_band} isProvisional={rep.is_provisional_priority} />
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{rep.title}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate max-w-sm mt-0.5 font-medium">{rep.location_description || rep.road_name}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-semibold text-sm whitespace-nowrap">{rep.road_category}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <SeverityBadge severity={rep.predicted_severity} size="sm" />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={rep.status} />
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate('analysis', rep.id)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-700 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Submissions Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Recent Damage Submissions</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Most recent reports stored in the database</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('workflow')}
            className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5"
          >
            <span>All Submissions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentReports.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl space-y-3 font-medium">
            <p>No damage reports found in database.</p>
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-blue-700"
            >
              Submit First Road Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Title & Location</th>
                  <th className="py-3.5 px-4">Damage Type</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-4 px-4 font-mono font-extrabold text-slate-500">#{rep.id}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{rep.title}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate max-w-sm mt-0.5 font-medium">{rep.location_description || rep.road_name}</p>
                    </td>
                    <td className="py-4 px-4 capitalize text-slate-700 font-semibold whitespace-nowrap">{rep.damage_type.replace('_', ' ')}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <SeverityBadge severity={rep.predicted_severity} size="sm" />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge score={rep.priority_score} band={rep.priority_band} isProvisional={rep.is_provisional_priority} />
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={rep.status} />
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate('analysis', rep.id)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-700 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
