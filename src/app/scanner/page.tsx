"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Delete } from "lucide-react";

// Togliamo le dipendenze inutilizzate Supabase/Clerk per ora o le lasciamo pronte ma non attive
// import { useUser, useSession } from "@clerk/nextjs";
// import { createClient } from "@supabase/supabase-js";

const CATEGORIES = [
    { id: "Cancelleria", label: "Cancelleria", badge: "100%" },
    { id: "Ristoranti", label: "Ristoranti", badge: "75%" },
    { id: "Utenze", label: "Utenze/Tel", badge: "80%" },
    { id: "Auto", label: "Auto", badge: "20%" },
    { id: "Altro", label: "Altro", badge: "" },
];

export default function FastExpenseEntry() {
    const router = useRouter();
    // const { isLoaded, isSignedIn, user } = useUser();
    // const { session } = useSession();

    const [amount, setAmount] = useState<string>("0");
    const [selectedCategory, setSelectedCategory] = useState<string>("Cancelleria");

    const handleKeyPress = (key: string) => {
        setAmount((prev) => {
            if (key === "BACKSPACE") {
                if (prev.length <= 1) return "0";
                return prev.slice(0, -1);
            }

            if (key === ",") {
                if (prev.includes(",")) return prev; // Solo una virgola permessa
                return prev + ",";
            }

            // Se è superato un limite logico (es. 2 decimali) blocca
            if (prev.includes(",")) {
                const dec = prev.split(",")[1];
                if (dec && dec.length >= 2) return prev;
            }

            if (prev === "0") {
                if (key === "0") return "0";
                return key;
            }

            return prev + key;
        });
    };

    const handleSave = async () => {
        if (amount === "0" || amount === "0,") {
            alert("Inserisci un importo valido.");
            return;
        }

        // Formatta il numero in Float per logiche future
        // const parsedAmount = parseFloat(amount.replace(',', '.'));

        console.log("Salvataggio Spesa Rapida:", { amount, category: selectedCategory });
        alert(`Spesa di €${amount} in ${selectedCategory} registrata (Logica DB disattivata temporaneamente per UI Test).`);

        // Reset
        setAmount("0");
        router.refresh();
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col pb-24 items-center px-4">

            {/* Header Semplice */}
            <div className="w-full max-w-md pt-6 pb-4 flex items-center justify-between">
                <h1 className="text-xl font-medium tracking-tight text-white/90">Aggiungi Spesa</h1>
                <span className="text-emerald-400 font-medium text-sm bg-emerald-400/10 px-3 py-1 rounded-full">
                    Fast Mode ⚡
                </span>
            </div>

            <div className="w-full max-w-md flex-1 flex flex-col justify-end">

                {/* 1. DISPLAY IMPORTO */}
                <div className="flex flex-col items-end justify-center py-6 mb-2">
                    <div className="text-white/50 text-sm mb-1 font-medium tracking-wider">Importo Totale</div>
                    <div className="text-6xl md:text-7xl font-bold tracking-tighter text-white tabular-nums flex items-baseline">
                        <span className="text-3xl text-white/50 mr-2 font-normal">€</span>
                        {amount}
                    </div>
                </div>

                {/* 3. SELETTORE CATEGORIA RAPIDO (Pillole / Badge) */}
                <div className="w-full mb-6 relative">
                    <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`snap-start whitespace-nowrap px-4 py-3 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center min-w-[100px] ${isActive
                                            ? "bg-[#007AFF]/20 border-[#007AFF] text-white"
                                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                                        }`}
                                >
                                    <span className={`font-semibold text-sm ${isActive ? "text-[#007AFF]" : ""}`}>
                                        {cat.label}
                                    </span>
                                    {cat.badge && (
                                        <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${isActive ? "text-[#007AFF]/80" : "text-white/30"}`}>
                                            Ded. {cat.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* Sfumatura laterale per indicare lo scroll */}
                    <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
                </div>

                {/* 2. TASTIERINO NUMERICO CUSTOM (GLASSMORPHISM) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <motion.button
                            key={num}
                            whileTap={{ scale: 0.92, backgroundColor: "rgba(255,255,255,0.2)" }}
                            onClick={() => handleKeyPress(num)}
                            className="bg-white/10 backdrop-blur-md rounded-2xl h-16 text-3xl font-medium text-white flex items-center justify-center border border-white/5 shadow-sm"
                        >
                            {num}
                        </motion.button>
                    ))}

                    <motion.button
                        whileTap={{ scale: 0.92, backgroundColor: "rgba(255,255,255,0.2)" }}
                        onClick={() => handleKeyPress(",")}
                        className="bg-white/5 backdrop-blur-md rounded-2xl h-16 text-3xl font-medium text-white/70 flex items-center justify-center border border-white/5"
                    >
                        ,
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.92, backgroundColor: "rgba(255,255,255,0.2)" }}
                        onClick={() => handleKeyPress("0")}
                        className="bg-white/10 backdrop-blur-md rounded-2xl h-16 text-3xl font-medium text-white flex items-center justify-center border border-white/5 shadow-sm"
                    >
                        0
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.92, backgroundColor: "rgba(255,255,255,0.2)" }}
                        onClick={() => handleKeyPress("BACKSPACE")}
                        className="bg-white/5 backdrop-blur-md rounded-2xl h-16 text-2xl font-medium text-white/70 flex items-center justify-center border border-white/5"
                    >
                        <Delete className="w-8 h-8 opacity-80" />
                    </motion.button>
                </div>

                {/* 4. BOTTONE SALVA STICKY */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    className="w-full bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-lg py-5 rounded-2xl shadow-[0_0_20px_rgba(0,122,255,0.4)] transition-all flex items-center justify-center gap-2"
                >
                    Registra Spesa
                </motion.button>

            </div>
        </div>
    );
}
