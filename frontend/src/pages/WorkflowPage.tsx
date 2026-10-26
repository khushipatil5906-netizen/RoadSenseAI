import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoadReport, Inspection, RepairHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  ClipboardList,
  CheckCircle2,
  Calendar,
  Wrench,
  Clock,
  History,
  AlertCircle,
  RefreshCw,
  Send,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface WorkflowPageProps {
  initialReportId?: number | null;
  onNavigate: (page: string, reportId?: number) => void;
}

const STATUS_OPTIONS = [
  { id: 'submitted', label: 'Submitted (Citizen intake)' },
  { id: 'under_review', label: 'Under Review (Initial screening)' },
  { id: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { id: 'repair_recommended', label: 'Repair Recommended' },
  { id: 'repair_in_progress', label: 'Repair In Progress' },
  { id: 'resolved', label: 'Resolved (Pavement restored)' },
  { id: 'rejected', label: 'Rejected (Non-road defect / invalid)' },
  { id: 'duplicate', label: 'Duplicate (Already reported)' },
];

export const WorkflowPage: React.FC<WorkflowPageProps> = ({ initialReportId, onNavigate }) => {
  const { user, isInspector } = useAuth();
  const [reports, setReports] = useState<RoadReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<RoadReport | null>(null);
  const [history, setHistory] = useState<RepairHistoryItem[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inspector form states
  const [verifiedSeverity, setVerifiedSeverity] = useState<'Low' | 'Medium' | 'High'>('High');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [recommendation, setRecommendation] = useState('Immediate cold bitumen patch & mechanical compaction');
  const [newStatus, setNewStatus] = useState('repair_recommended');
  const [statusNotes, setStatusNotes] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({ limit: 50 });
      setReports(res.items);

      let target = res.items[0];
      if (initialReportId) {
        const found = res.items.find((r) => r.id === initialReportId);
        if (found) target = found;
      }
      if (target) {
        selectReport(target);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectReport = async (rep: RoadReport) => {
    setSelectedReport(rep);
    setActionSuccess(null);
    setActionError(null);
    setVerifiedSeverity((rep.verified_severity as any) || (rep.predicted_severity as any) || 'Medium');
    setNewStatus(rep.status);

    try {
      const [histData, inspData] = await Promise.all([
        api.getReportHistory(rep.id),
        api.getReportInspections(rep.id),
      ]);
      setHistory(histData);
      setInspections(inspData);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [initialReportId]);

  // Submit Field Inspection Form
  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setActionError(null);
    setActionSuccess(null);

    if (!isInspector) {
      setActionError('Only authorized municipal inspectors can record field inspection verifications.');
      return;
    }

    if (!inspectionNotes.trim()) {
      setActionError('Please enter detailed on-site inspection observations.');
      return;
    }

    setUpdating(true);
    try {
      await api.createInspection(selectedReport.id, {
        inspection_notes: inspectionNotes.trim(),
        verified_severity: verifiedSeverity,
        recommendation: recommendation.trim(),
        new_status: 'repair_recommended',
      });

      setActionSuccess('Field inspection logged & verified severity saved successfully.');
      setInspectionNotes('');

      // Refresh report
      const updated = await api.getReport(selectedReport.id);
      setSelectedReport(updated);
      const [histData, inspData] = await Promise.all([
        api.getReportHistory(selectedReport.id),
        api.getReportInspections(selectedReport.id),
      ]);
      setHistory(histData);
      setInspections(inspData);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record inspection.');
    } finally {
      setUpdating(false);
    }
  };

  // Submit Status Transition
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setActionError(null);
    setActionSuccess(null);

    if (!isInspector) {
      setActionError('Status transitions require inspector privileges.');
      return;
    }

    setUpdating(true);
    try {
      await api.updateReportStatus(selectedReport.id, newStatus, statusNotes);
      setActionSuccess(`Status transitioned to '${newStatus}' with audit trail.`);
      setStatusNotes('');

      // Refresh report & audit trail
      const updated = await api.getReport(selectedReport.id);
      setSelectedReport(updated);
      const histData = await api.getReportHistory(selectedReport.id);
      setHistory(histData);
    } catch (err: any) {
      setActionError(err.message || 'Failed to transition status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            <span>Inspection & Repair Lifecycle Workflow</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Field verification, contractor dispatch, and timestamped lifecycle audit history
          </p>
        </div>

        {!isInspector && (
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-800 font-bold flex items-center gap-2 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Viewing in Citizen mode (Read-only status updates)</span>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Left Column: Report Selection Queue (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Active Work Queue</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Select any record to view or update lifecycle</p>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => selectReport(rep)}
                  className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-slate-500 text-xs">#{rep.id}</span>
                    <SeverityBadge severity={rep.predicted_severity} size="sm" />
                  </div>
                  <p className="font-bold text-slate-900 line-clamp-1">{rep.title}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{rep.location_description || rep.road_name}</p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                    <StatusBadge status={rep.status} />
                    <PriorityBadge score={rep.priority_score} band={rep.priority_band} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Lifecycle Actions & Audit Trail (2 cols) */}
        {selectedReport ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Summary Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black text-slate-500">#{selectedReport.id}</span>
                    <SeverityBadge severity={selectedReport.predicted_severity} size="sm" />
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">{selectedReport.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">{selectedReport.location_description || selectedReport.road_name}</p>
                </div>

                <PriorityBadge
                  score={selectedReport.priority_score}
                  band={selectedReport.priority_band}
                  isProvisional={selectedReport.is_provisional_priority}
                />
              </div>

              {/* Progress Flow Lifecycle Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-semibold">
                {[
                  { id: 'submitted', label: '1. Submitted' },
                  { id: 'under_review', label: '2. Review' },
                  { id: 'inspection_scheduled', label: '3. Inspection' },
                  { id: 'repair_recommended', label: '4. Repair Rec' },
                  { id: 'repair_in_progress', label: '5. In Progress' },
                  { id: 'resolved', label: '6. Resolved' },
                ].map((step) => {
                  const isCurrent = selectedReport.status === step.id;
                  return (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 font-medium'
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action 1: Field Inspection Logging (Inspector only) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Record Field Inspection Verification</h3>
              </div>

              <form onSubmit={handleLogInspection} className="space-y-4 text-sm font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Engineer Verified Damage Severity *</label>
                    <select
                      value={verifiedSeverity}
                      disabled={!isInspector}
                      onChange={(e) => setVerifiedSeverity(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Low">Low Severity (Hairline superficial)</option>
                      <option value="Medium">Medium Severity (Moderate depression)</option>
                      <option value="High">High Severity (Severe structural cavity)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Repair Method Recommendation *</label>
                    <input
                      type="text"
                      disabled={!isInspector}
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      placeholder="e.g. Hot mix asphalt overlay, cold patch, sealing"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">On-Site Inspection Notes *</label>
                  <textarea
                    rows={3}
                    disabled={!isInspector}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="Record field measurements, sub-base condition, water pooling observations, safety hazards..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isInspector || updating}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updating ? 'Recording...' : 'Submit Field Verification'}</span>
                </button>
              </form>
            </div>

            {/* Action 2: Update Operational Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Update Repair Operational Status</h3>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Transition Status To</label>
                    <select
                      value={newStatus}
                      disabled={!isInspector}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Status Change Justification / Contractor Note</label>
                    <input
                      type="text"
                      disabled={!isInspector}
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g. Contractor crew assigned, repairs verified complete"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isInspector || updating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{updating ? 'Updating...' : 'Transition Status'}</span>
                </button>
              </form>
            </div>

            {/* Timestamped Audit History Trail */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <History className="w-5 h-5 text-slate-600" />
                <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Timestamped Lifecycle Audit Trail</h3>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">No status transitions recorded yet.</p>
              ) : (
                <div className="relative pl-7 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {history.map((h, i) => (
                    <div key={h.id || i} className="relative text-sm space-y-1.5 font-medium">
                      <span className="absolute -left-7 top-1.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 capitalize flex items-center gap-2">
                          Transitioned to: <StatusBadge status={h.new_status} />
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-semibold">
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      </div>
                      {h.notes && (
                        <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-16 text-center text-sm font-semibold text-slate-400 bg-white rounded-2xl border border-slate-200">
            Select a report from the work queue to manage inspections.
          </div>
        )}
      </div>
    </div>
  );
};
