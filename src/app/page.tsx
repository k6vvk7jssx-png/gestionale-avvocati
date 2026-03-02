"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { dark } from "@clerk/themes";
import { CheckCircle2 } from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex flex-col lg:flex-row overflow-hidden relative selection:bg-blue-500/30">

      {/* Sfondo Astratto Colonna Sinistra / Globale */}
      <div className="absolute top-0 left-0 w-full lg:w-1/2 h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[700px] h-[700px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      </div>

      {/* COLONNA SINISTRA: Value Proposition */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 py-12 lg:p-16 xl:p-24 border-b border-white/5 lg:border-b-0 lg:border-r">
        <div className="max-w-xl mx-auto lg:mx-0">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wider text-blue-300 uppercase">
              Aggiornato 2026 | Riservato agli Avvocati
            </span>
          </motion.div>

          {/* Titolo Principale */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Scopri il tuo
            <span className="block mt-1 bg-gradient-to-r from-blue-400 to-amber-500 text-transparent bg-clip-text pb-2">
              vero netto.
            </span>
            Senza sorprese.
          </motion.h1>

          {/* Sottotitolo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed font-light"
          >
            Il tuo conto in banca non ti dice tutta la verità. Il primo gestionale fiscale che calcola in tempo reale <strong className="text-slate-200 font-medium">tasse, cassa forense e deduzioni</strong> per gli studi legali.
          </motion.p>

          {/* Bullet Points */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4 mb-12"
          >
            {[
              "Calcolo istantaneo del netto reale.",
              "Ottimizzazione delle spese deducibili.",
              "Niente più ansia per gli F24."
            ].map((text, i) => (
              <li key={i} className="flex items-center text-slate-300 text-lg">
                <CheckCircle2 className="w-5 h-5 mr-3 text-amber-500 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </motion.ul>

        </div>

        {/* Footer / Disclaimer (Desktop bottom-left, Mobile inline) */}
        <div className="mt-auto pt-8 border-t border-white/5 lg:border-none lg:pt-0">
          <p className="text-xs text-slate-500 leading-relaxed lg:max-w-md">
            Beta Privata. Software fornito as-is a scopo di test. Le stime non costituiscono parere professionale. Elaborazione OCR offline locale. Solo cookie tecnici.
          </p>
        </div>
      </div>

      {/* COLONNA DESTRA: Autenticazione */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-900/50 backdrop-blur-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-md relative"
        >
          {/* Decorative Glow behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 to-amber-500/20 rounded-[2rem] blur-xl opacity-50" />

          {/* Glassmorphism Card */}
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Accedi al Gestionale</h2>
              <p className="text-slate-400 text-sm">Inserisci le tue credenziali per iniziare.</p>
            </div>

            <div className="clerk-container flex justify-center">
              <SignIn
                routing="hash"
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#2563eb', // blue-600
                    colorBackground: 'transparent',
                    colorInputBackground: 'rgba(255,255,255,0.05)',
                    colorInputText: '#f8fafc',
                    colorText: '#cbd5e1',
                    colorTextSecondary: '#94a3b8',
                    fontFamily: 'inherit',
                    borderRadius: '0.75rem',
                  },
                  elements: {
                    card: 'bg-transparent shadow-none p-0 w-full',
                    header: 'hidden',
                    footer: 'hidden',
                    socialButtonsBlockButton: 'border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 rounded-[14px] py-3.5 shadow-sm w-full',
                    socialButtonsBlockButtonText: 'font-medium tracking-wide',
                    formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 rounded-[14px] py-4 font-semibold tracking-wide text-[16px] w-full',
                    formFieldInput: 'border-white/10 focus:border-blue-500 bg-black/20 rounded-[14px] transition-all px-4 py-3.5',
                    formFieldLabel: 'text-slate-400 text-xs font-semibold uppercase tracking-wider',
                    dividerLine: 'bg-white/10',
                    dividerText: 'text-slate-500 font-medium text-xs uppercase tracking-wider',
                  }
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
