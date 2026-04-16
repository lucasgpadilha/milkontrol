"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";

export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [conviteInfo, setConviteInfo] = useState<{ fazenda: string, papel: string, email: string } | null>(null);

  useEffect(() => {
    async function checkToken() {
      const res = await fetch(`/api/equipe/aceitar?token=${params.token}&check=true`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Convite inválido");
      } else {
        setConviteInfo(data);
      }
      setLoading(false);
    }
    if (params.token) checkToken();
  }, [params.token]);

  const handleAccept = async () => {
    setLoading(true);
    const res = await fetch(`/api/equipe/aceitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token }),
    });
    
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Configurar Acesso</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-gray-100">
          <CardHeader className="text-center">
            {success ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle>Convite Aceito!</CardTitle>
                <CardDescription>Redirecionando para o painel...</CardDescription>
              </>
            ) : error ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Convite Inválido ou Expirado</CardTitle>
                <CardDescription>{error}</CardDescription>
                <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => router.push("/")}>Acessar Plataforma</Button>
                </div>
              </>
            ) : (
              <>
                <CardTitle>Convite para {conviteInfo?.fazenda}</CardTitle>
                <CardDescription>O e-mail <strong>{conviteInfo?.email}</strong> foi convidado para acessar esta fazenda como {conviteInfo?.papel}.</CardDescription>
              </>
            )}
          </CardHeader>
          
          {!success && !error && conviteInfo && (
            <CardContent className="space-y-6">
              {status === "unauthenticated" ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
                    Você precisar estar conectado com este e-mail para aceitar. Caso não tenha uma conta, crie agora:
                  </div>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push("/cadastro")}>
                    Criar Conta
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => signIn()}>
                    Fazer Login
                  </Button>
                </div>
              ) : session?.user?.email !== conviteInfo?.email ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm text-center">
                  Você está logado como <strong>{session?.user?.email}</strong>. Por favor, saiba e acesse a conta do convite.
                  <Button variant="outline" className="w-full mt-3 border-red-200 text-red-700 hover:bg-red-100" onClick={() => signIn()}>
                    Trocar de Conta
                  </Button>
                </div>
              ) : (
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAccept}>
                  Confirmar Acesso <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
