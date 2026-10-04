import React, { useState, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Zap,
  AlertTriangle,
  Bug,
  AlertCircle,
  Globe,
  Server,
} from 'lucide-react';
import { ProviderOption } from '../types';

interface ProvidersPageProps {
  providers: ProviderOption[];
  projectName: string;
  framework: string;
  onDeploy: (providerId: string, tierName: string, approvePayment: boolean, simulateError: boolean) => void;
  onBack: () => void;
}

export const ProvidersPage: React.FC<ProvidersPageProps> = ({
  providers,
  projectName,
  framework,
  onDeploy,
  onBack,
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('Free Tier');
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [paymentApproved, setPaymentApproved] = useState<boolean>(true);
  const [simulateError, setSimulateError] = useState<boolean>(false);

  const activeProvider = selectedProviderId ? providers.find((p) => p.id === selectedProviderId) : null;

  const handleProviderSelect = useCallback((provider: ProviderOption) => {
    if (provider.disabled || !provider.free_tier_available) return;
    setSelectedProviderId(provider.id);
    setSelectedTier(provider.tiers[0]?.tier_name || 'Free Tier');
  }, []);

  const handleStartDeploy = useCallback(() => {
    if (!selectedProviderId) return;
    setShowApprovalModal(true);
  }, [selectedProviderId]);

  const handleConfirmDeploy = useCallback(() => {
    if (!selectedProviderId) return;
    setShowApprovalModal(false);
    onDeploy(selectedProviderId, selectedTier, paymentApproved, simulateError);
  }, [selectedProviderId, selectedTier, paymentApproved, simulateError, onDeploy]);

  const getProviderIcon = (name: string) => {
    const icons: Record<string, React.ReactNode> = {
      Netlify: <Globe className="w-5 h-5" />,
      Vercel: <Zap className="w-5 h-5" />,
      Render: <Server className="w-5 h-5" />,
    };
    return icons[name] || <Server className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Title Header */}
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-bg border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Provider Selection</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-text-primary">
          Select Deployment Provider
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
          Choose a provider for <span className="text-primary font-semibold">{framework}</span>. 
          Netlify deploys real projects; Vercel is a simulated prototype; Render is coming soon.
        </p>
      </header>

      {/* Provider Selector Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-labelledby="providers-title">
        <h3 id="providers-title" className="sr-only">Available Providers</h3>
        {providers.map((p) => {
          const isSelected = p.id === selectedProviderId;
          const isDisabled = p.disabled || !p.free_tier_available;
          return (
            <article
              key={p.id}
              onClick={() => handleProviderSelect(p)}
              className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                isDisabled
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary-bg/50 shadow-lg shadow-primary/10 scale-[1.01]'
                  : 'border-border hover:border-primary hover:shadow-md cursor-pointer'
              }`}
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleProviderSelect(p)}
            >
              {p.is_prototype && (
                <div className="absolute top-3 right-3 bg-warning-bg text-warning text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border border-warning/20">
                  PROTOTYPE
                </div>
              )}
              {p.disabled && (
                <div className="absolute top-3 left-3 bg-text-muted text-[9px] font-extrabold text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  DISABLED
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-bg/50 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getProviderIcon(p.name)}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-success">
                      {p.compatibility_score}%
                    </span>
                    <span className="text-[10px] text-text-muted block">Match</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-text-primary">{p.name}</h4>
                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{p.category}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary">
                    {p.estimated_cost_inr_month === 0 ? '₹0' : `₹${p.estimated_cost_inr_month}`}
                  </span>
                  <span className="text-[10px] text-text-muted"> /mo free tier</span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : isDisabled
                      ? 'border-border bg-surface'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Selected Provider In-Depth Analysis Card */}
      {activeProvider && (
        <section className="glass-card p-6 space-y-6 border-primary/20 animate-slide-up" aria-labelledby="provider-detail-title">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="provider-detail-title" className="text-lg font-bold text-text-primary">{activeProvider.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-bg text-primary font-semibold border border-primary/20">
                  {activeProvider.deploy_badge}
                </span>
                {activeProvider.is_prototype && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-warning-bg text-warning font-semibold border border-warning/20">
                    Simulated Deployment
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {activeProvider.recommended_reason}
              </p>
            </div>

            <div className="text-right sm:text-right shrink-0">
              <span className="text-xs text-text-muted block">Compatibility Score</span>
              <span className="text-2xl font-black text-primary">
                {activeProvider.compatibility_score} / 100
              </span>
            </div>
          </div>

          {/* Pricing Tiers in INR */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-success" />
              Available Hosting Plans (INR)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeProvider.tiers.map((tier, idx) => {
                const isTierSelected = selectedTier === tier.tier_name;
                const isFree = tier.cost_inr_month === 0;
                return (
                  <article
                    key={idx}
                    onClick={() => setSelectedTier(tier.tier_name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                      isTierSelected
                        ? 'border-success/50 bg-success-bg/50'
                        : 'border-border bg-surface hover:bg-surface-hover'
                    }`}
                    role="radio"
                    aria-checked={isTierSelected}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedTier(tier.tier_name)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-text-primary">{tier.tier_name}</span>
                        <span className="text-sm font-extrabold text-success flex items-center gap-1">
                          {isFree ? '₹0' : `₹${tier.cost_inr_month}`}
                          <span className="text-[10px] font-normal text-text-muted">/mo</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary space-y-1 mb-3">
                        <p>Bandwidth: {tier.bandwidth_gb}</p>
                        <p>Build Time: {tier.build_minutes}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-text-secondary pt-2 border-t border-border">
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5 group-hover:text-text-primary transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <article className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-xs font-bold text-success flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Strengths for this project
              </span>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {activeProvider.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-success">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-xs font-bold text-warning flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Trade-offs & Constraints
              </span>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                {activeProvider.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-warning">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Judge Demo Simulation Toggle */}
          <article className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center shrink-0">
                <Bug className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">Judge Demo: Simulate Build Failure</span>
                <p className="text-[11px] text-text-secondary">
                  Injects a realistic compilation error to test the AI Error Diagnoser & 1-Click Fix.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={simulateError}
                onChange={(e) => setSimulateError(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </article>
        </section>
      )}

      {/* Provider Not Selected Warning */}
      {!selectedProviderId && (
        <article className="p-4 rounded-xl bg-warning-bg border border-warning/30 flex items-center gap-3 animate-slide-down" role="alert">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
          <div>
            <span className="text-xs font-bold text-warning block">Select a provider to continue</span>
            <p className="text-[11px] text-text-secondary mt-0.5">Click on Netlify or Vercel (Prototype) to select a deployment target. Render is coming soon.</p>
          </div>
        </article>
      )}

      {/* Bottom Action Footer */}
      <footer className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl btn btn-secondary btn-sm group"
        >
          <ArrowRight className="w-3.5 h-3.5 -rotate-180 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Analysis</span>
        </button>

        <button
          onClick={handleStartDeploy}
          disabled={!selectedProviderId}
          className={`px-8 py-3.5 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center gap-2 group ${
            !selectedProviderId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{selectedProviderId ? `Approve & Deploy to ${activeProvider?.name}` : 'Select Provider First'}</span>
        </button>
      </footer>

      {/* Mandatory User Approval Confirmation Modal */}
      {showApprovalModal && activeProvider && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowApprovalModal(false)} role="dialog" aria-modal="true" aria-labelledby="approval-title">
          <div className="relative w-full max-w-md glass-card-elevated rounded-2xl p-6 border-primary/20 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-success-bg flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 id="approval-title" className="text-base font-bold text-text-primary">Deployment Authorization</h3>
                <p className="text-xs text-text-secondary">Review costs & confirm provisioning</p>
              </div>
            </div>

            {/* Provider Info */}
            <article className="p-3 rounded-xl bg-primary-bg/30 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary">Selected Provider:</span>
                <span className="font-bold text-text-primary">{activeProvider.name}</span>
                {activeProvider.is_prototype && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-warning-bg text-warning font-semibold border border-warning/20">
                    PROTOTYPE - Simulated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary">{activeProvider.recommended_reason}</p>
            </article>

            {/* Payment Sandbox Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-text-secondary">
                <span>Payment Rail:</span>
                <span className="px-2 py-0.5 rounded bg-primary-bg text-primary font-semibold border border-primary/20">
                  Razorpay Sandbox (INR)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-primary/30 bg-primary-bg text-primary font-semibold flex items-center justify-between">
                  <span>Simulated UPI</span>
                  <span className="text-[10px] text-success">test@upi</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-surface text-text-secondary font-medium flex items-center justify-between">
                  <span>Test Card</span>
                  <span className="text-[10px] font-mono text-text-muted">•••• 4242</span>
                </div>
              </div>
            </div>

            <article className="p-4 rounded-xl bg-surface border border-border space-y-2.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Application:</span>
                <span className="font-bold text-text-primary">{projectName}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Provider:</span>
                <span className="font-bold text-primary">{activeProvider.name}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Selected Plan:</span>
                <span className="font-bold text-text-primary">{selectedTier}</span>
              </div>
              <div className="flex justify-between text-text-secondary pt-2 border-t border-border">
                <span>Estimated Cost (INR):</span>
                <span className="font-extrabold text-success text-sm">
                  {selectedTier.includes('Free') || selectedTier.includes('Hobby') ? '₹0.00' : '₹420.00 /mo'}
                </span>
              </div>
              {activeProvider.is_prototype && (
                <div className="flex items-center gap-1.5 text-warning pt-1 border-t border-border">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Demo mode: deployment simulated — no real cloud resources created</span>
                </div>
              )}
            </article>

            <label className="flex items-start gap-2.5 text-xs text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paymentApproved}
                onChange={(e) => setPaymentApproved(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 bg-surface"
              />
              <span>
                I authorize DeployAI to provision this deployment. In Demo Mode, sandbox payment is simulated with zero real charge.
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 py-2.5 rounded-xl btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeploy}
                disabled={!paymentApproved}
                className={`flex-1 py-2.5 rounded-xl btn btn-primary btn-sm shadow-lg flex items-center justify-center gap-2 ${
                  !paymentApproved ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>Authorize & Deploy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};