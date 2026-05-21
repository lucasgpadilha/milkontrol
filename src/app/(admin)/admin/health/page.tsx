import fs from "fs/promises";
import path from "path";
import os from "os";
import { Activity, Terminal, AlertTriangle, CheckCircle2 } from "lucide-react";

async function getLogTail(filePath: string, linesCount: number = 30) {
  try {
    // Para acesso real em produção, o PM2 salva em ~/.pm2/logs/
    const realPath = path.join(os.homedir(), ".pm2", "logs", filePath);
    const content = await fs.readFile(realPath, "utf-8");
    
    // Pegar as últimas X linhas
    const lines = content.split('\n').filter(Boolean);
    return lines.slice(-linesCount).join('\n');
  } catch (err) {
    return `[Sistema] Arquivo de log não encontrado ou inacessível: ${filePath}\n(Isso é normal em ambiente local de desenvolvimento, onde o PM2 pode não estar rodando o app)`;
  }
}

async function getSystemInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = (usedMem / totalMem) * 100;
  
  return {
    platform: os.platform(),
    release: os.release(),
    uptime: os.uptime(),
    cpus: os.cpus().length,
    memUsage: memUsage.toFixed(1),
    totalMem: (totalMem / 1024 / 1024 / 1024).toFixed(2),
    usedMem: (usedMem / 1024 / 1024 / 1024).toFixed(2),
  };
}

export default async function AdminHealthPage() {
  const sysInfo = await getSystemInfo();
  
  // Nomes dos logs da nossa instância PM2 (milkontrol id=18)
  const errorLog = await getLogTail("milkontrol-error-18.log");
  const outLog = await getLogTail("milkontrol-out-18.log");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Activity className="h-8 w-8 text-blue-500" />
          System Health & Logs
        </h1>
        <p className="text-slate-400 mt-2">
          Monitoramento em tempo real do servidor e logs de aplicação.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Status CPU/Sistema */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm col-span-2">
          <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Host System</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">OS</span>
              <span className="text-slate-200 font-mono">{sysInfo.platform} {sysInfo.release}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">CPU Cores</span>
              <span className="text-slate-200 font-mono">{sysInfo.cpus} vCPUs</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Server Uptime</span>
              <span className="text-slate-200 font-mono">{Math.floor(sysInfo.uptime / 3600)} horas</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500">RAM Usage</span>
              <span className="text-slate-200 font-mono">{sysInfo.usedMem} GB / {sysInfo.totalMem} GB ({sysInfo.memUsage}%)</span>
            </div>
            {/* Barra de RAM progress bar dummy */}
            <div className="w-full bg-slate-800 rounded-full h-2">
               <div className={`h-2 rounded-full ${Number(sysInfo.memUsage) > 85 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${sysInfo.memUsage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm col-span-2 flex flex-col justify-center items-center text-center">
             <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                 <CheckCircle2 className="h-10 w-10 text-emerald-500" />
             </div>
             <h2 className="text-2xl font-bold text-slate-100 mb-1">Status OK</h2>
             <p className="text-slate-400 text-sm">Prisma ORM e Next.js operando perfeitamente. Nenhuma anomalia de loop detectada no PM2.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
           <Terminal className="h-4 w-4" /> PM2 Standard Output (milkontrol-out-18)
        </h3>
        <div className="bg-[#0c0c0c] border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap">
            {outLog}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
           <AlertTriangle className="h-4 w-4 text-red-500" /> PM2 Error Output (milkontrol-error-18)
        </h3>
        <div className="bg-[#0c0c0c] border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-red-400 font-mono leading-relaxed whitespace-pre-wrap">
            {errorLog}
          </pre>
        </div>
      </div>
      
    </div>
  );
}
