"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import Papa from "papaparse";

interface BovinoCSV {
  brinco: string;
  nome: string;
  raca: string;
  sexo: string;
  dataNascimento: string;
}

export default function ImportarBovinosPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<BovinoCSV[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(""); setSuccess(""); setPreview([]);
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (selected.type !== "text/csv" && !selected.name.endsWith(".csv")) {
      setError("Por favor, selecione um arquivo CSV válido.");
      return;
    }
    setFile(selected);

    // Parse for preview
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        // Validate headers roughly
        if (rows.length > 0 && !('brinco' in rows[0])) {
          setError("O cabeçalho do arquivo deve conter a coluna 'brinco'.");
          return;
        }
        setPreview(rows.slice(0, 5) as BovinoCSV[]); // preview first 5
      },
      error: (err) => setError("Erro ao ler o arquivo CSV: " + err.message)
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true); setError(""); setSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/bovinos/importar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bovinos: results.data }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setSuccess(`Importação concluída! ${data.count} animais novos cadastrados. ${data.ignorados} brincos já existiam foram ignorados.`);
          setFile(null);
          setPreview([]);
        } catch (err: any) {
          setError(err.message || "Erro durante a importação.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Importação em Lote</h1>
        <Button variant="outline" onClick={() => router.push("/bovinos")}>Voltar para Rebanho</Button>
      </div>

      <Hint id="importacao-magica" title="Importador Mágico MilKontrol">
        Traga seu rebanho instantaneamente usando um arquivo CSV. É a forma mais rápida de iniciar sua gestão sem cadastrar animais um a um.
      </Hint>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
             <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Importe seu catálogo via CSV</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Estruture o arquivo com os seguintes cabeçalhos na primeira linha: 
            <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 mx-1">brinco</code>,
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 mx-1">nome</code>,
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 mx-1">raca</code>,
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 mx-1">sexo</code>,
            <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 mx-1">dataNascimento</code>
          </p>

          <div className="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-10 hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="hidden" 
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
              <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
              <span className="text-emerald-600 font-semibold mb-1">Clique para selecionar o arquivo</span>
              <span className="text-xs text-gray-500">.CSV até 10MB</span>
            </label>
          </div>

          {file && !error && (
            <div className="mt-6 text-left">
              <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg mb-4 text-sm text-indigo-800">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                Arquivo <strong>{file.name}</strong> lido com sucesso.
              </div>
              
              {preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Pré-visualização (5 primeiros):</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-2 font-medium">Brinco</th>
                          <th className="p-2 font-medium">Nome</th>
                          <th className="p-2 font-medium">Sexo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {preview.map((row, i) => (
                          <tr key={i}>
                            <td className="p-2">{row.brinco}</td>
                            <td className="p-2">{row.nome || '-'}</td>
                            <td className="p-2">{row.sexo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button onClick={handleImport} disabled={loading} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 h-10">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : "Importar Rebanho (Não haverá duplicatas)"}
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center gap-2 text-left">
               <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col items-center gap-2">
               <CheckCircle2 className="h-6 w-6 text-emerald-600" />
               <p className="font-medium text-center">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
