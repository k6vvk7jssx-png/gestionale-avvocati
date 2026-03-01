"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { dark } from "@clerk/themes";

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
      <div className="min-h-screen bg-[#050505] flex justify-center items-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  // Animazioni Staggered Apple-style
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)', scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as any }
    },
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col justify-center items-center p-4 sm:p-8 lg:p-24 selection:bg-indigo-500/30">

      {/* Sfondi Ammorbidenti (Blobs Animati) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] lg:w-[40%] lg:h-[60%] bg-indigo-600/40 blur-[130px] rounded-full mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -90, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[10%] w-[80%] h-[80%] lg:w-[40%] lg:h-[60%] bg-purple-600/40 blur-[140px] rounded-full mix-blend-screen"
        />
        {/* Grain texture leggera */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 mt-[-2rem] sm:mt-0"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Sinistra: Copywriting Raffinato */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">

          <motion.div variants={itemVariants} className="mb-6 lg:mb-8">
            <div className="group relative inline-flex items-center justify-center px-4 py-1.5 overflow-hidden rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-default">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex h-2 w-2 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="relative text-xs sm:text-sm font-medium tracking-wide text-zinc-300">
                Aggiornato alla Riforma Fiscale 2026
              </span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6">
              Il tuo <span className="text-zinc-500 transition-colors duration-500 hover:text-zinc-300 cursor-default">conto</span><br /> in banca
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-gradient-text text-transparent bg-clip-text pb-1">
                ti mente.
              </span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed mb-0 max-w-lg font-light tracking-wide">
              1000€ incassati non sono 1000€ in tasca. Calcola Fisco e Cassa Forense in tempo reale. Usa lo scanner intelligente. Scopri qual è il tuo <strong className="text-indigo-200">vero netto</strong>.
            </p>
            <p className="text-sm sm:text-base text-zinc-500 mt-4 italic">
              Niente più sorprese a giugno.
            </p>
          </motion.div>

        </div>

        {/* Destra: Form Clerk Premium */}
        <motion.div
          className="w-full max-w-md lg:w-[440px] flex justify-center perspective-[2000px]"
          variants={itemVariants}
        >
          <motion.div
            className="w-full rounded-[32px] p-[1.5px] bg-gradient-to-b from-white/20 to-white/5 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl"
            whileHover={{ scale: 1.015, rotateY: -1, rotateX: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="bg-[#09090b]/90 rounded-[30px] p-5 sm:p-7 relative overflow-hidden h-full w-full">
              {/* Decorative light reflection inside card */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-[30px]" />

              <div className="relative z-10">
                <SignIn
                  routing="hash"
                  appearance={{
                    baseTheme: dark,
                    variables: {
                      colorPrimary: '#6366f1', // indigo-500
                      colorBackground: 'transparent',
                      colorInputBackground: 'rgba(255,255,255,0.03)',
                      colorInputText: '#ffffff',
                      colorText: '#e4e4e7',
                      colorTextSecondary: '#a1a1aa',
                      fontFamily: 'var(--font-geist-sans)',
                      borderRadius: '0.75rem',
                    },
                    elements: {
                      card: 'bg-transparent shadow-none p-0',
                      // Sopprimiamo pesantemente gli Header sgraziati di Clerk (Titoli e sottotitoli)
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      header: 'hidden',
                      footer: 'pt-2 pb-0',
                      socialButtonsBlockButton: 'border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 rounded-[14px] py-3.5 shadow-sm',
                      socialButtonsBlockButtonText: 'font-medium tracking-wide',
                      formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 rounded-[14px] py-3.5 font-semibold tracking-wide text-[15px]',
                      formFieldInput: 'border-white/10 focus:border-indigo-500 bg-black/30 rounded-[14px] transition-all px-4 py-3',
                      formFieldLabel: 'text-zinc-400 text-xs font-semibold uppercase tracking-wider',
                      dividerLine: 'bg-white/10',
                      dividerText: 'text-zinc-600 font-medium text-xs uppercase tracking-wider',
                      footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-semibold',
                      footerActionText: 'text-zinc-500',
                      identityPreviewEditButton: 'text-indigo-400 hover:text-indigo-300',
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Stile CSS Globale Injected per effetti Text Gradient specifici */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          animation: gradient-text 4s ease infinite;
        }
        /* Forza off eventuali artefatti Clerk nell'header se le props TS fallissero */
        .cl-header { display: none !important; }
      `}} />

      {/* Footer / Disclaimer Legale Beta Aggiornato e Minimizzato */}
      <motion.div
        className="absolute bottom-4 left-0 w-full px-6 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1.5 }}
      >
        <p className="text-[10px] sm:text-[11px] text-zinc-600 max-w-4xl mx-auto leading-relaxed">
          <strong>Beta Privata.</strong> Software fornito as-is a scopo di test (Senza P.IVA). Le stime AI/fiscali (IRPEF/Cassa Forense) non costituiscono parere professionale.<br className="hidden sm:block" />
          Elaborazione OCR offline locale su dispositivo. Vengono impiegati esclusivamente cookie tecnici per la validazione sessione sicura.
        </p>
      </motion.div>
    </div>
  );
}
