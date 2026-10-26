export type UserRole = 'citizen' | 'inspector' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface DetectionBox {
  class: string;
  display_name: string;
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  normalized_box: [number, number, number, number];
  color: string;
}

export interface PriorityBreakdown {
  formula: string;
  components: {
    severity: { raw_value: string; normalized_score: number; weight: number; weighted_contribution: number };
    traffic: { raw_value: string | number; normalized_score: number; weight: number; weighted_contribution: number };
    rainfall: { raw_value: string; normalized_score: number; weight: number; weighted_contribution: number };
    road_importance: { raw_value: string | number; normalized_score: number; weight: number; weighted_contribution: number };
  };
  is_provisional: boolean;
  warnings: string[];
  disclaimer: string;
}

export interface RoadReport {
  id: number;
  reporter_id?: number | null;
  title: string;
  description?: string | null;
  damage_type: string;
  latitude: number;
  longitude: number;
  location_description?: string | null;
  road_name?: string | null;
  road_category: string;
  traffic_level?: number | null;
  rainfall_exposure?: number | null;
  road_importance?: number | null;
  image_path?: string | null;
  annotated_image_path?: string | null;
  detected_defects_json?: string | null;
  predicted_severity: 'Low' | 'Medium' | 'High' | 'Pending';
  model_confidence?: number | null;
  model_version?: string | null;
  feature_summary_json?: string | null;
  verified_severity?: 'Low' | 'Medium' | 'High' | null;
  priority_score?: number | null;
  priority_band?: 'Lower' | 'Medium' | 'High' | null;
  priority_breakdown_json?: string | null;
  is_provisional_priority: boolean;
  status: 'submitted' | 'under_review' | 'inspection_scheduled' | 'repair_recommended' | 'repair_in_progress' | 'resolved' | 'rejected' | 'duplicate';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: number;
  report_id: number;
  inspector_id: number;
  inspection_notes: string;
  verified_severity: 'Low' | 'Medium' | 'High';
  recommendation: string;
  inspection_date: string;
  created_at: string;
}

export interface RepairHistoryItem {
  id: number;
  report_id: number;
  previous_status?: string | null;
  new_status: string;
  changed_by?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface OverviewStats {
  total_reports: number;
  awaiting_review: number;
  inspections_pending: number;
  repairs_in_progress: number;
  resolved_repairs: number;
  severity_breakdown: Record<string, number>;
  priority_band_breakdown: Record<string, number>;
  avg_turnaround_days: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  reports: number;
  resolved: number;
}

export interface ModelInfo {
  model_name: string;
  model_version: string;
  algorithm: string;
  dataset_source: string;
  dataset_samples: { total: number; train: number; test: number };
  feature_schema: string[];
  feature_importances: Record<string, number>;
  supported_classes: string[];
  training_date: string;
  last_validation_date: string;
  validation_status: string;
  limitations: string[];
}

export interface ModelMetrics {
  model_version: string;
  accuracy: number;
  agreement_with_heuristic_labels?: number;
  label_source?: string;
  limitations?: string[];
  baseline_accuracy: number;
  f1_macro: number;
  f1_weighted: number;
  precision_macro: number;
  recall_macro: number;
  per_class: Record<string, { precision: number; recall: number; f1_score?: number; f1?: number; support: number }>;
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
}

export interface ModelComparisonItem {
  cv_accuracy_mean?: number;
  cv_accuracy_std?: number;
  cv_macro_f1_mean?: number;
  cv_macro_f1_std?: number;
  test_agreement_accuracy: number;
  test_macro_f1: number;
  test_weighted_f1?: number;
  test_macro_precision?: number;
  test_macro_recall?: number;
  best_hyperparameters?: Record<string, any>;
  best_cv_macro_f1?: number;
  confusion_matrix?: number[][];
}

export type ModelComparisonData = Record<string, any>;

export interface ValidationResults {
  status: string;
  sample_size: number;
  inter_rater_agreement?: {
    fleiss_kappa?: number;
    cohen_kappa?: number;
    percent_agreement?: number;
  };
  models?: Record<string, { accuracy: number; f1_macro: number }>;
  summary?: string;
}

