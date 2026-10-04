import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  Layers,
  Key,
  FolderTree,
  ArrowRight,
  Edit3,
  Check,
  ShieldCheck,
  FileText,
  Code2,
  Package,
  Search,
  Zap,
  Key as KeyIcon,
  Copy,
} from 'lucide-react';
import { AnalysisData } from '../types';
import { FileTreeViewer } from '../components/FileTreeViewer';
import { api } from '../services/api';

interface AnalysisPageProps {
  analysis: AnalysisData;
  onProceedToProviders: () => void;
  onBack: () => void;
}

const analysisSteps = [
  { id: 'read', label: 'Reading files', icon: FileText, desc: 'Scanning uploaded ZIP structure' },
  { id: 'language', label: 'Language detected', icon: Code2, desc: 'JavaScript / TypeScript / Python' },
  { id: 'framework', label: 'Framework found', icon: Layers, desc: 'React, Vite, Next.js, FastAPI...' },
  { id: 'deps', label: 'Deps analyzed', icon: Package, desc: 'package.json / requirements.txt' },
  { id: 'build', label: 'Build command', icon: Zap, desc: 'npm run build, pip install...' },
  { id: 'env', label: 'Env vars found', icon: KeyIcon, desc: '.env.example, process.env' },
];

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  analysis,
  onProceedToProviders,
  onBack,
}) => {
  const [buildCommand, setBuildCommand] = useState(analysis.build_command);
  const [startCommand, setStartCommand] = useState(analysis.start_command);
  const [outputDir, setOutputDir] = useState(analysis.output_dir);
  const [port, setPort] = useState(analysis.port);
  const [envVars, setEnvVars] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    analysis.env_variables_detected.forEach((k) => {
      initial[k] = '';
    });
    return initial;
  });
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'config'>('overview');
  const [copiedEnv, setCopiedEnv] = useState<string | null>(null);

  const handleEnvChange = useCallback((key: string, value: string) => {
    setEnvVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveConfig = useCallback(async () => {
    try {
      await api.updateProject(analysis.project_id, {
        build_command: buildCommand,
        start_command: startCommand,
        output_dir: outputDir,
        port: port,
        env_vars: envVars,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }, [analysis.project_id, buildCommand, startCommand, outputDir, port, envVars]);

  const copyEnvKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedEnv(key);
    setTimeout(() => setCopiedEnv(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-slide-up">
      {/* Top Banner with Framework Detected */}
      <section className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" aria-labelledby="analysis-title">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-primary-bg text-primary font-semibold border border-primary/20 uppercase tracking-wider">
              {analysis.is_ai_powered ? 'Gemini AI Verified' : 'Rule Engine Inspected'}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-success-bg text-success font-semibold border border-success/20">
              {(analysis.confidence_score * 100).toFixed(0)}% Match Confidence
            </span>
          </div>

          <h2 id="analysis-title" className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
            {analysis.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            <span className="font-semibold text-primary">{analysis.framework}</span>
            <span className="text-text-muted">•</span>
            <span>{analysis.language}</span>
            <span className="text-text-muted">•</span>
            <span className="font-mono bg-surface px-2 py-0.5 rounded text-[11px] border border-border">
              {analysis.package_manager}
            </span>
            <span className="text-text-muted">•</span>
            <span>{analysis.total_files} files scanned</span>
          </div>
        </div>

        <button
          onClick={onProceedToProviders}
          className="w-full md:w-auto px-7 py-3.5 rounded-xl btn btn-primary btn-lg shadow-lg shrink-0 group"
        >
          <span>Select Provider & Pricing</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {/* Analysis Steps Progress */}
      <section className="glass-card p-5 bg-primary-bg/50 border-primary/20" aria-labelledby="pipeline-title">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Search className="w-4 h-4" />
          <span id="pipeline-title">Analysis Pipeline</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {analysisSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface group">
                <div className="w-7 h-7 rounded-lg bg-primary-bg flex items-center justify-center text-primary">
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-text-primary hidden sm:inline">{step.label}</span>
              </div>
              {idx < analysisSteps.length - 1 && (
                <span className="text-text-muted hidden sm:inline flex items-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tabs Switcher */}
      <div className="flex p-1 rounded-xl border border-border bg-surface text-xs font-semibold max-w-md mx-auto" role="tablist" aria-label="Analysis sections">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          AI Architecture
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'files'}
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'files'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          File Explorer ({analysis.total_files})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'config'}
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-2 rounded-lg transition-all duration-200 ${
            activeTab === 'config'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          Build & Env Config
        </button>
      </div>

      {/* TAB 1: AI Architecture Overview */}
      {activeTab === 'overview' && (
        <section className="space-y-6" role="tabpanel" aria-label="AI Architecture Overview">
          {/* AI Summary Card */}
          <article className="glass-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Architectural Diagnostic Summary</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {analysis.ai_summary}
            </p>
          </article>

          {/* Key Detected Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <article className="glass-card p-4">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Framework</span>
              <p className="text-xs sm:text-sm font-bold text-text-primary mt-1">{analysis.framework}</p>
            </article>
            <article className="glass-card p-4">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Language</span>
              <p className="text-xs sm:text-sm font-bold text-primary mt-1">{analysis.language}</p>
            </article>
            <article className="glass-card p-4">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Database</span>
              <p className="text-xs sm:text-sm font-bold text-primary mt-1 truncate">
                {analysis.database_detected}
              </p>
            </article>
            <article className="glass-card p-4">
              <span className="text-[10px] text-text-muted uppercase font-semibold">Port</span>
              <p className="text-xs sm:text-sm font-bold text-success mt-1 font-mono">
                {analysis.port || 80}
              </p>
            </article>
          </div>

          {/* AI Production Recommendations */}
          <article className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>AI Production Deployment Checklist</span>
            </div>

            <div className="space-y-2.5">
              {analysis.ai_recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border text-xs text-text-secondary group"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-bg text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <span className="leading-snug">{rec}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Top Dependencies Found */}
          {analysis.dependencies.length > 0 && (
            <article className="glass-card p-5 space-y-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                Recognized Dependencies ({analysis.dependencies.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis.dependencies.map((dep, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-surface text-text-secondary font-mono border border-border hover:border-primary hover:text-primary transition-all"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      {/* TAB 2: File Explorer */}
      {activeTab === 'files' && (
        <section className="glass-card p-5 space-y-4" role="tabpanel" aria-label="File Explorer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-primary" />
              Project File Hierarchy
            </span>
            <span className="text-[11px] text-text-muted">{analysis.total_files} items</span>
          </div>

          <FileTreeViewer nodes={analysis.file_tree} />
        </section>
      )}

      {/* TAB 3: Build & Env Config */}
      {activeTab === 'config' && (
        <section className="glass-card p-6 space-y-6" role="tabpanel" aria-label="Build & Environment Configuration">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Execution Commands & Ports</h3>
              <p className="text-xs text-text-secondary">
                Auto-extracted from your project. Customize before deploying.
              </p>
            </div>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-lg btn btn-primary btn-sm flex items-center gap-1.5 group"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-success" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-2">
              <label className="label">Build Command</label>
              <input
                type="text"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                placeholder="npm run build || pip install -r requirements.txt"
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Start Command</label>
              <input
                type="text"
                value={startCommand}
                onChange={(e) => setStartCommand(e.target.value)}
                placeholder="npm start || uvicorn main:app"
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Output Directory</label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="dist || build || ."
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label className="label">Container Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="3000"
                className="input"
                min="1"
                max="65535"
              />
            </div>
          </div>

          {/* Environment Variables Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary" />
                Detected Environment Variables ({analysis.env_variables_detected.length})
              </span>
              <span className="text-[10px] text-text-muted">Injected at build time</span>
            </div>

            {analysis.env_variables_detected.length === 0 ? (
              <p className="text-xs text-text-muted italic py-4 text-center">No environment variables required.</p>
            ) : (
              <div className="space-y-2">
                {analysis.env_variables_detected.map((envKey) => (
                  <div key={envKey} className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => copyEnvKey(envKey)}
                      className="w-1/3 truncate px-3 py-2 rounded-xl bg-surface text-primary font-mono border border-border hover:border-primary hover:bg-surface-hover transition-all flex items-center justify-between"
                      aria-label={`Copy ${envKey}`}
                    >
                      <span className="truncate">{envKey}</span>
                      {copiedEnv === envKey ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </button>
                    <input
                      type="password"
                      placeholder="Value or secret..."
                      value={envVars[envKey] || ''}
                      onChange={(e) => handleEnvChange(envKey, e.target.value)}
                      className="input flex-1"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom Sticky Action Bar */}
      <footer className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl btn btn-secondary btn-sm group"
        >
          <ArrowRight className="w-3.5 h-3.5 -rotate-180 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Upload</span>
        </button>

        <button
          onClick={onProceedToProviders}
          className="px-7 py-3 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center gap-2 group"
        >
          <span>Compare Hosting Providers</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </footer>
    </div>
  );
};