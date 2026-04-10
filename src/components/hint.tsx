"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";

interface HintProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function Hint({ id, title, children }: HintProps) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(`hint-dismissed-${id}`);
    setDismissed(stored === "true");
  }, [id]);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(`hint-dismissed-${id}`, "true");
  };

  if (dismissed) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <div className="mt-0.5 text-sm text-amber-700 leading-relaxed">
            {children}
          </div>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
          title="Fechar dica"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
