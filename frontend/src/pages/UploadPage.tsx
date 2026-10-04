import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileArchive,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { api } from '../services/api';
import { AnalysisData, SampleProject } from '../types';

interface UploadPageProps {
  onAnalysisComplete: (data: AnalysisData) => void;
  samples: SampleProject[];
  onLoadSample: (sampleId: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  onAnalysisComplete,
  samples,
  onLoadSample,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'github'>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [repoBranch, setRepoBranch] = useState('main');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid .zip archive file.');
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('Please upload a valid .zip archive file.');
      }
    }
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startProgressSimulation = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
    progressIntervalRef.current = interval;
    return interval;
  };

  const handleUploadZip = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Uploading and unzipping project safely...');
    const interval = startProgressSimulation();

    try {
      setTimeout(() => setLoadingStep('Scanning manifests & AST structure...'), 800);
      setTimeout(() => setLoadingStep('Running AI framework & dependency detection...'), 1600);

      const result = await api.uploadZip(selectedFile);
      clearInterval(interval);
      setUploadProgress(100);
      onAnalysisComplete(result);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      setErrorMessage(err.message || 'Error inspecting zip file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Connecting to GitHub API repository...');
    const interval = startProgressSimulation();

    try {
      setTimeout(() => setLoadingStep('Analyzing repository tree & package definitions...'), 900);
      setTimeout(() => setLoadingStep('Synthesizing Gemini cloud architecture recommendations...'), 1700);

      const result = await api.connectGithub(githubUrl, repoBranch);
      clearInterval(interval);
      setUploadProgress(100);
      onAnalysisComplete(result);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      setErrorMessage(err.message || 'Error fetching GitHub repository');
    } finally {
      setIsLoading(false);
    }
  };

  const validateGithubUrl = (url: string) => {
    const patterns = [
      /^https:\/\/github\.com\/[\w-]+\/[\w.-]+/,
      /^[\w-]+\/[\w.-]+$/,
    ];
    return patterns.some((pattern) => pattern.test(url.trim()));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Title Header */}
      <header className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
          Deploy Your Application
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
          Upload your project ZIP or connect a GitHub repository for autonomous AI inspection.
        </p>
      </header>

      {/* Tab Switcher */}
      <div className="flex p-1.5 rounded-xl border border-border bg-surface max-w-sm mx-auto" role="tablist" aria-label="Upload method">
        <button
          role="tab"
          aria-selected={activeTab === 'zip'}
          onClick={() => {
            setActiveTab('zip');
            setErrorMessage(null);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'zip'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload ZIP</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'github'}
          onClick={() => {
            setActiveTab('github');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'github'
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>GitHub Repo</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-error-bg border border-error/30 text-error text-xs flex items-center gap-3 animate-slide-down" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto p-1 rounded hover:bg-error-bg/50 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ZIP Upload Dropzone */}
      {activeTab === 'zip' && (
        <section className="glass-card p-6 sm:p-8 space-y-6" aria-labelledby="zip-upload-title">
          <h3 id="zip-upload-title" className="sr-only">ZIP File Upload</h3>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
              dragActive
                ? 'border-primary bg-primary-bg/50'
                : selectedFile
                ? 'border-primary bg-primary-bg/30'
                : 'border-border hover:border-primary hover:bg-surface'
            } ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isLoading && fileInputRef.current?.click()}
            aria-label="Drop zone for ZIP file upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Select ZIP file"
              disabled={isLoading}
            />

            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-300">
              {selectedFile ? (
                <div className="w-full h-full bg-primary-bg rounded-lg flex items-center justify-center group">
                  <FileArchive className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="w-full h-full bg-primary-bg rounded-lg flex items-center justify-center group">
                  <UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            <div className="w-full max-w-md">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-text-primary">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <p className="text-xs text-text-muted font-mono text-center">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Ready to analyze
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="mt-2 mx-auto px-3 py-1 rounded-full bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary text-[11px] font-medium transition-colors flex items-center gap-1"
                    aria-label="Remove file"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-sm font-bold text-text-primary block">
                    Tap to browse or drop ZIP file here
                  </span>
                  <p className="text-xs text-text-muted">
                    Supports React, Next.js, FastAPI, Flask, Node, Docker archives
                  </p>
                </div>
              )}
            </div>

            <span className="text-[11px] px-3 py-1 rounded-full bg-surface text-text-muted border border-border">
              Safe Path-Traversal Sanitized
            </span>
          </div>

          {/* Progress Bar */}
          {(isLoading || uploadProgress > 0) && (
            <div className="w-full space-y-2" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{loadingStep || 'Analyzing project...'}</span>
                <span className="text-text-muted font-mono">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUploadZip}
            disabled={!selectedFile || isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
              selectedFile && !isLoading
                ? 'btn btn-primary btn-lg shadow-lg group'
                : 'btn btn-ghost btn-lg cursor-not-allowed opacity-50'
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingStep || 'Analyzing project...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Run AI Project Analysis</span>
              </>
            )}
          </button>
        </section>
      )}

      {/* GitHub Connection */}
      {activeTab === 'github' && (
        <section className="glass-card p-6 sm:p-8 space-y-6" aria-labelledby="github-upload-title">
          <h3 id="github-upload-title" className="sr-only">GitHub Repository Connection</h3>
          <form onSubmit={handleConnectGithub} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <span>GitHub Repository URL</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo or owner/repo"
                    className="input pr-12"
                    required
                    disabled={isLoading}
                    aria-describedby="github-url-hint"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {githubUrl && validateGithubUrl(githubUrl) && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                    {githubUrl && !validateGithubUrl(githubUrl) && (
                      <AlertCircle className="w-4 h-4 text-error" />
                    )}
                  </div>
                </div>
                <p id="github-url-hint" className="text-[10px] text-text-muted">
                  Public repositories work without token. Private repos need GitHub token in Settings.
                </p>
              </div>

              <div className="space-y-2">
                <label className="label">Target Git Branch</label>
                <input
                  type="text"
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="main"
                  className="input"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Progress Bar */}
            {(isLoading || uploadProgress > 0) && (
              <div className="w-full space-y-2" role="progressbar" aria-valuenow={Math.round(uploadProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="GitHub analysis progress">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{loadingStep || 'Connecting to GitHub...'}</span>
                  <span className="text-text-muted font-mono">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!githubUrl || isLoading || !validateGithubUrl(githubUrl)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                githubUrl && !isLoading && validateGithubUrl(githubUrl)
                  ? 'btn btn-primary btn-lg shadow-lg group'
                  : 'btn btn-ghost btn-lg cursor-not-allowed opacity-50'
              }`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingStep || 'Connecting GitHub...'}</span>
                </>
              ) : (
                <>
                  <GithubIcon className="w-4 h-4" />
                  <span>Fetch & Analyze Repository</span>
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* Sample Projects Gallery */}
      <section className="space-y-4" aria-labelledby="samples-title">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Demo Quick Test
          </span>
          <span className="text-[11px] text-primary">Pre-configured</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {samples.map((sample) => (
            <article
              key={sample.id}
              onClick={() => onLoadSample(sample.id)}
              className="p-4 rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group glass-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onLoadSample(sample.id)}
              aria-label={`Load ${sample.name} demo project`}
            >
              <div>
                <span className="text-[10px] text-primary font-mono uppercase font-semibold block mb-1">
                  {sample.badge}
                </span>
                <h4 className="text-xs font-bold text-text-primary hover:text-primary transition-colors mb-1">
                  {sample.name}
                </h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
                <span className="truncate font-mono">{sample.framework}</span>
                <span className="font-bold hover:text-primary transition-colors flex items-center gap-1">
                  Load
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};