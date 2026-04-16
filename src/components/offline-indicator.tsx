"use client";

import { useEffect, useState } from "react";
import { CloudOff, CloudSync, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { getOfflineQueue, removeFromOfflineQueue, OfflineRequest, fetchWithOfflineFallback } from "@/lib/offline-queue";
import { Button } from "@/components/ui/button";

export function OfflineIndicator() {
  const [queue, setQueue] = useState<OfflineRequest[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const refreshQueue = async () => {
    const q = await getOfflineQueue();
    setQueue(q);
  };

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);
    
    // Listen to our custom event
    const handleQueueUpdate = () => refreshQueue();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-updated", handleQueueUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-updated", handleQueueUpdate);
    };
  }, []);

  const syncQueue = async () => {
    if (isSyncing || !navigator.onLine) return;
    
    const currentQueue = await getOfflineQueue();
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    let allSuccess = true;

    for (const req of currentQueue) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: { "Content-Type": "application/json" },
          body: req.body ? JSON.stringify(req.body) : undefined,
        });
        
        if (response.ok || response.status === 400 || response.status === 403) {
          // If true success or business logical error (which means it Reached the server), we remove it.
          // In real prod, we might want to flag 400s to the user, but for now we consume the queue.
          await removeFromOfflineQueue(req.id);
        } else {
          allSuccess = false;
        }
      } catch (err) {
        allSuccess = false;
      }
    }

    await refreshQueue();
    setIsSyncing(false);
    if (!allSuccess) {
      console.error("Falha parcial na sincronização da fila offline");
    } else {
       setShowDropdown(false); // Hide if all done
    }
  };

  if (queue.length === 0 && isOnline) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-colors ${
          !isOnline 
            ? "bg-red-50 text-red-700 border-red-200" 
            : queue.length > 0 
              ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}
      >
        {!isOnline ? (
          <><CloudOff className="h-3.5 w-3.5" /> Offline ({queue.length} pendentes)</>
        ) : queue.length > 0 ? (
          <><CloudSync className="h-3.5 w-3.5" /> Sincronizar ({queue.length})</>
        ) : (
          <><CheckCircle2 className="h-3.5 w-3.5" /> Sincronizado</>
        )}
      </button>

      {/* Flyout/Dropdown */}
      {showDropdown && (queue.length > 0 || !isOnline) && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
             <h4 className="font-semibold text-gray-900 text-sm">Fila Offline</h4>
             <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{queue.length} itens</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto mb-4 pr-1">
            {queue.map(req => (
              <div key={req.id} className="text-xs p-2 rounded bg-gray-50 border border-gray-100 flex items-start justify-between gap-2">
                 <div>
                   <span className="font-semibold text-indigo-600 mr-2">{req.method}</span>
                   <span className="text-gray-600 font-mono truncate">{req.url.split('/').pop()}</span>
                 </div>
              </div>
            ))}
            {queue.length === 0 && !isOnline && (
              <p className="text-xs text-gray-500 text-center py-2">Nenhum dado pendente de envio.</p>
            )}
          </div>

          <Button 
            onClick={syncQueue} 
            disabled={!isOnline || isSyncing || queue.length === 0}
            className="w-full text-xs h-8"
          >
            {isSyncing ? (
              <><RefreshCw className="mr-2 h-3 w-3 animate-spin" /> Sincronizando...</>
            ) : !isOnline ? (
               <><AlertCircle className="mr-2 h-3 w-3" /> Sem Conexão</>
            ) : (
              <><CloudSync className="mr-2 h-3 w-3" /> Sincronizar Agora</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
