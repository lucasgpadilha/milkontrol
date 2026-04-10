"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Milk, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, confirmarSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }

      router.push("/login");
    } catch {
      setError("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-10 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 left-20 h-80 w-80 rounded-full bg-green-300/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <Milk className="h-12 w-12" />
          </div>
          <h1 className="mb-4 text-4xl font-bold">MilKontrol</h1>
          <p className="max-w-md text-center text-lg text-emerald-100/90 leading-relaxed">
            Comece a transformar a gestão da sua fazenda. Cadastre-se e tenha
            controle total da sua produção leiteira.
          </p>
        </div>
      </div>

      {/* Right side - form */}
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
            <h2 className="text-2xl font-bold text-gray-900">Criar conta</h2>
            <p className="mt-2 text-gray-500">
              Preencha os dados para começar
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
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

            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
              id="registro-submit-btn"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
