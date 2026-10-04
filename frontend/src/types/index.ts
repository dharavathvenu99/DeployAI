export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  children?: FileNode[];
}

export interface AnalysisData {
  project_id: string;
  name: string;
  framework: string;
  language: string;
  package_manager: string;
  build_command: string;
  start_command: string;
  output_dir: string;
  port: number;
  database_detected: string;
  env_variables_detected: string[];
  dependencies: string[];
  confidence_score: number;
  ai_summary: string;
  ai_recommendations: string[];
  file_tree: FileNode[];
  total_files: number;
  is_ai_powered: boolean;
}

export interface ProviderTier {
  tier_name: string;
  cost_usd_month: number;
  cost_inr_month: number;
  bandwidth_gb: string;
  build_minutes: string;
  features: string[];
}

export interface ProviderOption {
  id: string;
  name: string;
  logo: string;
  category: string;
  compatibility_score: number;
  is_recommended: boolean;
  free_tier_available: boolean;
  estimated_cost_inr_month: number;
  pros: string[];
  cons: string[];
  recommended_reason: string;
  tiers: ProviderTier[];
  deploy_badge: string;
  is_prototype?: boolean;
  is_connected?: boolean;
  disabled?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'BUILD' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  stage: string;
}

export interface DeploymentData {
  id: string;
  project_id: string;
  project_name: string;
  framework: string;
  provider: string;
  status: 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'HEALTH_CHECK' | 'SUCCESS' | 'FAILED';
  live_url: string | null;
  is_demo: boolean;
  cost_inr: number;
  commit_hash: string;
  logs: LogEntry[];
  error_message: string | null;
  ai_diagnosis: string | null;
  ai_fix_suggestion: string | null;
  created_at: string;
  updated_at: string;
}

export interface SampleProject {
  id: string;
  name: string;
  framework: string;
  description: string;
  language: string;
  recommended_provider: string;
  badge: string;
  icon: string;
  download_url: string;
}

export interface ConfigStatus {
  demo_mode: boolean;
  has_gemini_key: boolean;
  has_github_token: boolean;
  has_vercel_token: boolean;
  has_render_key: boolean;
  has_railway_key: boolean;
  has_netlify_token: boolean;
}