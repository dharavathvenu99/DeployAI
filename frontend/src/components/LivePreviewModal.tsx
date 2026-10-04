import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ExternalLink, Check, ShieldCheck, Sparkles, BookOpen, ShoppingBag } from 'lucide-react';

interface LivePreviewModalProps {
  url: string;
  projectName: string;
  framework: string;
  onClose: () => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  url,
  projectName,
  framework,
  onClose,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setIframeLoaded(false);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const isEduAI = projectName.toLowerCase().includes('eduai') || framework.toLowerCase().includes('fastapi');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div className="relative w-full max-w-md h-[88vh] max-h-[750px] glass-card-elevated border-2 border-primary/30 shadow-xl flex flex-col overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Phone Mockup Bezel Top */}
        <header className="bg-surface px-6 pt-3 pb-2 flex items-center justify-between border-b border-border select-none">
          {/* Mobile Speaker & Camera Notch */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-text-primary">9:41</span>
            <span className="text-[10px] text-primary font-bold ml-1">5G</span>
          </div>

          <div className="w-20 h-4 bg-surface/50 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-surface border border-border" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`text-text-secondary hover:text-text-primary p-1.5 rounded-lg transition-transform duration-200 ${
                isRefreshing ? 'animate-spin text-primary' : ''
              }`}
              title="Reload Preview"
              aria-label="Reload preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Browser Address Bar */}
        <div className="bg-surface/50 px-4 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-primary/20 text-[11px] text-text-secondary font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="truncate">{url}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-primary-bg text-primary hover:bg-primary/20 transition-colors"
            title="Open in new browser window"
            aria-label="Open in browser"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Interactive Simulated Web App Content */}
        <main className="flex-1 bg-surface overflow-y-auto p-4 flex flex-col text-text-primary" role="document">
          {isEduAI ? (
            /* EduAI Live Demo UI */
            <div className="flex flex-col gap-4">
              <article className="p-4 rounded-xl bg-primary-bg/20 border border-primary/30">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>EduAI Adaptive Engine</span>
                </div>
                <h4 className="text-base font-bold text-text-primary">Active Classroom Session</h4>
                <p className="text-xs text-text-secondary mt-1">
                  Connected to deployed FastAPI backend & SQLite database.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-bg text-success font-medium">
                    Backend Status: 200 OK
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-bg text-primary font-medium">
                    FastAPI v0.111
                  </span>
                </div>
              </article>

              {/* Sample Interactive Quiz Card */}
              <article className="p-4 rounded-xl bg-surface border border-border space-y-3">
                <span className="text-xs text-primary font-bold uppercase tracking-wider block">
                  Live Generated Quiz
                </span>
                <p className="text-sm font-medium text-text-primary">
                  Q1: Which architecture is ideal for serverless React deployments?
                </p>
                <div className="space-y-2">
                  {[
                    { text: 'Global Anycast Edge CDN with Micro-frontends', correct: true },
                    { text: 'Monolithic Heavy Virtual Machine', correct: false },
                    { text: 'Single Threaded FTP Upload', correct: false },
                  ].map((opt, i) => (
                    <button
                      key={i}
                      className={`w-full p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all text-left ${
                        opt.correct
                          ? 'border-success/40 bg-success-bg text-success'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {opt.correct && <Check className="w-4 h-4 text-success" />}
                    </button>
                  ))}
                </div>
              </article>

              <div className="p-3 rounded-lg bg-primary-bg/30 border border-primary/30 text-xs text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Simulated live container response latency: 29ms</span>
              </div>
            </div>
          ) : (
            /* React SwiftCart Live Demo UI */
            <div className="flex flex-col gap-4">
              <article className="p-4 rounded-xl bg-primary-bg/20 border border-primary/30">
                <div className="flex items-center gap-2 text-primary text-xs font-semibold mb-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span>SwiftCart Storefront</span>
                </div>
                <h4 className="text-base font-bold text-text-primary">Modern Mobile Catalog</h4>
                <p className="text-xs text-text-secondary mt-1">
                  Rendered via React 18 & Vite on Edge CDN.
                </p>
              </article>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'iQOO Neo 9 Pro Case', price: '₹799', tag: 'Mobile Gear' },
                  { name: 'GaN 120W Flash Charger', price: '₹2,499', tag: 'Fast Power' },
                  { name: 'ANC Wireless Earbuds', price: '₹3,999', tag: 'Hi-Fi Audio' },
                  { name: 'Smart AI Stylus Pen', price: '₹1,299', tag: 'Stylus' },
                ].map((item, i) => (
                  <article key={i} className="p-3 rounded-lg bg-surface border border-border flex flex-col justify-between">
                    <span className="text-[10px] text-primary font-bold uppercase">{item.tag}</span>
                    <h5 className="text-xs font-bold text-text-primary mt-1 mb-2">{item.name}</h5>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-extrabold text-primary">{item.price}</span>
                      <button className="px-2 py-1 rounded bg-primary hover:bg-primary-dark text-[10px] text-white font-medium">
                        Buy
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Real iframe preview for actual URLs (when not demo) */}
          {!isEduAI && !projectName.includes('SwiftCart') && (
            <div className="flex-1 min-h-[300px]">
              <iframe
                src={url}
                title={`${projectName} live preview`}
                className="w-full h-full rounded-xl border border-border bg-surface"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => setIframeLoaded(true)}
              />
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-xl">
                  <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </main>

        {/* Phone Home Bar */}
        <footer className="bg-surface py-3 flex justify-center border-t border-border">
          <div className="w-32 h-1 bg-surface/50 rounded-full" />
        </footer>
      </div>
    </div>
  );
};