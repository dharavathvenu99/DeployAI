import React from 'react';
import {
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  Zap,
  BarChart3,
  Globe,
  Layers,
} from 'lucide-react';
import { SampleProject } from '../types';

interface LandingPageProps {
  onStartUpload: () => void;
  onConnectGithub: () => void;
  onLoadSample: (sampleId: string) => void;
  samples: SampleProject[];
}

const pipelineSteps = [
  { icon: Cpu, label: '1. AI Analyzes', desc: 'Reads files, detects framework', color: 'primary' },
  { icon: Sparkles, label: '2. Detects Stack', desc: 'Language, deps, build cmd', color: 'accent' },
  { icon: ShieldCheck, label: '3. Select Provider', desc: 'Netlify, Vercel, Render', color: 'success' },
  { icon: CheckCircle2, label: '4. Live URL', desc: 'Health checked & verified', color: 'primary' },
];

const supportedStacks = [
  'React (Vite)', 'Next.js 14', 'FastAPI', 'Python Flask',
  'Node.js / Express', 'Java Spring Boot', 'Docker Container',
  'PostgreSQL & SQLite', 'Netlify', 'Vercel', 'Render',
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartUpload,
  onConnectGithub,
  onLoadSample,
  samples,
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-6 md:py-12 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl animate-slide-up" aria-labelledby="hero-title">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-bg border border-primary/30 text-primary text-xs font-semibold animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DeployAI v2.0 — Enterprise Ready</span>
        </div>

        <h1 id="hero-title" className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-text-primary leading-tight">
          <span className="text-text-primary">
            DeployAI
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto font-medium">
          From code to live URL in minutes. Autonomous AI analysis, multi-provider deployment, and zero-config hosting.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto max-w-md pt-2">
          <button
            onClick={onStartUpload}
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn btn-primary btn-lg shadow-lg group"
            aria-label="Upload ZIP file to deploy"
          >
            <UploadCloud className="w-5 h-5" />
            <span>Upload ZIP</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onConnectGithub}
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn btn-secondary btn-lg group"
            aria-label="Connect GitHub repository"
          >
            <GitBranch className="w-5 h-5 text-primary" />
            <span>Connect GitHub</span>
          </button>

          <button
            onClick={() => onLoadSample('react-ecommerce')}
            className="w-full sm:w-auto px-7 py-4 rounded-xl btn btn-ghost btn-lg border border-primary text-primary hover:bg-primary-bg group"
            aria-label="Try demo project"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Demo</span>
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-text-muted pt-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Zero Cloud Charges (Demo)
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-warning" />
            Sub-minute Deployments
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accent" />
            Edge CDN Global
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            INR Cost Transparency
          </span>
        </div>
      </section>

      {/* Live Pipeline Flow */}
      <section className="w-full animate-slide-up" style={{ animationDelay: '100ms' }} aria-labelledby="pipeline-title">
        <h2 id="pipeline-title" className="sr-only">Deployment Pipeline</h2>
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pipelineSteps.map((item, index) => {
            const Icon = item.icon;
            const colorClasses: Record<string, string> = {
              primary: 'bg-primary-bg text-primary border-primary/20',
              accent: 'bg-accent-bg text-accent border-accent/20',
              success: 'bg-success-bg text-success border-success/20',
              warning: 'bg-warning-bg text-warning border-warning/20',
            };
            return (
              <article
                key={index}
                className="p-5 rounded-2xl glass-card group relative overflow-hidden"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative w-11 h-11 rounded-xl border flex items-center justify-center mb-3">
                  <div className={`w-8 h-8 rounded-lg ${colorClasses[item.color]} flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary mb-1">{item.label}</h4>
                  <p className="text-[11px] text-text-muted leading-snug">{item.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Demo Projects */}
      <section className="w-full animate-slide-up" style={{ animationDelay: '200ms' }} aria-labelledby="samples-title">
        <div className="glass-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <h3 id="samples-title" className="text-lg font-bold text-text-primary">Pre-Bundled Demo Projects</h3>
              </div>
              <p className="text-xs text-text-muted">Test instant inspection and deployment with a single click</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-primary-bg text-primary font-semibold border border-primary/20">
              Instant Test Mode
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {samples.map((sample) => (
              <article
                key={sample.id}
                onClick={() => onLoadSample(sample.id)}
                className="p-5 rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group glass-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onLoadSample(sample.id)}
                aria-label={`Load ${sample.name} demo project`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-primary-bg text-primary border border-primary/20">
                      {sample.badge}
                    </span>
                    <span className="text-[11px] text-primary font-medium group-hover:text-primary-light transition-colors">
                      → {sample.recommended_provider}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                    {sample.name}
                  </h4>
                  <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-text-muted font-mono">{sample.framework}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onLoadSample(sample.id); }}
                    className="px-4 py-2 rounded-lg btn btn-primary btn-sm group"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Stacks */}
      <section className="w-full animate-slide-up" style={{ animationDelay: '300ms' }} aria-labelledby="stacks-title">
        <div className="text-center space-y-4">
          <span className="text-xs uppercase font-bold tracking-widest text-text-muted" id="stacks-title">
            Autonomous Framework & Cloud Stack Support
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {supportedStacks.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface text-text-secondary font-mono hover:border-primary hover:text-primary hover:bg-primary-bg transition-all duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '400ms' }} aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">Key Features</h2>
        {[
          { icon: Layers, title: 'Multi-Framework', desc: 'React, Next.js, FastAPI, Flask, Spring Boot, Docker & more' },
          { icon: Zap, title: 'AI-Powered Analysis', desc: 'Gemini 2.0 Flash detects stack, deps, build config & env vars' },
          { icon: Globe, title: 'Multi-Cloud Deploy', desc: 'Netlify (real), Vercel (simulated), Render (coming soon)' },
        ].map((feature, idx) => (
          <article key={idx} className="glass-card p-5 group">
            <div className="w-10 h-10 rounded-xl bg-primary-bg flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
              <feature.icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-text-primary mb-1">{feature.title}</h4>
            <p className="text-xs text-text-secondary leading-relaxed">{feature.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
};