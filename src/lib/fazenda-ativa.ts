import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "fazenda-ativa";

/**
 * Retorna os IDs das fazendas que devem ser consultadas nas APIs.
 * Se o usuário tem uma fazenda ativa selecionada, retorna apenas ela.
 * Se for "todas", retorna todas as fazendas do usuário.
 * Também retorna o userId e a fazenda ativa (com config de ordenhas).
 */
export async function getFazendaAtivaIds() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Buscar todas as fazendas do usuário
  const userFazendas = await prisma.usuarioFazenda.findMany({
    where: { userId },
    select: { fazendaId: true },
  });
  const todasFazendaIds = userFazendas.map((uf) => uf.fazendaId);

  if (todasFazendaIds.length === 0) {
    return { userId, fazendaIds: [], fazendaAtiva: null, todas: true };
  }

  // Ler cookie da fazenda ativa
  const cookieStore = await cookies();
  const fazendaAtivaCookie = cookieStore.get(COOKIE_NAME)?.value;

  // Se o cookie é "todas" ou não existe, retorna tudo
  if (!fazendaAtivaCookie || fazendaAtivaCookie === "todas") {
    return { userId, fazendaIds: todasFazendaIds, fazendaAtiva: null, todas: true };
  }

  // Validar que a fazenda do cookie pertence ao usuário
  if (todasFazendaIds.includes(fazendaAtivaCookie)) {
    const fazendaAtiva = await prisma.fazenda.findUnique({
      where: { id: fazendaAtivaCookie },
      select: { id: true, nome: true, ordenhasDia: true },
    });

    return {
      userId,
      fazendaIds: [fazendaAtivaCookie],
      fazendaAtiva,
      todas: false,
    };
  }

  // Cookie inválido — retorna todas
  return { userId, fazendaIds: todasFazendaIds, fazendaAtiva: null, todas: true };
}
