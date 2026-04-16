import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Key, Lock, Zap, Code, AlertTriangle } from "lucide-react";

const BASE_URL = "https://api.milkontrol.cloud";

function Endpoint({ method, path, desc, scopes }: { method: string; path: string; desc: string; scopes: string[] }) {
  const methodColor: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800",
    POST: "bg-emerald-100 text-emerald-800",
    PATCH: "bg-amber-100 text-amber-800",
    DELETE: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold font-mono ${methodColor[method] || "bg-gray-100"}`}>
        {method}
      </span>
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono text-gray-900 break-all">{path}</code>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {scopes.map((s) => (
          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
        ))}
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="space-y-8 pb-10 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          Documentação da API
        </h1>
        <p className="mt-1 text-gray-500">
          API REST para integrações externas — <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-indigo-600">{BASE_URL}</code>
        </p>
      </div>

      {/* Auth */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-500" /> Autenticação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Todas as requisições exigem um header <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Authorization</code> com um Bearer token:
          </p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-sm font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer mk_sua_chave_aqui" \\
  ${BASE_URL}/v1/bovinos`}
          </pre>
          <p className="text-sm text-gray-600">
            Crie suas API Keys em <a href="/api-keys" className="text-indigo-600 hover:underline font-medium">Configurações → API Keys</a>.
            Cada chave é vinculada a uma fazenda com permissões específicas.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              A chave completa é exibida <strong>apenas uma vez</strong> no momento da criação. Armazene-a com segurança.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scopes */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-500" /> Scopes (Permissões)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2 font-medium">Scope</th>
                <th className="py-2 font-medium">Métodos</th>
                <th className="py-2 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr><td className="py-2"><Badge variant="secondary" className="bg-blue-50 text-blue-700">read</Badge></td><td className="py-2 text-gray-600">GET</td><td className="py-2 text-gray-600">Consultar todos os recursos</td></tr>
              <tr><td className="py-2"><Badge variant="secondary" className="bg-amber-50 text-amber-700">write</Badge></td><td className="py-2 text-gray-600">POST, PATCH</td><td className="py-2 text-gray-600">Criar e editar registros</td></tr>
              <tr><td className="py-2"><Badge variant="secondary" className="bg-red-50 text-red-700">delete</Badge></td><td className="py-2 text-gray-600">PATCH (soft-delete)</td><td className="py-2 text-gray-600">Marcar animais como vendidos/mortos</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-500" /> Endpoints
          </CardTitle>
          <CardDescription>Todos os endpoints são prefixados com <code className="font-mono text-xs">/v1</code></CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-2">🐄 Bovinos</h3>
          <Endpoint method="GET" path="/v1/bovinos" desc="Listar animais. Filtros: ?situacao=ATIVA&sexo=FEMEA&busca=123&piqueteId=xxx" scopes={["read"]} />
          <Endpoint method="GET" path="/v1/bovinos/:id" desc="Detalhe do animal com produções, lactações, inseminações, sanitário e pesagens" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/bovinos" desc="Criar novo bovino" scopes={["write"]} />
          <Endpoint method="PATCH" path="/v1/bovinos/:id" desc="Atualizar bovino. Campos: nome, raca, situacao, observacoes, piqueteId" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">🥛 Produção</h3>
          <Endpoint method="GET" path="/v1/producao" desc="Listar produções. Filtros: ?bovinoId=xxx&dataInicio=2026-01-01&dataFim=2026-04-14" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/producao" desc="Registrar produção. Valida lactação ativa e carência" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">🍼 Lactação</h3>
          <Endpoint method="GET" path="/v1/lactacao" desc="Listar lactações. Filtros: ?bovinoId=xxx&ativa=true" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/lactacao" desc="Iniciar nova lactação" scopes={["write"]} />
          <Endpoint method="PATCH" path="/v1/lactacao/:id" desc="Fechar lactação (definir data fim)" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">❤️ Reprodução</h3>
          <Endpoint method="GET" path="/v1/reproducao" desc="Listar inseminações. Filtros: ?bovinoId=xxx" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/reproducao" desc="Registrar inseminação" scopes={["write"]} />
          <Endpoint method="PATCH" path="/v1/reproducao/:id" desc="Atualizar resultado (prenhez, dataDiagnostico)" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">💉 Sanitário</h3>
          <Endpoint method="GET" path="/v1/sanitario" desc="Listar registros. Filtros: ?bovinoId=xxx&tipo=VACINA&dataInicio=..." scopes={["read"]} />
          <Endpoint method="POST" path="/v1/sanitario" desc="Registrar vacina/medicamento (calcula fimCarencia automático)" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">🏭 Tanque</h3>
          <Endpoint method="GET" path="/v1/tanque" desc="Listar tanques com volume atual e últimas movimentações" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/tanque/movimentar" desc="Registrar entrada/saída (valida capacidade)" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">⚖️ Pesagem</h3>
          <Endpoint method="GET" path="/v1/pesagem" desc="Listar pesagens. Filtros: ?bovinoId=xxx" scopes={["read"]} />
          <Endpoint method="POST" path="/v1/pesagem" desc="Registrar peso do animal" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">🌾 Alimentação</h3>
          <Endpoint method="GET" path="/v1/alimentacao" desc="Listar registros de alimentação. Filtros: ?dataInicio=...&dataFim=..." scopes={["read"]} />
          <Endpoint method="POST" path="/v1/alimentacao" desc="Registrar fornecimento por piquete" scopes={["write"]} />

          <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-6">📊 KPIs / Inteligência</h3>
          <Endpoint method="GET" path="/v1/kpis" desc="KPIs consolidados, projeção financeira e preço base. Usa o engine de inteligência" scopes={["read"]} />
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4 text-indigo-500" /> Formato de Resposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">Listagens retornam com envelope paginado:</p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
{`{
  "data": [...],
  "meta": {
    "page": 1,
    "perPage": 50,
    "total": 234,
    "totalPages": 5
  }
}`}
          </pre>
          <p className="text-sm text-gray-700 mt-3">Paginação via query params:</p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono">
{`GET /v1/bovinos?page=2&perPage=25`}
          </pre>

          <p className="text-sm text-gray-700 mt-3">Erros retornam:</p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
{`{
  "error": "validation_error",
  "message": "Brinco é obrigatório"
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Rate Limiting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            <strong>100 requisições/minuto</strong> por API Key. Headers de resposta:
          </p>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono mt-3">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1713091234`}
          </pre>
          <p className="text-sm text-gray-500 mt-2">
            Ao exceder o limite, a API retorna <code className="font-mono text-xs">429 Too Many Requests</code>.
          </p>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4 text-indigo-500" /> Exemplos de Código
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">cURL</h4>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
{`# Listar bovinos
curl -s -H "Authorization: Bearer mk_sua_chave" \\
  ${BASE_URL}/v1/bovinos | jq .

# Registrar produção
curl -X POST -H "Authorization: Bearer mk_sua_chave" \\
  -H "Content-Type: application/json" \\
  -d '{"data":"2026-04-14","quantidade":12.5,"turno":"MANHA","bovinoId":"xxx"}' \\
  ${BASE_URL}/v1/producao`}
          </pre>

          <h4 className="text-sm font-semibold text-gray-700 mt-4">JavaScript / Node.js</h4>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
{`const API_KEY = "mk_sua_chave";
const BASE = "${BASE_URL}/v1";

const res = await fetch(\`\${BASE}/bovinos?sexo=FEMEA\`, {
  headers: { "Authorization": \`Bearer \${API_KEY}\` }
});
const { data, meta } = await res.json();
console.log(\`\${meta.total} bovinos encontrados\`);`}
          </pre>

          <h4 className="text-sm font-semibold text-gray-700 mt-4">Python</h4>
          <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto">
{`import requests

API_KEY = "mk_sua_chave"
BASE = "${BASE_URL}/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

r = requests.get(f"{BASE}/bovinos", headers=headers)
dados = r.json()
print(f"{dados['meta']['total']} bovinos")`}
          </pre>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Códigos de Erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-gray-500">
                <th className="py-2 font-medium">HTTP</th>
                <th className="py-2 font-medium">Código</th>
                <th className="py-2 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              <tr><td className="py-2 font-mono text-xs">400</td><td className="py-2"><code className="text-xs">validation_error</code></td><td className="py-2">Dados inválidos no body</td></tr>
              <tr><td className="py-2 font-mono text-xs">400</td><td className="py-2"><code className="text-xs">business_rule</code></td><td className="py-2">Regra de negócio violada (ex: vaca sem lactação)</td></tr>
              <tr><td className="py-2 font-mono text-xs">401</td><td className="py-2"><code className="text-xs">unauthorized</code></td><td className="py-2">Token ausente ou inválido</td></tr>
              <tr><td className="py-2 font-mono text-xs">403</td><td className="py-2"><code className="text-xs">insufficient_scope</code></td><td className="py-2">API Key sem permissão para esta operação</td></tr>
              <tr><td className="py-2 font-mono text-xs">403</td><td className="py-2"><code className="text-xs">key_revoked</code></td><td className="py-2">API Key foi revogada</td></tr>
              <tr><td className="py-2 font-mono text-xs">404</td><td className="py-2"><code className="text-xs">not_found</code></td><td className="py-2">Recurso não encontrado nesta fazenda</td></tr>
              <tr><td className="py-2 font-mono text-xs">409</td><td className="py-2"><code className="text-xs">duplicate_brinco</code></td><td className="py-2">Brinco já existe nesta fazenda</td></tr>
              <tr><td className="py-2 font-mono text-xs">429</td><td className="py-2"><code className="text-xs">rate_limit_exceeded</code></td><td className="py-2">Excedeu 100 req/min</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
