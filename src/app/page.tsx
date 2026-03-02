"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { dark } from "@clerk/themes";
import { CheckCircle2, Scale, User, Sparkles } from "lucide-react";

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
      <div className="min-h-screen bg-[#111827] flex justify-center items-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col xl:flex-row overflow-hidden text-slate-100 bg-[#1e293b] selection:bg-emerald-500/30">

      {/* COLONNA SINISTRA */}
      <div className="relative flex-1 flex flex-col justify-between p-8 lg:p-12 xl:p-16 bg-[#18212f] overflow-hidden border-b border-white/5 xl:border-b-0 xl:border-r">

        {/* Glow Radiale Caldo */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-gradient-to-br from-[#c19a6b]/40 via-[#8b6b4a]/20 to-transparent blur-[100px] rounded-full pointer-events-none mix-blend-screen" />

        {/* Header Sinistro: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Scale className="w-8 h-8 text-white" strokeWidth={1.5} />
          <span className="text-2xl font-semibold tracking-wide">Gestionale Facile</span>
        </div>

        {/* Contenuto Centrale Sinistro */}
        <div className="relative z-10 my-16 xl:my-auto max-w-xl">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10"
          >
            <span className="text-sm text-slate-300">
              Aggiornato 2026 | Riservato agli Avvocati
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Scopri il tuo <span className="text-emerald-400">vero netto</span>.
            <br />
            Senza sorprese.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-light"
          >
            Il tuo conto in banca non ti dice tutta la verità. Il primo gestionale fiscale che calcola in tempo reale <strong className="text-white font-medium">tasse, cassa forense e deduzioni</strong> per gli studi legali.
          </motion.p>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4 mb-12"
          >
            {[
              "Calcolo istantaneo del netto reale.",
              "Ottimizzazione delle spese deducibili.",
              "Niente più ansia per gli F24."
            ].map((text, i) => (
              <li key={i} className="flex items-center text-slate-200 text-lg">
                <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-400 shrink-0" strokeWidth={2.5} />
                <span>{text}</span>
              </li>
            ))}
          </motion.ul>

        </div>

        {/* Footer Sinistro */}
        <div className="relative z-10 mt-auto pt-8">
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
            Beta Privata. Software fornito as-is per test. Le stime AI/fiscali non costituiscono parere professionale. Elaborazione OCR locale offline. Solo cookie tecnici.
          </p>
        </div>

      </div>

      {/* COLONNA DESTRA */}
      <div className="relative flex-1 flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 bg-[#1f2937]">

        {/* Header Destro: Contact Us & Avatar */}
        <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
          <button className="px-5 py-2 text-sm rounded-full border border-white/20 text-slate-300 hover:bg-white/5 transition-colors font-medium">
            Contact Us
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Sparkle Icon in basso a destra */}
        <div className="absolute bottom-8 right-8 text-slate-600 z-10 pointer-events-none">
          <Sparkles className="w-16 h-16" strokeWidth={1} />
        </div>

        {/* Card di Login */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative z-30 w-full max-w-md"
        >
          <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Accedi al Gestionale</h2>
              <p className="text-slate-400 text-sm">La tua area finanziaria sicura.</p>
            </div>

            <div className="clerk-container flex justify-center">
              <SignIn
                routing="hash"
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#10b981', // emerald-500
                    colorBackground: 'transparent',
                    colorInputBackground: 'transparent',
                    colorInputText: '#f8fafc',
                    colorText: '#cbd5e1',
                    colorTextSecondary: '#94a3b8',
                    fontFamily: 'inherit',
                  },
                  elements: {
                    card: 'bg-transparent shadow-none p-0 w-full',
                    header: 'hidden',
                    footer: 'hidden',
                    socialButtonsBlockButton: 'border border-white/10 bg-transparent hover:bg-white/5 text-white transition-all duration-300 rounded-[12px] py-3 shadow-none w-full justify-center',
                    socialButtonsBlockButtonText: 'font-medium tracking-wide text-[15px]',
                    formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 rounded-[12px] py-3.5 font-semibold tracking-wide text-[15px] w-full mt-4',
                    formFieldInput: 'border-white/10 focus:border-emerald-500 bg-black/20 rounded-[12px] transition-all px-4 py-3',
                    formFieldLabel: 'text-slate-400 text-xs font-semibold uppercase tracking-wider',
                    dividerLine: 'bg-white/10',
                    dividerText: 'text-slate-500 font-medium text-xs uppercase tracking-wider bg-[#1f2937]',
                  }
                }}
              />
            </div>

            <div className="mt-8 text-center">
              <span className="text-xs text-slate-500">Secured by Clerk</span>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
