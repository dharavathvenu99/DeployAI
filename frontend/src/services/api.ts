import { AnalysisData, ProviderOption, DeploymentData, SampleProject, ConfigStatus } from '../types';

// Get the API base URL from environment variables
// In development, Vite proxy handles /api routes to localhost:8001
// In production, VITE_API_URL must be set to the full backend URL.
// Production backend: https://deployai-1-zx6q.onrender.com
// Production frontend: https://deployai-2.onrender.com
const PROD_BACKEND_FALLBACK = 'https://deployai-1-zx6q.onrender.com';

const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  if (envUrl) {
    // Ensure the URL doesn't have trailing slash and includes /api
    const base = envUrl.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }

  // Development fallback - uses Vite proxy configured in vite.config.ts
  if (!import.meta.env.PROD) {
    return '/api';
  }

  // Production without VITE_API_URL: fall back to the known Render backend
  // instead of crashing the whole app (previous code threw here → white screen).
  console.warn(
    `[DeployAI] VITE_API_URL is not set at build time; falling back to ${PROD_BACKEND_FALLBACK}. ` +
    `Set VITE_API_URL=${PROD_BACKEND_FALLBACK} in your Render Static Site env vars and redeploy.`
  );
  return `${PROD_BACKEND_FALLBACK}/api`;
};

const API_BASE = getApiBaseUrl();

// Helper function for fetch with better error handling
async function fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {
        // Response is not JSON, use status text
      }
      throw new Error(errorDetail);
    }
    
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Cannot connect to API at ${API_BASE}. Please check if the backend is running and VITE_API_URL is correctly configured.`);
    }
    throw error;
  }
}

export const api = {
  // Config & Auth
  async getConfigStatus(): Promise<ConfigStatus> {
    const res = await fetchWithErrorHandling(`${API_BASE}/auth/config-status`);
    return res.json();
  },

  async updateKeys(keys: {
    gemini_api_key?: string;
    github_token?: string;
    vercel_token?: string;
    render_api_key?: string;
    netlify_auth_token?: string;
    demo_mode?: boolean;
  }) {
    const res = await fetchWithErrorHandling(`${API_BASE}/auth/keys`, {
      method: 'POST',
      body: JSON.stringify(keys),
    });
    return res.json();
  },

  // Projects & Analysis
  async uploadZip(file: File, name?: string): Promise<AnalysisData> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const res = await fetch(`${API_BASE}/projects/upload-zip`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async connectGithub(github_url: string, repo_branch: string = 'main'): Promise<AnalysisData> {
    const formData = new FormData();
    formData.append('github_url', github_url);
    formData.append('repo_branch', repo_branch);

    const res = await fetch(`${API_BASE}/projects/connect-github`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to connect repository' }));
      throw new Error(err.detail || 'GitHub connect failed');
    }
    return res.json();
  },

  async updateProject(
    projectId: string,
    updates: {
      build_command?: string;
      start_command?: string;
      output_dir?: string;
      port?: number;
      env_vars?: Record<string, string>;
    }
  ) {
    const res = await fetchWithErrorHandling(`${API_BASE}/projects/${projectId}/update`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Providers
  async getProviders(projectId: string): Promise<ProviderOption[]> {
    const res = await fetchWithErrorHandling(`${API_BASE}/providers/recommendations/${projectId}`);
    return res.json();
  },

  // Deployments
  async createDeployment(params: {
    project_id: string;
    provider: string;
    tier_name?: string;
    approve_payment?: boolean;
    custom_domain?: string;
    simulate_error?: boolean;
  }): Promise<DeploymentData> {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/create`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentData> {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/${deploymentId}`);
    return res.json();
  },

  async getHistory(): Promise<DeploymentData[]> {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/history`);
    return res.json();
  },

  async redeploy(deploymentId: string): Promise<DeploymentData> {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/${deploymentId}/redeploy`, {
      method: 'POST',
    });
    return res.json();
  },

  async diagnoseError(deploymentId: string, errorLog: string) {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/${deploymentId}/diagnose`, {
      method: 'POST',
      body: JSON.stringify({ deployment_id: deploymentId, error_log: errorLog }),
    });
    return res.json();
  },

  async checkHealth(deploymentId: string) {
    const res = await fetchWithErrorHandling(`${API_BASE}/deployments/${deploymentId}/health`);
    return res.json();
  },

  // Download project
  async downloadProject(projectId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/download`);
    if (!res.ok) throw new Error('Failed to download project');
    return res.blob();
  },

  // Sample Projects
  async getSamples(): Promise<SampleProject[]> {
    const res = await fetchWithErrorHandling(`${API_BASE}/samples/list`);
    return res.json();
  },

  async loadSample(sampleId: string): Promise<AnalysisData> {
    const res = await fetch(`${API_BASE}/samples/load/${sampleId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to load sample project');
    return res.json();
  },
};