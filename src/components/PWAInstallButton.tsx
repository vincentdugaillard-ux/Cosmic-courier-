import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'prominent' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside installed standalone PWA, suppress
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Application Installed (Standalone Mode)</span>
        </div>
      );
    }
    return null;
  }

  // Handle Chrome / Android / Desktop Install
  const handleInstallClick = async () => {
    soundManager.playUiClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS && variant !== 'settings') {
    return null;
  }

  if (variant === 'settings') {
    return (
      <div className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold text-slate-200">
              INSTALL APPLICATION (PWA)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
            OFFLINE READY
          </span>
        </div>
        <p className="text-xs text-slate-400 font-light">
          Install Cosmic Courier directly to your Android device, phone, or desktop for fullscreen immersion and offline play.
        </p>
        <button
          onClick={handleInstallClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? 'Instructions for iOS Safari' : 'Install on Android / Device'}</span>
        </button>

        {showIOSGuide && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
            <div className="text-cyan-400 font-bold">iOS Installation Guide:</div>
            <div>1. Tap the <strong>Share</strong> button in Safari toolbar.</div>
            <div>2. Scroll down and tap <strong>Add to Home Screen</strong>.</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        id="btn-pwa-install"
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 font-mono text-xs font-bold transition-all shadow-md shadow-cyan-950/40 active:scale-95 ${className}`}
        title="Install Cosmic Courier on your device"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>Install App</span>
      </button>

      {/* iOS Modal Popup */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl font-mono text-xs text-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-300">INSTALL ON IOS SAFARI</span>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. Tap the <strong className="text-cyan-300">Share</strong> icon in the Safari bottom toolbar.<br />
              2. Scroll down and select <strong className="text-cyan-300">Add to Home Screen</strong>.<br />
              3. Launch Cosmic Courier from your home screen for fullscreen spaceflight!
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
