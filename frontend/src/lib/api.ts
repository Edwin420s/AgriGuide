const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const r = await fetch(API + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(errorText || `API error ${r.status}`);
  }
  return r.json();
}

// Fields & Farms
export const getFarms = () => api<any[]>('/farms');
export const getFields = () => api<any[]>('/fields');
export const getField = (id: string) => api<any>(`/fields/${id}`);
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

// Learning, Outcomes & Source Reliability
export const outcome = (id: string, data: any) =>
  api<any>(`/decisions/${id}/outcomes`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
export const learning = (id: string) => api<any[]>(`/fields/${id}/learning`);
export const getSourceReliability = () => api<any[]>('/sources/reliability');
export const getTimeline = (id: string) => api<any[]>(`/fields/${id}/timeline`);

// SingularityNET / ASI Cloud Neural-Symbolic Language Layer
export const getLLMStatus = () => api<any>('/llm/status');
export const consultField = (fieldId: string, query: string) =>
  api<any>(`/fields/${fieldId}/consult`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });

