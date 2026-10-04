import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthSettingsModal } from './components/AuthSettingsModal';
import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { DeployingPage } from './pages/DeployingPage';
import { SuccessPage } from './pages/SuccessPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalysisData, ProviderOption, DeploymentData, SampleProject } from './types';
import { api } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisData | null>(null);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null);
  const [latestSuccessfulDeployment, setLatestSuccessfulDeployment] = useState<DeploymentData | null>(null);
  const [samples, setSamples] = useState<SampleProject[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const sampleList = await api.getSamples().catch(() => []);
      setSamples(sampleList);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }, []);

  useEffect(() => {
    // Load samples on startup
    fetchInitialData();
  }, [fetchInitialData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1-Click Load Sample
  const handleLoadSample = async (sampleId: string) => {
    try {
      showToast(`Loading ${sampleId} sample project...`);
      const analysis = await api.loadSample(sampleId);
      setActiveAnalysis(analysis);
      setCurrentView('analysis');
    } catch (err: any) {
      showToast(err.message || 'Error loading sample');
    }
  };

  // Analysis Complete Handler
  const handleAnalysisComplete = async (data: AnalysisData) => {
    setActiveAnalysis(data);
    setCurrentView('analysis');
  };

  // Proceed to Provider Comparison
  const handleProceedToProviders = async () => {
    if (!activeAnalysis) return;
    try {
      showToast('Calculating provider compatibility & pricing...');
      const providerList = await api.getProviders(activeAnalysis.project_id);
      setProviders(providerList);
      setCurrentView('providers');
    } catch (err: any) {
      showToast(err.message || 'Error fetching providers');
    }
  };

  // Trigger Deployment
  const handleTriggerDeploy = async (
    providerId: string,
    tierName: string,
    approvePayment: boolean,
    simulateError: boolean
  ) => {
    if (!activeAnalysis) return;
    try {
      showToast(`Deploying to ${providerId.toUpperCase()}...`);
      const dep = await api.createDeployment({
        project_id: activeAnalysis.project_id,
        provider: providerId,
        tier_name: tierName,
        approve_payment: approvePayment,
        simulate_error: simulateError,
      });
      setActiveDeploymentId(dep.id);
      setCurrentView('deploying');
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger deployment');
    }
  };

  // Deployment Success Handler
  const handleDeploySuccess = (deployment: DeploymentData) => {
    setLatestSuccessfulDeployment(deployment);
    setCurrentView('success');
  };

  // Redeploy Handler
  const handleRedeploy = (newDeploymentId: string) => {
    setActiveDeploymentId(newDeploymentId);
    setCurrentView('deploying');
  };

  return (
<div className="min-h-screen min-h-[100dvh] flex flex-col bg-bg text-text-primary selection:bg-primary selection:text-white">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onNavigate={setCurrentView}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Main Responsive View Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-20 md:pb-8 pt-4">
        {currentView === 'landing' && (
          <LandingPage
            onStartUpload={() => setCurrentView('upload')}
            onConnectGithub={() => setCurrentView('upload')}
            onLoadSample={handleLoadSample}
            samples={samples}
          />
        )}

        {currentView === 'upload' && (
          <UploadPage
            onAnalysisComplete={handleAnalysisComplete}
            samples={samples}
            onLoadSample={handleLoadSample}
          />
        )}

        {currentView === 'analysis' && activeAnalysis && (
          <AnalysisPage
            analysis={activeAnalysis}
            onProceedToProviders={handleProceedToProviders}
            onBack={() => setCurrentView('upload')}
          />
        )}

        {currentView === 'providers' && activeAnalysis && (
          <ProvidersPage
            providers={providers}
            projectName={activeAnalysis.name}
            framework={activeAnalysis.framework}
            onDeploy={handleTriggerDeploy}
            onBack={() => setCurrentView('analysis')}
          />
        )}

        {currentView === 'deploying' && activeDeploymentId && (
          <DeployingPage
            deploymentId={activeDeploymentId}
            onDeploySuccess={handleDeploySuccess}
            onRedeploy={handleRedeploy}
          />
        )}

        {currentView === 'success' && latestSuccessfulDeployment && (
          <SuccessPage
            deployment={latestSuccessfulDeployment}
            onDeployAnother={() => setCurrentView('upload')}
            onViewDashboard={() => setCurrentView('history')}
          />
        )}

        {currentView === 'history' && (
          <HistoryPage
            onDeployNew={() => setCurrentView('upload')}
            onSelectDeployment={(dep) => {
              if (dep.status === 'SUCCESS') {
                setLatestSuccessfulDeployment(dep);
                setCurrentView('success');
              } else {
                setActiveDeploymentId(dep.id);
                setCurrentView('deploying');
              }
            }}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation for iQOO Phones */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSettings={() => setShowSettings(true)}
        hasActiveDeployment={currentView === 'deploying'}
      />

      {/* Settings / API Keys Modal */}
      {showSettings && (
        <AuthSettingsModal
          onClose={() => setShowSettings(false)}
          onRefreshConfig={fetchInitialData}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl card-elevated border-l-4 border-primary text-sm font-medium text-text-primary shadow-xl animate-slide-up flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
