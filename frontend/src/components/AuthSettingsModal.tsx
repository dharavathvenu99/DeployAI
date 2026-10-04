import React, { useState, useEffect, useRef } from 'react';
import { X, Key, Shield, Check, Sparkles, RefreshCw, Globe, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface AuthSettingsModalProps {
  onClose: () => void;
  onRefreshConfig?: () => void;
}

export const AuthSettingsModal: React.FC<AuthSettingsModalProps> = ({ onClose, onRefreshConfig }) => {
  const [demoMode, setDemoMode] = useState(true);
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [renderKey, setRenderKey] = useState('');
  const [netlifyToken, setNetlifyToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const fields = [
    { key: 'netlifyToken', label: 'Netlify Auth Token', placeholder: 'nfp_...', icon: Globe, iconColor: 'text-success', required: 'Required for real Netlify deployments', type: 'token' },
    { key: 'geminiKey', label: 'Google Gemini API Key', placeholder: 'AIzaSy...', icon: Sparkles, iconColor: 'text-primary', required: 'Optional (uses heuristic if omitted)', type: 'api' },
    { key: 'githubToken', label: 'GitHub Personal Access Token', placeholder: 'ghp_...', icon: Globe, iconColor: 'text-text-secondary', required: 'Optional for private repos', type: 'token' },
    { key: 'vercelToken', label: 'Vercel Deploy Token', placeholder: 'vercel_tok_...', icon: Globe, iconColor: 'text-text-secondary', required: 'Optional (for real Vercel deployments)', type: 'token' },
    { key: 'renderKey', label: 'Render Cloud API Key', placeholder: 'rnd_...', icon: Globe, iconColor: 'text-text-secondary', required: 'Optional (for live Render deploys)', type: 'token' },
  ];

  useEffect(() => {
    firstInputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { 
      document.body.style.overflow = ''; 
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateKeys({
        gemini_api_key: geminiKey || undefined,
        github_token: githubToken || undefined,
        vercel_token: vercelToken || undefined,
        render_api_key: renderKey || undefined,
        netlify_auth_token: netlifyToken || undefined,
        demo_mode: demoMode,
      });
      setSaveSuccess(true);
      if (onRefreshConfig) onRefreshConfig();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (value: string, fieldName: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] glass-card-elevated rounded-2xl p-6 overflow-y-auto animate-scale-in border-primary/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all duration-200"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-bg flex items-center justify-center text-primary">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 id="settings-title" className="text-lg font-bold text-text-primary">Platform Settings & Credentials</h3>
            <p className="text-xs text-text-secondary">Configure Demo Mode and Cloud Integrations</p>
          </div>
        </div>

        {/* Demo Mode Banner */}
        <div className="p-4 rounded-xl bg-success-bg border border-success/30 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success animate-pulse shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-success">Demo Mode</h4>
                <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                  Safe simulation of AI analysis, INR cost estimation, and container builds with zero cloud charges.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {fields.map((field) => {
            const value = {
              netlifyToken,
              geminiKey,
              githubToken,
              vercelToken,
              renderKey,
            }[field.key] as string;

            const setValue = {
              netlifyToken: setNetlifyToken,
              geminiKey: setGeminiKey,
              githubToken: setGithubToken,
              vercelToken: setVercelToken,
              renderKey: setRenderKey,
            }[field.key] as (value: string) => void;

            const Icon = field.icon;
            const isVisible = showPasswords[field.key];

            return (
              <div key={field.key} className="space-y-2">
                <label className="label flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${field.iconColor}`} />
                    {field.label}
                  </span>
                  <span className="text-[10px] font-normal text-text-muted">{field.required}</span>
                </label>
                <div className="relative">
                  <input
                    ref={field.key === 'netlifyToken' ? firstInputRef : undefined}
                    type={isVisible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={field.placeholder}
                    className="input pr-12"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, [field.key]: !isVisible }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {value && copiedField !== field.key && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(value, field.key)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary transition-colors"
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {copiedField === field.key && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-success font-medium animate-fade-in">
                      <CheckCircle className="w-3 h-3" />
                      Copied
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-muted">Stored server-side only. Never exposed to frontend.</p>
              </div>
            );
          })}

          {/* Notice */}
          <div className="p-3 rounded-xl bg-surface border border-border text-text-secondary text-[11px] flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span>Tokens are stored only in server-side memory & never sent to client code.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl btn btn-primary btn-sm shadow-md flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};