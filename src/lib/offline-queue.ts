export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  createdAt: number;
}

const DB_NAME = "MilKontrolOfflineDB";
const STORE_NAME = "requests";

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToOfflineQueue(req: Omit<OfflineRequest, "id" | "createdAt">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const requestData: OfflineRequest = {
      ...req,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    
    const addReq = store.add(requestData);
    addReq.onsuccess = () => resolve();
    addReq.onerror = () => reject(addReq.error);
  });
}

export async function getOfflineQueue(): Promise<OfflineRequest[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.getAll();
    
    getReq.onsuccess = () => {
      const result = getReq.result as OfflineRequest[];
      resolve(result.sort((a, b) => a.createdAt - b.createdAt));
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const delReq = store.delete(id);
    
    delReq.onsuccess = () => resolve();
    delReq.onerror = () => reject(delReq.error);
  });
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const clearReq = store.clear();
    
    clearReq.onsuccess = () => resolve();
    clearReq.onerror = () => reject(clearReq.error);
  });
}

/**
 * Função utilitária que substitui o fetch().
 * Se offline, salva na fila e retorna sucesso.
 */
export async function fetchWithOfflineFallback(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    if (options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())) {
      let bodyData = null;
      if (options.body && typeof options.body === "string") {
        try {
          bodyData = JSON.parse(options.body);
        } catch {
           bodyData = options.body;
        }
      }
      
      await saveToOfflineQueue({
        url,
        method: options.method.toUpperCase(),
        body: bodyData
      });
      
      // Retorna uma resposta fake success para não quebrar a UI
      window.dispatchEvent(new Event("offline-queue-updated"));
      return new Response(JSON.stringify({ offline: true, success: true }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  }
  
  // Tenta o fetch real. Se cair na rede (ex: Wi-Fi muito fraco que reporta online mas falha), 
  // cai no catch e tenta salvar na fila offline se for mutação.
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err: any) {
    if (options.method && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method.toUpperCase())) {
       let bodyData = null;
       if (options.body && typeof options.body === "string") {
         try { bodyData = JSON.parse(options.body); } catch { bodyData = options.body; }
       }
       await saveToOfflineQueue({ url, method: options.method.toUpperCase(), body: bodyData });
       window.dispatchEvent(new Event("offline-queue-updated"));
       return new Response(JSON.stringify({ offline: true, success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw err;
  }
}
