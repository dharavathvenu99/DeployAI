import React, { useEffect, useState, useCallback } from 'react';
import {
  Rocket,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Terminal,
  CheckCircle2,
  XCircle,
  Activity,
  Plus,
} from 'lucide-react';
import { DeploymentData } from '../types';
import { TerminalLogs } from '../components/TerminalLogs';
import { api } from '../services/api';

interface HistoryPageProps {
  onDeployNew: () => void;
  onSelectDeployment: (deployment: DeploymentData) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onDeployNew,
  onSelectDeployment,
}) => {
  const [history, setHistory] = useState<DeploymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLogsDeployment, setSelectedLogsDeployment] = useState<DeploymentData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const successfulCount = history.filter((d) => d.status === 'SUCCESS').length;
  const failedCount = history.filter((d) => d.status === 'FAILED').length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Title & Top Action */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
            Deployment Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Monitor, inspect logs, and redeploy your cloud applications.
          </p>
        </div>

        <button
          onClick={onDeployNew}
          className="px-5 py-3 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center gap-2 shrink-0 group"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Project</span>
        </button>
      </header>

      {/* Metrics Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-labelledby="metrics-title">
        <h3 id="metrics-title" className="sr-only">Dashboard Metrics</h3>
        <article className="glass-card p-4">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">Total Deployed</span>
          <p className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{history.length}</p>
        </article>
        <article className="glass-card p-4">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">Live Edge URLs</span>
          <p className="text-xl sm:text-2xl font-bold text-success mt-1">{successfulCount}</p>
        </article>
        <article className="glass-card p-4">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">Failed Deployments</span>
          <p className="text-xl sm:text-2xl font-bold text-error mt-1">{failedCount}</p>
        </article>
        <article className="glass-card p-4">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">Est. Monthly Cost</span>
          <p className="text-xl sm:text-2xl font-bold text-primary mt-1">₹0.00</p>
        </article>
      </section>

      {/* Deployments List */}
      <section className="glass-card p-5 space-y-4" aria-labelledby="history-title">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span id="history-title">Deployment Activity Stream</span>
          </span>
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-spin" />
            <span>Loading deployment records...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Rocket className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-xs text-text-muted">No projects deployed yet.</p>
            <button
              onClick={onDeployNew}
              className="px-4 py-2 rounded-lg btn btn-primary btn-sm"
            >
              Deploy Your First Codebase
            </button>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Deployments">
            {history.map((dep) => {
              const liveUrl = dep.live_url;
              const isSuccess = dep.status === 'SUCCESS';
              const isFailed = dep.status === 'FAILED';
              const isBuilding = ['QUEUED', 'BUILDING', 'DEPLOYING', 'HEALTH_CHECK'].includes(dep.status);

              return (
                <article
                  key={dep.id}
                  onClick={() => onSelectDeployment(dep)}
                  className="p-4 rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer group glass-card"
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectDeployment(dep)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">{dep.project_name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-primary font-mono border border-border">
                        {dep.framework}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary-bg text-primary border border-primary/20">
                        {dep.provider}
                      </span>
                    </div>

                    {liveUrl && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                        <span className="truncate max-w-[280px] sm:max-w-md text-success group-hover:text-primary transition-colors">
                          {liveUrl}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(liveUrl, dep.id); }}
                          className="p-1.5 rounded hover:bg-surface transition-colors"
                          title="Copy Link"
                          aria-label="Copy deployment URL"
                        >
                          {copiedId === dep.id ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(dep.created_at).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span className="font-mono">{dep.commit_hash}</span>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isSuccess
                        ? 'bg-success-bg text-success border border-success/30'
                        : isFailed
                        ? 'bg-error-bg text-error border border-error/30'
                        : 'bg-primary-bg text-primary border border-primary/30 animate-pulse'
                    }`}>
                      {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isFailed && <XCircle className="w-3.5 h-3.5" />}
                      {isBuilding && <Activity className="w-3.5 h-3.5 animate-spin" />}
                      <span>{dep.status}</span>
                    </span>

                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedLogsDeployment(dep); }}
                      className="p-2 rounded-lg btn btn-ghost btn-sm flex items-center gap-1 hover:bg-surface transition-colors"
                      title="View Build Logs"
                      aria-label={`View logs for ${dep.project_name}`}
                    >
                      <Terminal className="w-3.5 h-3.5 text-primary" />
                      <span className="hidden sm:inline">Logs</span>
                    </button>

                    {liveUrl && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg btn btn-ghost btn-sm border border-primary text-primary hover:bg-primary-bg transition-colors"
                        title="Open Live App"
                        aria-label={`Open ${dep.project_name} live`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Historical Logs Modal */}
      {selectedLogsDeployment && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLogsDeployment(null)} role="dialog" aria-modal="true" aria-labelledby="history-logs-title">
          <div className="relative w-full max-w-2xl glass-card-elevated rounded-2xl p-6 border-primary/20 shadow-xl space-y-4 max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 id="history-logs-title" className="text-sm font-bold text-text-primary">
                  Logs for {selectedLogsDeployment.project_name}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">
                  ID: {selectedLogsDeployment.id} • {selectedLogsDeployment.provider.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLogsDeployment(null)}
                className="px-3 py-1.5 rounded-lg btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <TerminalLogs
                logs={selectedLogsDeployment.logs}
                projectName={selectedLogsDeployment.project_name}
                isCompleted={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};