import React, { useState, useRef, useEffect } from 'react';
import { Rocket, Settings, Smartphone, Menu, X, Sun, Globe } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Globe },
    { id: 'upload', label: 'Deploy', icon: Rocket },
    { id: 'history', label: 'Dashboard', icon: Smartphone },
  ];

  const isActive = (view: string) => {
    if (view === 'landing') return currentView === 'landing';
    if (view === 'upload') return ['upload', 'analysis', 'providers'].includes(currentView);
    if (view === 'history') return ['history', 'success'].includes(currentView);
    return false;
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-[var(--z-sticky)] w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-bg/80 backdrop-blur-xl border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8">
        <div className="h-16 md:h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('landing')}
            aria-label="Go to Dashboard"
          >
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary p-[1.5px] transition-all duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                <Rocket className="w-5 h-5 md:w-5.5 md:h-5.5 text-primary group-hover:text-primary-light transition-colors duration-300" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="font-display font-bold text-lg md:text-xl tracking-tight text-text-primary">
                DeployAI
              </span>
              <span className="text-[10px] md:text-[11px] px-2 py-0.5 rounded bg-primary-bg text-primary font-semibold border border-primary/20 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <span className="hidden md:flex items-center gap-1 text-[11px] text-text-muted">
              <Smartphone className="w-3 h-3 text-primary" />
              iQOO Mobile First
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 md:ml-8" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary-bg text-primary border border-primary/20 shadow-sm shadow-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface hover:border-border'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Demo Mode Badge */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-bg border border-success/30 text-success hover:bg-success-bg/80 transition-all duration-200 font-medium"
              title="Platform Settings & API Keys"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-semibold">Demo Mode</span>
            </button>

            {/* Theme Toggle - placeholder for future */}
            <button
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-border-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-200"
              aria-label="Toggle theme"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-border-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-200"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 md:w-10 md:h-10 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-border-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-all duration-200"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* User Profile */}
            <button
              onClick={onOpenSettings}
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors duration-200"
              aria-label="User profile"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="User Avatar"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden animate-slide-down border-t border-border bg-bg-elevated/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary-bg text-primary border border-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-2 border-t border-border" />
              <button
                onClick={() => { onOpenSettings(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-200"
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span>Settings & API Keys</span>
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for mobile menu */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </header>
  );
};