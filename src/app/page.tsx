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
      <div className="min-h-screen bg-[#09090b] flex justify-center items-center">
        {/* Spinner o schermata nera fluida */}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden flex items-center justify-center p-6 sm:p-12 lg:p-24">
      {/* Background decoration opzionale */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mt-[-5%]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Colonna di Sinistra: Copywriting */}
        <div className="flex flex-col items-start text-left">

          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-zinc-300">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              Aggiornato alla Riforma Fiscale 2026
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Il tuo conto in banca <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">ti mente.</span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10 max-w-xl">
              1000€ incassati non sono 1000€ in tasca. Calcola Fisco e Cassa Forense in tempo reale, abbatti le tasse con lo scanner intelligente e scopri qual è il tuo vero Netto. Niente più sorprese a giugno.
            </p>
          </motion.div>

        </div>

        {/* Colonna di Destra: Form Clerk */}
        <motion.div
          className="w-full flex justify-center lg:justify-end"
          variants={itemVariants as any}
        >
          <div className="w-full max-w-md p-6 sm:p-8 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Glow interno per il form */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <SignIn
                routing="hash"
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#4f46e5', // indigo-600
                    colorBackground: 'transparent',
                    colorInputBackground: 'rgba(255,255,255,0.05)',
                    colorInputText: '#ffffff',
                    colorText: '#ffffff',
                    fontFamily: 'var(--font-geist-sans)'
                  },
                  elements: {
                    card: 'bg-transparent shadow-none',
                    headerTitle: 'text-2xl font-bold tracking-tight text-white hidden',
                    headerSubtitle: 'text-zinc-400 hidden',
                    // Hiding the default headers to make it ultra minimal, or leaving them if preferred
                    socialButtonsBlockButton: 'border-white/10 hover:bg-white/5 text-white transition-colors',
                    formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all rounded-xl',
                    formFieldInput: 'border-white/10 focus:border-indigo-500 rounded-xl transition-colors',
                    footerActionLink: 'text-indigo-400 hover:text-indigo-300',
                    dividerLine: 'bg-white/10',
                    dividerText: 'text-zinc-500',
                  }
                }}
              />
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
