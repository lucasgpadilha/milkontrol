import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnership } from "@/lib/ownership";

// PATCH /api/reproducao/[id] — update prenhez
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const check = await assertOwnership("inseminacao", id);
  if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await req.json();

  // Buscar inseminação original
  const inseminacaoOriginal = await prisma.inseminacao.findUnique({
    where: { id },
    include: { bovino: true },
  });

  if (!inseminacaoOriginal) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  let dataPartoPrevisto = null;

  const txOperations: any[] = [];

  // Se prenhez = true, calcular parto e agendar eventos
  if (body.prenhez === true) {
    const dataInsem = new Date(inseminacaoOriginal.data);
    dataPartoPrevisto = new Date(dataInsem);
    dataPartoPrevisto.setDate(dataInsem.getDate() + 283); // ~283 dias gestação

    const dataSecagem = new Date(dataPartoPrevisto);
    dataSecagem.setDate(dataPartoPrevisto.getDate() - 60); // Secagem 60 dias antes do parto

    // Criar evento de parto
    txOperations.push(
      prisma.agendaEvento.create({
        data: {
          titulo: `Parto previsto: ${inseminacaoOriginal.bovino.brinco}`,
          tipo: "PARTO_PREVISTO",
          dataHora: dataPartoPrevisto,
          prioridade: "ALTA",
          notas: `Gerado a partir da confirmação de prenhez. Inseminação: ${dataInsem.toLocaleDateString("pt-BR")}`,
          bovinoId: inseminacaoOriginal.bovino.id,
          fazendaId: inseminacaoOriginal.bovino.fazendaId,
        },
      })
    );

    // Criar evento de secagem
    txOperations.push(
      prisma.agendaEvento.create({
        data: {
          titulo: `Secagem recomendada: ${inseminacaoOriginal.bovino.brinco}`,
          tipo: "SECAGEM_PREVISTA",
          dataHora: dataSecagem,
          prioridade: "MEDIA",
          notas: "Secagem para o período de transição (60 dias antes do parto)",
          bovinoId: inseminacaoOriginal.bovino.id,
          fazendaId: inseminacaoOriginal.bovino.fazendaId,
        },
      })
    );
  }

  txOperations.push(
    prisma.inseminacao.update({
      where: { id },
      data: {
        prenhez: body.prenhez,
        dataDiagnostico: body.dataDiagnostico ? new Date(body.dataDiagnostico) : new Date(),
        dataPartoPrevisto: dataPartoPrevisto,
      },
    })
  );

  const [_, __, inseminacaoAtualizada] = await prisma.$transaction(txOperations);
  // se for falso, array pode ser menor. A ultima operação é o update.
  const result = txOperations.length > 1 ? inseminacaoAtualizada : (await prisma.$transaction(txOperations))[0];

  return NextResponse.json(result);
}
