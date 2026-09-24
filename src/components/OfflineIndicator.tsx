import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-3 left-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-amber-500/60 text-amber-300 font-mono text-xs shadow-2xl backdrop-blur-md animate-pulse pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — Local Spaceflight Active</span>
    </div>
  );
};
