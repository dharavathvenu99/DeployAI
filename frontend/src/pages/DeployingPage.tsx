import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Wrench,
  Package,
  Upload,
  Server,
  HeartPulse,
  Globe,
  Loader2,
} from 'lucide-react';
import { DeploymentData } from '../types';
import { TerminalLogs } from '../components/TerminalLogs';
import { api } from '../services/api';

interface DeployingPageProps {
  deploymentId: string;
  onDeploySuccess: (deployment: DeploymentData) => void;
  onRedeploy: (newDeploymentId: string) => void;
}

const deploymentStages = [
  { id: 'prepare', label: 'Preparing project', desc: 'Initializing build environment', icon: Package },
  { id: 'static', label: 'Preparing static files', desc: 'Bundling and optimizing assets', icon: Package },
  { id: 'create', label: 'Creating deployment', desc: 'Provisioning provider resources', icon: Server },
  { id: 'upload', label: 'Uploading files', desc: 'Transferring build artifacts', icon: Upload },
  { id: 'wait', label: 'Waiting for provider', desc: 'Provider processing deployment', icon: Activity },
  { id: 'health', label: 'Running health check', desc: 'Verifying live endpoint', icon: HeartPulse },
  { id: 'complete', label: 'Deployment complete', desc: 'Live URL ready', icon: Globe },
];

export const DeployingPage: React.FC<DeployingPageProps> = ({
  deploymentId,
  onDeploySuccess,
  onRedeploy,
}) => {
  const [deployment, setDeployment] = useState<DeploymentData | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchStatus = async () => {
      try {
        const data = await api.getDeploymentStatus(deploymentId);
        setDeployment(data);

        if (data.status === 'SUCCESS') {
          if (interval) clearInterval(interval);
          setTimeout(() => {
            onDeploySuccess(data);
          }, 1400);
        } else if (data.status === 'FAILED') {
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        console.error('Error fetching deployment status:', err);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 1500);

    return () => { if (interval) clearInterval(interval); };
  }, [deploymentId, onDeploySuccess]);

  const handleFixAndRedeploy = async () => {
    setIsRetrying(true);
    try {
      const redone = await api.redeploy(deploymentId);
      onRedeploy(redone.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStageStatus = (stageId: string) => {
    if (!deployment) return 'waiting';
    const status = deployment.status;
    const logs = deployment.logs;

    const stageLogMap: Record<string, string[]> = {
      prepare: ['INIT', 'QUEUE'],
      static: ['VALIDATE', 'DEPS'],
      create: ['BUILD', 'OPTIMIZE'],
      upload: ['PROVISION'],
      wait: ['PROVISION', 'DEPLOYING'],
      health: ['HEALTH_CHECK'],
      complete: ['DONE', 'SUCCESS'],
    };

    const relevantStages = stageLogMap[stageId] || [];
    const hasLog = logs.some((l) => relevantStages.includes(l.stage));
    const isFailed = status === 'FAILED';

    if (status === 'SUCCESS') return 'completed';
    if (isFailed && logs[logs.length - 1]?.stage === 'ERROR') return 'failed';
    if (hasLog) return 'active';
    return 'waiting';
  };

  const getStageColor = (state: string) => {
    switch (state) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'failed': return 'error';
      default: return 'muted';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-slide-up">
      {/* Title & Status Banner */}
      <section className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" aria-labelledby="deployment-title">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${deployment?.status === 'SUCCESS' ? 'bg-success' : deployment?.status === 'FAILED' ? 'bg-error' : 'bg-primary animate-pulse'}`} />
            <h2 id="deployment-title" className="text-xl sm:text-2xl font-display font-extrabold text-text-primary">
              {deployment?.project_name || 'Deploying Project...'}
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Target: <span className="text-primary font-semibold uppercase">{deployment?.provider || 'Cloud'}</span> • ID: <span className="font-mono text-primary">{deploymentId}</span>
          </p>
        </div>

        <div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            deployment?.status === 'SUCCESS'
              ? 'bg-success-bg text-success border border-success/30'
              : deployment?.status === 'FAILED'
              ? 'bg-error-bg text-error border border-error/30'
              : 'bg-primary-bg text-primary border border-primary/30 animate-pulse'
          }`}>
            {deployment?.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4" />}
            {deployment?.status === 'FAILED' && <XCircle className="w-4 h-4" />}
            {deployment?.status !== 'SUCCESS' && deployment?.status !== 'FAILED' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{deployment?.status || 'INITIALIZING'}</span>
          </span>
        </div>
      </section>

      {/* Visual Pipeline Stages */}
      <section className="space-y-3" aria-labelledby="pipeline-title">
        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <Activity className="w-4 h-4" />
          <span id="pipeline-title">Deployment Pipeline</span>
        </div>

        <div className="space-y-2" role="list" aria-label="Deployment stages">
          {deploymentStages.map((st, idx) => {
            const stState = getStageStatus(st.id);
            const Icon = st.icon;
            const color = getStageColor(stState);
            const colorClasses = {
              success: 'border-success/40 bg-success-bg/30',
              primary: 'border-primary/60 bg-primary-bg/30',
              error: 'border-error/60 bg-error-bg/30',
              muted: 'border-border bg-surface',
            };

            return (
              <article
                key={st.id}
                className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 ${colorClasses[color]}`}
                role="listitem"
                aria-label={`Stage ${idx + 1}: ${st.label} - ${stState}`}
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
                  {stState === 'completed' ? (
                    <CheckCircle2 className="w-5.5 h-5.5 text-success" />
                  ) : stState === 'active' ? (
                    <Loader2 className="w-5.5 h-5.5 text-primary animate-spin" />
                  ) : stState === 'failed' ? (
                    <XCircle className="w-5.5 h-5.5 text-error" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-primary-bg flex items-center justify-center text-primary">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-text-muted">0{idx + 1}</span>
                    <h5 className="text-xs font-bold text-text-primary truncate">{st.label}</h5>
                    {stState === 'active' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary-bg text-primary font-medium">IN PROGRESS</span>
                    )}
                    {stState === 'completed' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-success-bg text-success font-medium">DONE</span>
                    )}
                    {stState === 'failed' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-error-bg text-error font-medium">FAILED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-1">{st.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Live Terminal Output */}
      <section className="glass-card overflow-hidden" aria-labelledby="terminal-title">
        <TerminalLogs
          logs={deployment?.logs || []}
          projectName={deployment?.project_name}
          isCompleted={deployment?.status === 'SUCCESS' || deployment?.status === 'FAILED'}
        />
      </section>

      {/* AI Error Diagnosis & 1-Click Repair Section (Shown on failure) */}
      {deployment?.status === 'FAILED' && (
        <section className="glass-card p-6 border-error/30 space-y-4 animate-slide-up" aria-labelledby="error-title">
          <div className="flex items-center gap-2.5 text-error">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h3 id="error-title" className="text-base font-bold text-text-primary">AI Deployment Error Diagnoser</h3>
          </div>

          <div className="p-4 rounded-xl bg-error-bg border border-error/20 text-xs text-error font-mono break-all">
            {deployment.error_message || 'Compilation build process failed with non-zero exit code.'}
          </div>

          {/* AI Root Cause & Suggested Fix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <article className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
              <span className="text-primary font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Root Cause Analysis
              </span>
              <p className="text-text-secondary leading-relaxed">
                {deployment.ai_diagnosis || 'A required package or type definition was missing from the deployment manifest.'}
              </p>
            </article>

            <article className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
              <span className="text-success font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Recommended Automated Fix
              </span>
              <p className="text-text-secondary leading-relaxed font-mono text-[11px] bg-surface p-2 rounded-lg border border-border">
                {deployment.ai_fix_suggestion || 'npm install --save missing-package || pip install -r requirements.txt'}
              </p>
            </article>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleFixAndRedeploy}
              disabled={isRetrying}
              className="px-6 py-3 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center gap-2 group"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Applying Fix...' : 'Apply AI Fix & Redeploy'}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};