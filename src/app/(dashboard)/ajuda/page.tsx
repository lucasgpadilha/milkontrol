import {
  Beef,
  Milk,
  Heart,
  FlaskConical,
  Syringe,
  Warehouse,
  BarChart3,
  HelpCircle,
  Baby,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function AjudaPage() {
  const sections = [
    {
      icon: Warehouse,
      title: "1. Fazendas",
      color: "bg-emerald-100 text-emerald-600",
      content: [
        "Cadastre sua fazenda informando nome, endereço, cidade e estado.",
        "Cada fazenda funciona como um grupo isolado — bovinos, tanques e registros são vinculados à fazenda.",
        "Você pode gerenciar múltiplas fazendas com a mesma conta.",
        "Clique no ícone de lápis para editar ou na lixeira para excluir uma fazenda.",
      ],
    },
    {
      icon: Beef,
      title: "2. Bovinos",
      color: "bg-blue-100 text-blue-600",
      content: [
        "Cadastre cada animal com brinco (obrigatório), raça, data de nascimento e sexo.",
        "Use os filtros por sexo (Macho/Fêmea) e situação (Ativa/Vendida/Morta) para localizar rapidamente.",
        "O campo 'Mãe' permite vincular bezerros à mãe — isso cria o histórico genealógico.",
        "A coluna 'Lactação' mostra os DEL (Dias em Lactação) para vacas com lactação ativa.",
      ],
    },
    {
      icon: Baby,
      title: "3. Bezerros",
      color: "bg-cyan-100 text-cyan-600",
      content: [
        "Bezerros são cadastrados como bovinos normais — use o módulo Bovinos.",
        "Ao cadastrar, selecione a mãe e informe os dados do pai/sêmen.",
        "A página de Bezerros filtra automaticamente os animais jovens do rebanho.",
      ],
    },
    {
      icon: Milk,
      title: "4. Produção de Leite",
      color: "bg-teal-100 text-teal-600",
      content: [
        "Registre a produção diária informando a vaca, a data, o turno (manhã/tarde) e a quantidade em litros.",
        "Regra RN01: apenas fêmeas podem ter produção registrada.",
        "Regra RN02: apenas vacas com lactação ativa aparecem na lista.",
        "Se a vaca estiver em período de carência (medicada), o sistema bloqueia o lançamento — o leite não pode ir para o tanque.",
        "O total do dia é exibido no topo da página para acompanhamento rápido.",
      ],
    },
    {
      icon: FlaskConical,
      title: "5. Lactação",
      color: "bg-indigo-100 text-indigo-600",
      content: [
        "Inicie uma lactação quando a vaca parir — informe a vaca e a data de início.",
        "O sistema calcula automaticamente os DEL (Dias em Lactação) em tempo real.",
        "Ao iniciar uma nova lactação, a anterior é encerrada automaticamente.",
        "Vacas sem lactação ativa são consideradas 'secas' e não aparecem no lançamento de produção.",
        "Use o filtro 'Ativas' para ver apenas lactações em andamento.",
      ],
    },
    {
      icon: Heart,
      title: "6. Reprodução",
      color: "bg-pink-100 text-pink-600",
      content: [
        "Registre inseminações artificiais (IA) ou naturais com data, responsável, sêmen/touro utilizado.",
        "Regra RN05: a inseminação deve ser registrada antes do diagnóstico de prenhez.",
        "Após ~30 dias, use os botões ✓ (prenha) ou ✗ (não-prenha) para registrar o diagnóstico.",
        "A taxa de prenhez do rebanho é calculada automaticamente na página de Relatórios.",
      ],
    },
    {
      icon: FlaskConical,
      title: "7. Tanque de Leite",
      color: "bg-amber-100 text-amber-600",
      content: [
        "Cadastre tanques informando nome e capacidade máxima em litros.",
        "Registre entradas (coleta da produção) e saídas (venda, consumo interno, descarte).",
        "O sistema atualiza o volume automaticamente e exibe um gauge visual de preenchimento.",
        "Alerta laranja aparece quando o tanque atinge 90% da capacidade.",
        "Regra RN04: o volume nunca pode ultrapassar a capacidade máxima.",
      ],
    },
    {
      icon: Syringe,
      title: "8. Controle Sanitário",
      color: "bg-red-100 text-red-600",
      content: [
        "Registre vacinas, vermífugos e medicamentos aplicados em cada animal.",
        "Informe os dias de carência quando aplicável ao medicamento.",
        "Durante a carência, o sistema bloqueia automaticamente o lançamento de produção para aquele animal.",
        "Isso garante que leite contaminado não entre no tanque — conformidade com normas sanitárias.",
        "Use o filtro 'Em carência' para ver quais animais estão impedidos de produzir.",
      ],
    },
    {
      icon: BarChart3,
      title: "9. Relatórios",
      color: "bg-purple-100 text-purple-600",
      content: [
        "Visão consolidada da produção da fazenda, gerada em tempo real.",
        "Produção do mês atual e variação percentual em relação ao mês anterior.",
        "Ranking das 10 vacas mais produtivas do mês com barras de progresso.",
        "Taxa de prenhez do rebanho baseada nos diagnósticos registrados.",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajuda</h1>
        <p className="mt-1 text-gray-500">
          Guia completo do MilKontrol
        </p>
      </div>

      {/* About */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <HelpCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">O que é o MilKontrol?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              O MilKontrol é um sistema web desenvolvido para auxiliar pequenos e médios produtores rurais na <strong>gestão completa de fazendas leiteiras</strong>.
              O objetivo é substituir planilhas e cadernos por uma ferramenta digital, acessível de qualquer dispositivo, que centraliza todas as informações do rebanho,
              produção, reprodução e controle sanitário em um só lugar.
            </p>

          </div>
        </div>
      </div>

      {/* Quick start */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Primeiros Passos</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="rounded-lg bg-emerald-100 px-3 py-1.5 font-medium text-emerald-700">1. Cadastre sua Fazenda</span>
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <span className="rounded-lg bg-blue-100 px-3 py-1.5 font-medium text-blue-700">2. Cadastre seus Bovinos</span>
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <span className="rounded-lg bg-indigo-100 px-3 py-1.5 font-medium text-indigo-700">3. Inicie as Lactações</span>
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <span className="rounded-lg bg-teal-100 px-3 py-1.5 font-medium text-teal-700">4. Lance a Produção diária</span>
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <span className="rounded-lg bg-purple-100 px-3 py-1.5 font-medium text-purple-700">5. Acompanhe nos Relatórios</span>
        </div>
      </div>

      {/* Business rules */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          <AlertTriangle className="inline h-5 w-5 text-amber-600 mr-2" />
          Regras de Negócio Importantes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <p className="text-sm font-medium text-gray-900">RN01 — Apenas vacas</p>
            <p className="text-xs text-gray-500 mt-1">Somente fêmeas podem ter produção de leite registrada.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <p className="text-sm font-medium text-gray-900">RN02 — Lactação ativa</p>
            <p className="text-xs text-gray-500 mt-1">A vaca precisa ter lactação ativa para registrar produção.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <p className="text-sm font-medium text-gray-900">RN04 — Capacidade do tanque</p>
            <p className="text-xs text-gray-500 mt-1">O volume do tanque nunca pode ultrapassar a capacidade máxima.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-amber-100">
            <p className="text-sm font-medium text-gray-900">RN05 — Inseminação primeiro</p>
            <p className="text-xs text-gray-500 mt-1">A inseminação deve ser registrada antes do diagnóstico de prenhez.</p>
          </div>
          <div className="rounded-lg bg-white p-3 border border-amber-100 sm:col-span-2">
            <p className="text-sm font-medium text-gray-900">Carência de medicamentos</p>
            <p className="text-xs text-gray-500 mt-1">Animais medicados têm a produção bloqueada durante o período de carência, garantindo que leite contaminado não entre no tanque.</p>
          </div>
        </div>
      </div>

      {/* Module sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">📖 Guia por Módulo</h2>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${section.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-1.5 ml-12">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Terms */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">📚 Glossário</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { term: "DEL", desc: "Dias em Lactação — quantos dias desde o início da lactação atual." },
            { term: "Carência", desc: "Período após medicação em que o leite não pode ser comercializado." },
            { term: "IA", desc: "Inseminação Artificial — técnica reprodutiva usando sêmen congelado." },
            { term: "Brinco", desc: "Identificador único do animal, geralmente uma tag na orelha." },
            { term: "Seca", desc: "Vaca que não está em lactação (sem produzir leite)." },
            { term: "Prenhez", desc: "Estado de gestação do animal após inseminação bem-sucedida." },
          ].map((item) => (
            <div key={item.term} className="flex gap-2 text-sm">
              <span className="font-semibold text-emerald-700 shrink-0 w-20">{item.term}</span>
              <span className="text-gray-600">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
