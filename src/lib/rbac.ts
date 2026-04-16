import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFazendaAtivaIds } from "@/lib/fazenda-ativa";

export type PapelFazenda = "PROPRIETARIO" | "GERENTE" | "OPERADOR" | "VETERINARIO";

const ROLE_HIERARCHY: Record<PapelFazenda, number> = {
  PROPRIETARIO: 4,
  GERENTE: 3,
  OPERADOR: 2,
  VETERINARIO: 1,
};

/**
 * Verifica se o usuário autenticado tem o papel mínimo exigido na fazenda ativa.
 * 
 * Hierarquia: PROPRIETARIO > GERENTE > OPERADOR = VETERINARIO
 * 
 * Uso:
 *   const check = await assertRole(["PROPRIETARIO", "GERENTE"]);
 *   if (!check) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
 * 
 * Retorna null se não autorizado, ou { userId, fazendaId, papel } se OK.
 */
export async function assertRole(
  allowedRoles: PapelFazenda[]
): Promise<{ userId: string; fazendaId: string; papel: PapelFazenda } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const ctx = await getFazendaAtivaIds();
  if (!ctx || ctx.fazendaIds.length === 0) return null;

  // Se "todas" está selecionado, pega a primeira fazenda para checar o papel
  const fazendaId = ctx.fazendaIds[0];

  const membership = await prisma.usuarioFazenda.findFirst({
    where: {
      userId: session.user.id,
      fazendaId,
    },
    select: { papel: true },
  });

  if (!membership) return null;

  const papel = membership.papel as PapelFazenda;
  if (!allowedRoles.includes(papel)) return null;

  return { userId: session.user.id, fazendaId, papel };
}
