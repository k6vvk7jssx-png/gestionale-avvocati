"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronRight } from "lucide-react";

interface AiAdvisorProps {
  financialData: {
    entrate: number;
    uscite: number;
    tasse: number;
    regime: string;
  };
}

export default function AiAdvisor({ financialData }: AiAdvisorProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialData }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ios-card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold m-0">AI Fiscal Advisor</h3>
      </div>

      {insights.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-sm opacity-60 mb-6">
            Ottieni consigli personalizzati basati sui tuoi dati di questo mese.
          </p>
          <button
            onClick={analyzeData}
            disabled={loading}
            className="ios-btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Analizza Dati
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-3 bg-black/5 dark:bg-white/5 rounded-xl text-sm leading-relaxed border border-black/5 dark:border-white/5"
            >
              {insight}
            </div>
          ))}
          <button
            onClick={analyzeData}
            disabled={loading}
            className="mt-auto text-xs text-blue-500 font-medium hover:underline flex items-center gap-1"
          >
            {loading ? "Aggiornamento..." : "Ricalcola consigli"}
          </button>
        </div>
      )}
    </div>
  );
}
