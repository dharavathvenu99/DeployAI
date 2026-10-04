import React, { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  url: string;
  projectName: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, projectName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  // Generate QR code image URL using standard public QR rendering service
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    url
  )}&bgcolor=ffffff&color=8b5cf6&margin=10`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-title"
    >
      <div className="relative w-full max-w-sm glass-card-elevated rounded-2xl p-6 border-primary/20 shadow-xl flex flex-col items-center text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Close QR code modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="w-14 h-14 rounded-xl bg-primary p-0.5 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-surface rounded-lg flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h3 id="qr-title" className="text-lg font-bold text-text-primary mb-1">Scan on Mobile Device</h3>
        <p className="text-xs text-text-secondary mb-6 px-2">
          Scan with your camera or Google Lens to test the live deployment on your phone.
        </p>

        {/* QR Code Container */}
        <div className="p-4 bg-surface rounded-xl border border-border mb-4">
          {!qrError ? (
            <img
              src={qrImageUrl}
              alt={`QR code for ${projectName} deployment`}
              className="w-56 h-56 rounded-lg object-contain mx-auto"
              onLoad={() => setQrLoaded(true)}
              onError={() => setQrError(true)}
            />
          ) : (
            <div className="w-56 h-56 rounded-lg flex flex-col items-center justify-center gap-2 text-text-muted">
              <X className="w-8 h-8 text-error/50" />
              <span className="text-xs">Failed to load QR code</span>
            </div>
          )}
          {!qrLoaded && !qrError && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-xl">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* URL Pill */}
        <div className="w-full flex items-center gap-2 p-2 bg-surface rounded-lg border border-border mb-4 text-xs font-mono text-primary">
          <span className="truncate flex-1 text-left px-1">{url}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-primary-bg hover:bg-primary/20 text-primary transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg btn btn-secondary btn-sm"
          >
            Close
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg btn btn-primary btn-sm shadow-lg flex items-center justify-center gap-1.5"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};