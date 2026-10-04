import React from 'react';
import { Home, UploadCloud, Activity, History, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
  hasActiveDeployment?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  hasActiveDeployment,
}) => {
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'upload', label: 'Deploy', icon: UploadCloud, activeViews: ['upload', 'analysis', 'providers'] },
    { id: 'deploying', label: 'Terminal', icon: Activity },
    { id: 'history', label: 'History', icon: History, activeViews: ['history', 'success'] },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: onOpenSettings },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'landing') return currentView === 'landing';
    if (item.id === 'upload') return item.activeViews?.includes(currentView) ?? false;
    if (item.id === 'deploying') return currentView === 'deploying';
    if (item.id === 'history') return item.activeViews?.includes(currentView) ?? false;
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-fixed)] md:hidden border-t border-border bg-bg-elevated/90 backdrop-blur-xl safe-bottom"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 md:h-18 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const handleClick = () => {
            if (item.onClick) {
              item.onClick();
            } else {
              onNavigate(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 ${
                active
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <div className="relative mb-1">
                <Icon className="w-5 h-5 md:w-5.5 md:h-5.5" />
                {(item.id === 'deploying' && hasActiveDeployment) && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" aria-hidden="true" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {active && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};