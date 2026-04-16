import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Verifica se o recurso (por ID) pertence a uma fazenda acessível pelo usuário autenticado.
 * Retorna o userId se OK, ou null se não autorizado.
 *
 * Uso:
 *   const check = await assertOwnership("bovino", bovinoId);
 *   if (!check) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
 *
 * Modelos suportados: bovino, piquete, veterinario, bancoSemen, inseminacao,
 *                     registroSanitario, registroAlimentacao
 */
export async function assertOwnership(
  model: "bovino" | "piquete" | "veterinario" | "bancoSemen" | "inseminacao" | "registroSanitario" | "registroAlimentacao",
  resourceId: string
): Promise<{ userId: string; fazendaId: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Buscar todas as fazendas do usuário
  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId },
    select: { fazendaId: true },
  });
  const fazendaIds = userFazendas.map((uf) => uf.fazendaId);

  if (fazendaIds.length === 0) return null;

  // Cada model tem um caminho diferente para chegar à fazendaId
  let fazendaId: string | null = null;

  switch (model) {
    case "bovino": {
      const rec = await prisma.bovino.findFirst({
        where: { id: resourceId, fazendaId: { in: fazendaIds } },
        select: { fazendaId: true },
      });
      fazendaId = rec?.fazendaId ?? null;
      break;
    }
    case "piquete": {
      const rec = await prisma.piquete.findFirst({
        where: { id: resourceId, fazendaId: { in: fazendaIds } },
        select: { fazendaId: true },
      });
      fazendaId = rec?.fazendaId ?? null;
      break;
    }
    case "veterinario": {
      const rec = await prisma.veterinario.findFirst({
        where: { id: resourceId, fazendaId: { in: fazendaIds } },
        select: { fazendaId: true },
      });
      fazendaId = rec?.fazendaId ?? null;
      break;
    }
    case "bancoSemen": {
      const rec = await prisma.bancoSemen.findFirst({
        where: { id: resourceId, fazendaId: { in: fazendaIds } },
        select: { fazendaId: true },
      });
      fazendaId = rec?.fazendaId ?? null;
      break;
    }
    case "inseminacao": {
      const rec = await prisma.inseminacao.findFirst({
        where: { id: resourceId, bovino: { fazendaId: { in: fazendaIds } } },
        select: { bovino: { select: { fazendaId: true } } },
      });
      fazendaId = rec?.bovino?.fazendaId ?? null;
      break;
    }
    case "registroSanitario": {
      const rec = await prisma.registroSanitario.findFirst({
        where: { id: resourceId, bovino: { fazendaId: { in: fazendaIds } } },
        select: { bovino: { select: { fazendaId: true } } },
      });
      fazendaId = rec?.bovino?.fazendaId ?? null;
      break;
    }
    case "registroAlimentacao": {
      const rec = await prisma.registroAlimentacao.findFirst({
        where: { id: resourceId, fazendaId: { in: fazendaIds } },
        select: { fazendaId: true },
      });
      fazendaId = rec?.fazendaId ?? null;
      break;
    }
  }

  if (!fazendaId) return null;

  return { userId, fazendaId };
}
