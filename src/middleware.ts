import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/registro", "/convite"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Páginas públicas (login, registro, aceite de convite)
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Check for session cookie (set by NextAuth)
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  const isLoggedIn = !!sessionCookie;

  if (isPublicPage) {
    // Se logado e tentando acessar login/registro, redireciona para home
    // MAS: se o cookie existir mas for inválido (secret trocado), não redirecionar.
    // Não temos como validar o JWT aqui no edge, então deixamos prosseguir.
    // O NextAuth server-side vai invalidar a sessão e mostrar a página de login normalmente.
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
