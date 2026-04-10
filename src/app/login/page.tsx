"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Milk, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <Milk className="h-12 w-12" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">MilKontrol</h1>
          <p className="max-w-md text-center text-lg text-emerald-100/90 leading-relaxed">
            Gerencie sua fazenda leiteira com inteligência. Controle bovinos,
            produção, reprodução e muito mais em um só lugar.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-emerald-200">Digital</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-emerald-200">Acesso</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">∞</p>
              <p className="text-xs text-emerald-200">Dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <Milk className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Mil<span className="text-emerald-600">Kontrol</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="mt-2 text-gray-500">
              Faça login para acessar sua fazenda
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Não tem uma conta?{" "}
            <Link
              href="/registro"
              className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
