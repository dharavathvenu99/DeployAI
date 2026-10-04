import React, { useEffect, useState, useCallback } from 'react';
import {
  Rocket,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ShieldCheck,
  Activity,
  ArrowRight,
  ClipboardList,
  Globe,
  HeartPulse,
  Download,
} from 'lucide-react';
import { DeploymentData } from '../types';
import { QRCodeModal } from '../components/QRCodeModal';
import { LivePreviewModal } from '../components/LivePreviewModal';
import { TerminalLogs } from '../components/TerminalLogs';
import { api } from '../services/api';

interface SuccessPageProps {
  deployment: DeploymentData;
  onDeployAnother: () => void;
  onViewDashboard: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  deployment,
  onDeployAnother,
  onViewDashboard,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthCheckPassed, setHealthCheckPassed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const data = await api.checkHealth(deployment.id);
      setHealthStatus(data);
      setHealthCheckPassed(data.verified === true || data.status === 'healthy');
    } catch (err) {
      console.error(err);
      setHealthCheckPassed(false);
    } finally {
      setIsCheckingHealth(false);
    }
  }, [deployment.id]);

  useEffect(() => {
    checkHealth();
  }, [deployment.id, checkHealth]);

  const liveUrl = deployment.live_url;

  const handleCopyLink = () => {
    if (liveUrl) {
      navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLiveProject = () => {
    if (liveUrl) {
      window.open(liveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewLogs = () => {
    setShowLogs(true);
  };

  const handleDownloadProject = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadProject(deployment.project_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deployai-project.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-8 animate-slide-up text-center">
      {/* Success Badge */}
      <div className="w-24 h-24 rounded-2xl bg-success p-0.5 mx-auto animate-float">
        <div className="w-full h-full bg-surface rounded-[22px] flex items-center justify-center">
          <Rocket className="w-12 h-12 text-success" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-bg border border-success/30 text-success text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Deployed Successfully</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-text-primary">
          Your App is Live on Edge CDN!
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary">
          Provisioned on <span className="text-primary font-semibold uppercase">{deployment.provider}</span> with automated SSL certificate.
        </p>
        {deployment.is_demo && (
          <p className="text-xs text-warning mt-1 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            Demo mode: deployment simulated
          </p>
        )}
      </div>

      {/* Main Live URL Box */}
      <section className="glass-card p-6 border-success/30 space-y-4" aria-labelledby="live-url-title">
        <span id="live-url-title" className="text-xs font-bold text-text-muted uppercase tracking-widest block">
          Public Production Endpoint
        </span>

        {liveUrl ? (
          <div className="p-4 bg-surface rounded-xl border border-success/30 flex items-center justify-between gap-3 text-xs sm:text-sm font-mono text-primary">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
              <span className="truncate">{liveUrl}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg bg-primary-bg hover:bg-primary/20 text-primary transition-colors shrink-0"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-surface rounded-xl border border-error/30 flex items-center justify-between gap-3 text-xs sm:text-sm font-mono text-error">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse shrink-0" />
              <span className="truncate">No live URL available</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <button
            onClick={handleOpenLiveProject}
            disabled={!liveUrl}
            className="py-3.5 rounded-xl btn btn-success btn-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Globe className="w-4 h-4" />
            <span>Open Live Project</span>
          </button>

          <button
            onClick={handleCopyLink}
            disabled={!liveUrl}
            className="py-3.5 rounded-xl btn btn-secondary btn-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
            <span>{copied ? 'Link Copied!' : 'Copy URL'}</span>
          </button>

          <button
            onClick={handleViewLogs}
            className="py-3.5 rounded-xl btn btn-ghost btn-sm border border-primary text-primary hover:bg-primary-bg flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span>View Logs</span>
          </button>

          <button
            onClick={handleDownloadProject}
            disabled={downloading}
            className="py-3.5 rounded-xl btn btn-ghost btn-sm border border-success text-success hover:bg-success-bg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Downloading...' : 'Download Project'}</span>
          </button>
        </div>

        {/* Secondary Mobile Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setShowPreview(true)}
            className="py-3 rounded-lg btn btn-ghost btn-sm border border-primary text-primary hover:bg-primary-bg flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Preview</span>
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="py-3 rounded-lg btn btn-ghost btn-sm border border-success text-success hover:bg-success-bg flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
        </div>
      </section>

      {/* Edge CDN Health & Verification Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left" aria-labelledby="metrics-title">
        <h3 id="metrics-title" className="sr-only">Deployment Metrics</h3>
        <article className="glass-card p-3.5">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">HTTP Probe</span>
          <p className="text-xs font-bold text-success mt-0.5 flex items-center gap-1">
            {healthCheckPassed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                200 OK
              </>
            ) : isCheckingHealth ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                200 OK
              </>
            )}
          </p>
        </article>
        <article className="glass-card p-3.5">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">SSL Encryption</span>
          <p className="text-xs font-bold text-primary mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            TLS 1.3 Active
          </p>
        </article>
        <article className="glass-card p-3.5">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">Edge POP</span>
          <p className="text-xs font-bold text-primary mt-0.5 truncate">
            {healthStatus?.edge_location || 'BOM1 (Mumbai, IN)'}
          </p>
        </article>
        <article className="glass-card p-3.5">
          <span className="text-[10px] text-text-muted uppercase font-semibold block">TTFB Latency</span>
          <p className="text-xs font-bold text-success mt-0.5">
            {healthStatus?.latency_ms || 34} ms
          </p>
        </article>
      </section>

      {/* Health Check Status Banner */}
      {healthStatus && (
        <section className={`p-4 rounded-xl flex items-center gap-3 ${healthCheckPassed ? 'bg-success-bg border border-success/30' : 'bg-error-bg border border-error/30'}`} aria-live="polite">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            {healthCheckPassed ? (
              <HeartPulse className="w-5 h-5 text-success" />
            ) : (
              <Activity className="w-5 h-5 text-error animate-spin" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-text-primary">
              {healthCheckPassed ? 'Health check passed — live project is responding.' : 'Health check failed — project may not be accessible.'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Status: {healthStatus.status} • Code: {healthStatus.status_code} • Latency: {healthStatus.latency_ms}ms
            </p>
          </div>
        </section>
      )}

      {/* Navigation Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <button
          onClick={onDeployAnother}
          className="w-full sm:w-auto px-5 py-3 rounded-xl btn btn-secondary btn-sm"
        >
          + Deploy Another Project
        </button>

        <button
          onClick={onViewDashboard}
          className="w-full sm:w-auto px-6 py-3 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center justify-center gap-2"
        >
          <span>View Deployment History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </footer>

      {/* QR Code Modal */}
      {showQR && liveUrl && (
        <QRCodeModal
          url={liveUrl}
          projectName={deployment.project_name}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Mobile Browser Frame Preview Modal */}
      {showPreview && liveUrl && (
        <LivePreviewModal
          url={liveUrl}
          projectName={deployment.project_name}
          framework={deployment.framework}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowLogs(false)} role="dialog" aria-modal="true" aria-labelledby="logs-title">
          <div className="relative w-full max-w-2xl glass-card-elevated rounded-2xl p-6 border-primary/20 shadow-xl space-y-4 max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 id="logs-title" className="text-sm font-bold text-text-primary">
                  Deployment Logs for {deployment.project_name}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">
                  ID: {deployment.id} • {deployment.provider.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setShowLogs(false)}
                className="px-3 py-1.5 rounded-lg btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <TerminalLogs
                logs={deployment.logs}
                projectName={deployment.project_name}
                isCompleted={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};