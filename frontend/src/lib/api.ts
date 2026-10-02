const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    let base = String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '');
    if (!base.endsWith('/api')) {
      base = `${base}/api`;
    }
    return base;
  }
  if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')) {
    return 'http://localhost:8000/api';
  }
  return '/api';
};

const API = getApiBase();

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('agriguide_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem('agriguide_token', token);
  } catch {}
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem('agriguide_token');
    localStorage.removeItem('agriguide_user');
  } catch {}
};

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const r = await fetch(API + path, {
    headers,
    ...options
  });
  if (!r.ok) {
    let errorMsg = `API error ${r.status}`;
    try {
      const errJson = await r.json();
      if (errJson && errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      const errorText = await r.text();
      if (errorText) errorMsg = errorText;
    }
    throw new Error(errorMsg);
  }
  return r.json();
}

// Fields & Farms
export const getFarms = () => api<any[]>('/farms');
export const createFarm = (data: any) =>
  api<any>('/farms', {
    method: 'POST',
    body: JSON.stringify(data)
  });
export const getFields = () => api<any[]>('/fields');
export const createField = (data: any) =>
  api<any>('/fields', {
    method: 'POST',
    body: JSON.stringify(data)
  });
export const getField = (id: string) => api<any>(`/fields/${id}`);
export const resolveLocation = (query: string) =>
  api<any>(`/locations/resolve?query=${encodeURIComponent(query)}`);
export const updateField = (id: string, data: any) =>
  api<any>(`/fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
export const deleteField = (id: string) =>
  api<any>(`/fields/${id}`, {
    method: 'DELETE'
  });
export const syncWeather = (id: string) =>
  api<any>(`/fields/${id}/weather/sync`, {
    method: 'POST'
  });
export const getState = (id: string) => api<any>(`/fields/${id}/state`);
export const getEvidence = (id: string) => api<any[]>(`/fields/${id}/evidence`);
export const getDecisions = (id: string) => api<any[]>(`/fields/${id}/decisions`);

// Cognitive Runs & Decisions
export const decide = (id: string, trigger = 'USER_REQUEST', goal = 'irrigation_decision') =>
  api<any>(`/fields/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify({ trigger, goal })
  });

export const observe = (id: string, message: string) =>
  api<any>(`/fields/${id}/observations`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });

export const audit = (id: string) => api<any>(`/decisions/${id}/audit`);
export const getDecisionDiff = (decisionId: string) => api<any>(`/decisions/${decisionId}/diff`);

// The Agent That Grows Up: Custom Field Rules
export const getFieldRules = (fieldId: string) => api<any[]>(`/fields/${fieldId}/rules`);
export const createFieldRule = (fieldId: string, rule: any) =>
  api<any>(`/fields/${fieldId}/rules`, {
    method: 'POST',
    body: JSON.stringify(rule)
  });
export const toggleFieldRule = (fieldId: string, ruleId: string) =>
  api<any>(`/fields/${fieldId}/rules/${ruleId}/toggle`, { method: 'PUT' });
export const deleteFieldRule = (fieldId: string, ruleId: string) =>
  api<any>(`/fields/${fieldId}/rules/${ruleId}`, { method: 'DELETE' });

// Interactive Simulation Sandbox
export const simulateWhatIf = (fieldId: string, params: any) =>
  api<any>(`/fields/${fieldId}/simulate`, {
    method: 'POST',
    body: JSON.stringify(params)
  });

export const simulatePublic = (params: any) =>
  api<any>('/simulate/public', {
    method: 'POST',
    body: JSON.stringify(params)
  });

// Learning, Outcomes & Source Reliability
export const outcome = (id: string, data: any) =>
  api<any>(`/decisions/${id}/outcomes`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
export const learning = (id: string) => api<any[]>(`/fields/${id}/learning`);
export const getSourceReliability = () => api<any[]>('/sources/reliability');
export const getTimeline = (id: string) => api<any[]>(`/fields/${id}/timeline`);

// Neural-Symbolic Language Layer
export const getLLMStatus = () => api<any>('/llm/status');
export const getLLMModels = () => api<{ active_model: string; models: any[]; api_configured: boolean }>('/llm/models');
export const switchLLMModel = (model: string) =>
  api<any>('/llm/model', {
    method: 'POST',
    body: JSON.stringify({ model })
  });
export const consultField = (fieldId: string, query: string, model?: string) =>
  api<any>(`/fields/${fieldId}/consult`, {
    method: 'POST',
    body: JSON.stringify({ query, model })
  });

// Extended Agricultural Platform APIs
export const getKnowledgeGraph = (fieldId: string) => api<any>(`/fields/${fieldId}/graph`);
export const evaluateDomain = (fieldId: string, domain: string, params: any = {}) =>
  api<any>(`/fields/${fieldId}/domain/${domain}`, {
    method: 'POST',
    body: JSON.stringify({ params })
  });
export const getHolisticStatus = (fieldId: string) => api<any>(`/fields/${fieldId}/holistic`);
export const proposeAction = (fieldId: string, actionType: string, proposedParams: any = {}) =>
  api<any>(`/fields/${fieldId}/actions/propose`, {
    method: 'POST',
    body: JSON.stringify({ action_type: actionType, proposed_params: proposedParams })
  });
export const getFieldAnalytics = (fieldId: string) => api<any>(`/fields/${fieldId}/analytics`);
export const checkSensorAnomaly = (fieldId: string, history: number[], currentValue: number, sensorType = 'soil_moisture') =>
  api<any>(`/fields/${fieldId}/analytics/anomaly-check`, {
    method: 'POST',
    body: JSON.stringify({ history, current_value: currentValue, sensor_type: sensorType })
  });
export const replayDecision = (decisionId: string) => api<any>(`/decisions/${decisionId}/replay`);
export const getModelRoutes = () => api<any>('/llm/routes');
export const runBenchmark = () => api<any>('/benchmark/run', { method: 'POST' });
export const getKenyaLocations = () => api<Array<{ key: string; name: string; latitude: number; longitude: number }>>('/locations/kenya');

// Authentication & Farmer Accounts
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  farm_name?: string;
  location_name?: string;
  water_availability?: string;
  initial_crop?: string;
  language?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    language: string;
  };
  farm_id?: string;
  field_id?: string;
}

export const registerUser = (payload: RegisterPayload) =>
  api<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const loginUser = (payload: LoginPayload) =>
  api<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const demoLogin = () =>
  api<AuthResponse>('/auth/demo-login', {
    method: 'POST'
  });

export const adminLogin = () =>
  api<AuthResponse>('/auth/admin-login', {
    method: 'POST'
  });

export const getMe = () =>
  api<{ user: any; farms_count: number }>('/auth/me');

export interface FarmerProfileField {
  id: string;
  name: string;
  crop: string;
  growth_stage: string;
  soil_type: string;
  area_ha?: number;
  decisions_count: number;
  evidence_count: number;
}

export interface FarmerProfileFarm {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  water_availability: string;
  area?: number;
  fields: FarmerProfileField[];
}

export interface FarmerAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  language: string;
  created_at: string;
  farms: FarmerProfileFarm[];
  total_farms: number;
  total_fields: number;
  total_decisions: number;
  total_evidence: number;
}

export const getAdminFarmers = () => api<FarmerAccount[]>('/admin/farmers');

export interface UserProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    language: string;
    created_at?: string;
  };
  farms: Array<{
    id: string;
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
    water_availability: string;
    area?: number;
    fields_count: number;
  }>;
  stats: {
    total_farms: number;
    total_fields: number;
    total_decisions: number;
  };
}

export const getUserProfile = () => api<UserProfileResponse>('/user/profile');

export const updateUserProfile = (payload: { name?: string; language?: string }) =>
  api<{ status: string; user: any; message: string }>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const changeUserPassword = (payload: { current_password: string; new_password: string }) =>
  api<{ status: string; message: string }>('/user/change-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export interface CropItem {
  id: string;
  name: string;
  name_en?: string;
  name_sw?: string;
  counterpart_name?: string;
  detected_language?: string;
  display_name?: string;
  category: string;
  water_demand_level: string;
  root_depth_m: number;
  default_kc_initial: number;
  default_kc_mid: number;
  default_kc_late: number;
  common_stages: string[];
}

export const getCrops = (lang = 'en') => api<CropItem[]>(`/crops?lang=${lang}`);

export const detectCrop = (name: string) => api<{
  matched: boolean;
  canonical_name: string;
  detected_language: string;
  name_en: string;
  name_sw: string;
  counterpart_name: string;
  display_name: string;
  category: string;
  default_kc_initial: number;
  default_kc_mid: number;
  default_kc_late: number;
  root_depth_m: number;
  water_demand_level: string;
  common_stages: string[];
}>(`/crops/detect?name=${encodeURIComponent(name)}`);

export const addCrop = (name: string) =>
  api<CropItem>('/crops', {
    method: 'POST',
    body: JSON.stringify({ name })
  });

