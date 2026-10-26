import {
  User,
  RoadReport,
  Inspection,
  RepairHistoryItem,
  OverviewStats,
  CategoryCount,
  TrendPoint,
  ModelInfo,
  ModelMetrics,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('roadsense_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('roadsense_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('roadsense_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not sending FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string, role?: string): Promise<{ access_token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  async getMe(): Promise<User> {
    return request('/auth/me');
  },

  // Reports
  async getReports(params?: {
    severity?: string;
    status?: string;
    damage_type?: string;
    road_category?: string;
    locality?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ total: number; items: RoadReport[] }> {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.status) q.append('status', params.status);
    if (params?.damage_type) q.append('damage_type', params.damage_type);
    if (params?.road_category) q.append('road_category', params.road_category);
    if (params?.locality) q.append('locality', params.locality);
    if (params?.search) q.append('search', params.search);
    if (params?.skip !== undefined) q.append('skip', String(params.skip));
    if (params?.limit !== undefined) q.append('limit', String(params.limit));

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request(`/reports${queryStr}`);
  },

  async getReport(id: number): Promise<RoadReport> {
    return request(`/reports/${id}`);
  },

  async createReport(formData: FormData): Promise<RoadReport> {
    return request('/reports', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadReportImage(reportId: number, file: File): Promise<RoadReport> {
    const fd = new FormData();
    fd.append('image', file);
    return request(`/reports/${reportId}/images`, {
      method: 'POST',
      body: fd,
    });
  },

  // Inspections & Workflow
  async createInspection(
    reportId: number,
    data: { inspection_notes: string; verified_severity: string; recommendation: string; new_status?: string }
  ): Promise<Inspection> {
    return request(`/reports/${reportId}/inspections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReportStatus(reportId: number, status: string, notes?: string): Promise<RoadReport> {
    return request(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async getReportHistory(reportId: number): Promise<RepairHistoryItem[]> {
    return request(`/reports/${reportId}/history`);
  },

  async getReportInspections(reportId: number): Promise<Inspection[]> {
    return request(`/reports/${reportId}/inspections`);
  },

  // AI Analysis
  async predictSeverity(formData: FormData): Promise<any> {
    return request('/analysis/predict-severity', {
      method: 'POST',
      body: formData,
    });
  },

  async getModelInfo(): Promise<ModelInfo> {
    return request('/model/info');
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    return request('/model/metrics');
  },

  async getModelComparison(): Promise<any> {
    return request('/model/comparison');
  },

  async getValidationResults(): Promise<any> {
    return request('/model/validation');
  },

  async retrainModel(): Promise<any> {
    return request('/analysis/admin/retrain', {
      method: 'POST',
    });
  },

  // Analytics
  async getOverview(): Promise<OverviewStats> {
    return request('/analytics/overview');
  },

  async getSeverityBreakdown(): Promise<CategoryCount[]> {
    return request('/analytics/severity');
  },

  async getDamageTypeBreakdown(): Promise<CategoryCount[]> {
    return request('/analytics/damage-types');
  },

  async getTrends(days = 14): Promise<TrendPoint[]> {
    return request(`/analytics/trends?days=${days}`);
  },

  async getPriorityQueue(limit = 10): Promise<RoadReport[]> {
    return request(`/analytics/repair-priority?limit=${limit}`);
  },

  // Export
  getCsvExportUrl(): string {
    return `${API_BASE}/exports/reports.csv`;
  },
};
