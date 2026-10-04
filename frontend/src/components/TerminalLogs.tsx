import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal, Copy, Check, Play, Pause } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalLogsProps {
  logs: LogEntry[];
  projectName?: string;
  isCompleted?: boolean;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs, projectName, isCompleted }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [logs, autoScroll, scrollToBottom]);

  const copyAllLogs = useCallback(() => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [logs]);

  const getLogStyle = useCallback((level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-success font-medium';
      case 'ERROR':
        return 'text-error font-semibold bg-error-bg px-1 rounded';
      case 'WARN':
        return 'text-warning';
      case 'BUILD':
        return 'text-primary';
      default:
        return 'text-text-secondary';
    }
  }, []);

  const getStageColor = useCallback((level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-success bg-success-bg';
      case 'ERROR':
        return 'text-error bg-error-bg';
      case 'BUILD':
        return 'text-primary bg-primary-bg';
      case 'WARN':
        return 'text-warning bg-warning-bg';
      default:
        return 'text-text-muted bg-surface';
    }
  }, []);

  const formattedLogs = useMemo(() => logs, [logs]);

  return (
    <section className="w-full rounded-xl overflow-hidden border border-border bg-bg flex flex-col font-mono text-xs" aria-label="Build terminal">
      {/* Terminal Titlebar */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-error/80" />
            <div className="w-3 h-3 rounded-full bg-warning/80" />
            <div className="w-3 h-3 rounded-full bg-success/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 text-text-secondary text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>deployai-build-agent : {projectName || 'build-pipeline'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border transition-all duration-200 ${
              autoScroll
                ? 'bg-primary-bg border-primary/30 text-primary'
                : 'bg-surface border-border text-text-secondary'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll paused'}
            aria-label={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            aria-pressed={autoScroll}
          >
            {autoScroll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className={`p-1.5 rounded-lg border transition-all duration-200 ${
              showTimestamps
                ? 'bg-primary-bg border-primary/30 text-primary'
                : 'bg-surface border-border text-text-secondary'
            }`}
            title={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
            aria-label={showTimestamps ? 'Hide timestamps' : 'Show timestamps'}
            aria-pressed={showTimestamps}
          >
            <span className="text-[10px] font-mono">00:00</span>
          </button>

          <button
            onClick={copyAllLogs}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text-secondary transition-colors text-[10px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>
        </div>
      </header>

      {/* Terminal Body */}
      <div
        ref={terminalBodyRef}
        className="p-4 overflow-y-auto max-h-[380px] min-h-[220px] space-y-1.5 leading-relaxed selection:bg-primary selection:text-white"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {formattedLogs.length === 0 ? (
          <div className="text-text-muted italic py-8 text-center flex flex-col items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Connecting to isolated build container...</span>
          </div>
        ) : (
          formattedLogs.map((log, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 hover:bg-surface/50 px-1 py-0.5 rounded transition-colors"
              style={{ animationDelay: `${index * 10}ms` }}
            >
              {showTimestamps && (
                <span className="text-text-muted text-[10px] shrink-0 select-none pt-0.5 font-mono">
                  {log.timestamp}
                </span>
              )}
              <span className={`text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded select-none ${getStageColor(log.level)}`}>
                {log.stage || log.level}
              </span>
              <span className={`break-all ${getLogStyle(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Status Bar */}
      <footer className="px-4 py-2 bg-surface border-t border-border flex items-center justify-between text-[11px] text-text-secondary">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-success' : 'bg-primary animate-pulse'}`} />
          <span>{isCompleted ? 'Pipeline Completed' : 'Streaming Realtime Logs...'}</span>
        </div>
        <span className="text-[10px] text-text-muted">{formattedLogs.length} events logged</span>
      </footer>
    </section>
  );
};