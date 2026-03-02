"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { dark } from "@clerk/themes";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

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

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col justify-center items-center p-4 sm:p-8 selection:bg-indigo-500/30 font-sans">

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
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div
              key="hook"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center cursor-pointer group px-4 shrink-0 mt-[-5%]"
              onClick={() => setShowLogin(true)}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-10 overflow-hidden rounded-full bg-white/5 border border-white/10 backdrop-blur-md opacity-70 group-hover:opacity-100 transition-opacity">
                <span className="relative flex h-2 w-2 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="relative text-xs sm:text-sm font-medium tracking-wide text-zinc-300 uppercase">
                  Aggiornato 2026
                </span>
              </div>

              <h1
                className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl"
                style={{ fontFamily: "Inter, 'SF Pro Display', sans-serif" }}
              >
                Il tuo conto in banca<br />
                <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-gradient-text text-transparent bg-clip-text pb-4">
                  ti mente.
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-zinc-400 mb-12 font-light max-w-2xl mx-auto group-hover:text-zinc-200 transition-colors">
                1000€ incassati non sono 1000€ in tasca.<br className="hidden sm:block" />
                Clicca per scoprire la verità.
              </p>

              <motion.div
                className="inline-flex w-16 h-16 rounded-full bg-indigo-600/20 items-center justify-center border border-indigo-500/30 group-hover:bg-indigo-600/40 group-hover:scale-110 transition-all duration-300"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex justify-center perspective-[2000px] mt-8"
            >
              <motion.div
                className="w-full max-w-md rounded-[32px] p-[1.5px] bg-gradient-to-b from-indigo-500/30 to-white/5 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="bg-[#09090b]/95 rounded-[30px] p-6 sm:p-8 relative overflow-hidden h-full w-full">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none rounded-t-[30px]" />

                  <div className="relative z-10">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Togliti i dubbi.</h2>
                      <p className="text-zinc-400 text-sm">Accedi per svelare il tuo vero netto.</p>
                    </div>

                    <SignIn
                      routing="hash"
                      appearance={{
                        baseTheme: dark,
                        variables: {
                          colorPrimary: '#6366f1',
                          colorBackground: 'transparent',
                          colorInputBackground: 'rgba(255,255,255,0.05)',
                          colorInputText: '#ffffff',
                          colorText: '#e4e4e7',
                          colorTextSecondary: '#a1a1aa',
                          fontFamily: 'var(--font-geist-sans)',
                          borderRadius: '0.75rem',
                        },
                        elements: {
                          card: 'bg-transparent shadow-none p-0',
                          header: 'hidden',
                          footer: 'pt-4 pb-0',
                          socialButtonsBlockButton: 'border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 rounded-[14px] py-3.5 shadow-sm',
                          socialButtonsBlockButtonText: 'font-medium tracking-wide',
                          formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 rounded-[14px] py-4 font-semibold tracking-wide text-[16px]',
                          formFieldInput: 'border-white/10 focus:border-indigo-500 bg-black/40 rounded-[14px] transition-all px-4 py-3.5',
                          formFieldLabel: 'text-zinc-400 text-xs font-semibold uppercase tracking-wider',
                          dividerLine: 'bg-white/10',
                          dividerText: 'text-zinc-500 font-medium text-xs uppercase tracking-wider',
                          footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-semibold',
                          footerActionText: 'text-zinc-500',
                        }
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
@keyframes gradient - text {
  0 % { background- position: 0 % 50 %;
}
50 % { background- position: 100 % 50 %; }
100 % { background- position: 0 % 50 %; }
        }
        .animate - gradient - text {
  animation: gradient - text 4s ease infinite;
}
        .cl - header { display: none!important; }
`}} />

      <motion.div
        className="absolute bottom-4 left-0 w-full px-6 text-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
      >
        <p className="text-[10px] sm:text-[11px] text-zinc-600 max-w-4xl mx-auto leading-relaxed">
          <strong>Beta Privata.</strong> Software fornito as-is a scopo di test (Senza P.IVA). Le stime AI/fiscali non costituiscono parere professionale.<br className="hidden sm:block" />
          Elaborazione OCR offline locale su dispositivo. Vengono impiegati esclusivamente cookie tecnici per sessioni sicure.
        </p>
      </motion.div>
    </div>
  );
}
