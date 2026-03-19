"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useExpenseContext } from "@/context/ExpenseContext";
import { motion } from "framer-motion";
import { Delete, Calculator } from "lucide-react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TUTTE_CATEGORIE = [
    { id: "Alimenti", label: "Alimenti", deducibilita: "0%" },
    { id: "Ristoranti", label: "Ristoranti", deducibilita: "75%" },
    { id: "Salute", label: "Salute", deducibilita: "0%" },
    { id: "Lavoro", label: "Lavoro", deducibilita: "100%" },
    { id: "Cancelleria", label: "Cancelleria", deducibilita: "100%" },
    { id: "Software", label: "Software/Servizi", deducibilita: "100%" },
    { id: "Telefonia", label: "Telefonia/Internet", deducibilita: "80%" },
    { id: "Auto/Trasporti", label: "Auto/Trasporti", deducibilita: "20%" },
    { id: "Carburante", label: "Carburante", deducibilita: "20%" },
    { id: "Viaggi", label: "Viaggi/Trasferte", deducibilita: "20%" },
    { id: "Spese Clienti", label: "Spese per Clienti", deducibilita: "100%" },
    { id: "Rappresentanza", label: "Rappresentanza", deducibilita: "100%" },
    { id: "Tasse", label: "Cassa Forense", deducibilita: "100%" },
    { id: "Senza Tasse", label: "Senza Tasse", deducibilita: "0%" },
    { id: "Utenze", label: "Utenze Studio", deducibilita: "50%" },
    { id: "Affitto", label: "Affitto Studio", deducibilita: "50%" },
    { id: "Formazione", label: "Formazione/Master", deducibilita: "100%" },
    { id: "Abbigliamento", label: "Toga", deducibilita: "100%" },
    { id: "Imprevisti", label: "Imprevisti", deducibilita: "0%" },
    { id: "Altro", label: "Altro", deducibilita: "0%" },
];

export default function AggiungiSpesa() {
    const router = useRouter();
    const { regime, addExpense } = useExpenseContext();

    const { user } = useUser();
    const { session } = useSession();

    const [amount, setAmount] = useState<string>("0");
    const [selectedCategory, setSelectedCategory] = useState<string>("Cancelleria");
    const [description, setDescription] = useState<string>("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getSupabase = useCallback(() => {
        return createClient(supabaseUrl, supabaseKey, {
            global: {
                fetch: async (url, options = {}) => {
                    let clerkToken;
                    try {
                        clerkToken = await session?.getToken({ template: 'supabase' });
                    } catch {
                        clerkToken = await session?.getToken();
                    }
                    const headers = new Headers(options?.headers);
                    if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`);
                    return fetch(url, { ...options, headers, cache: 'no-store' });
                },
            },
        });
    }, [session]);

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

        const parsedAmount = parseFloat(amount.replace(',', '.'));
        setIsSaving(true);

        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('transazioni')
                .insert([{
                    user_id: user?.id,
                    importo: parsedAmount,
                    categoria: selectedCategory,
                    descrizione: description.trim(),
                    data_transazione: new Date().toISOString().split('T')[0], // formato YYYY-MM-DD
                    tipo: 'uscita',
                }]);

            if (error) {
                console.error("Errore inserimento Supabase:", error);
                alert("Errore durante il salvataggio: " + error.message);
                setIsSaving(false);
                return;
            }

            // Ottimistico per React Context (se usato altrove istantaneamente)
            addExpense({
                amount: parsedAmount,
                category: selectedCategory,
                description: description.trim()
            });

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setAmount("0");
                setDescription("");
                setIsSaving(false);
                router.refresh(); // Invalida la cache di Next.js
                router.push("/dashboard"); // Naviga alla dashboard che caricherà i nuovi dati
            }, 800);
        } catch (err: any) {
            console.error("Errore imprevisto:", err);
            alert("Si è verificato un errore imprevisto.");
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col pb-24 items-center px-4">
            {/* Header Semplice */}
            <div className="w-full max-w-md pt-6 pb-2 flex items-center justify-between">
                <h1 className="text-xl font-medium tracking-tight text-white/90">Aggiungi Spesa</h1>
                <div className="flex gap-2 items-center">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${regime === 'ordinario' ? 'bg-[#007AFF]/20 text-[#007AFF]' : 'bg-orange-500/20 text-orange-500'}`}>
                        {regime}
                    </span>
                    <span className="text-emerald-400 font-medium text-sm bg-emerald-400/10 px-3 py-1 rounded-full">
                        Fast Mode ⚡
                    </span>
                </div>
            </div>

            <div className="w-full max-w-md flex-1 flex flex-col justify-end">
                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center py-20"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Calculator className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-semibold">Spesa Registrata!</h2>
                    </motion.div>
                ) : (
                    <>
                        {/* 1. DISPLAY IMPORTO */}
                        <div className="flex flex-col items-end justify-center py-4 mb-2">
                            <div className="text-white/50 text-sm mb-1 font-medium tracking-wider">Importo Totale</div>
                            <div className="text-6xl md:text-7xl font-bold tracking-tighter text-white tabular-nums flex items-baseline">
                                <span className="text-3xl text-white/50 mr-2 font-normal">€</span>
                                {amount}
                            </div>
                        </div>

                        {/* 3. SELETTORE CATEGORIA RAPIDO (Pillole / Badge) */}
                        <div className="w-full mb-6 relative">
                            <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {TUTTE_CATEGORIE.map((cat) => {
                                    const isActive = selectedCategory === cat.id;
                                    const isDeducibile = cat.deducibilita !== "0%";
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`snap-start whitespace-nowrap px-4 py-3 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center min-w-[105px] ${isActive
                                                ? "bg-[#007AFF]/20 border-[#007AFF] text-white"
                                                : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                                                }`}
                                        >
                                            <span className={`font-semibold text-sm ${isActive ? "text-[#007AFF]" : ""}`}>
                                                {cat.label}
                                            </span>
                                            {/* Mostra il badge di deducibilità SOLO se siamo in ordinario e se c'è % */}
                                            {regime === "ordinario" && isDeducibile && (
                                                <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${isActive ? "text-[#007AFF]/80" : "text-emerald-400/70"}`}>
                                                    Ded. {cat.deducibilita}
                                                </span>
                                            )}
                                            {/* Per ordinario, se NON c'è deducibilità, mostra chiaramente 0% o No Ded. */}
                                            {regime === "ordinario" && !isDeducibile && (
                                                <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${isActive ? "text-red-400/80" : "text-white/20"}`}>
                                                    No Ded.
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Sfumatura laterale per indicare lo scroll */}
                            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none"></div>
                        </div>

                        {/* DESCRIZIONE (Opzionale) */}
                        <div className="w-full mb-6">
                            <input
                                type="text"
                                placeholder="Aggiungi una descrizione (opzionale)..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-white/40 focus:outline-none focus:border-[#007AFF]/50 transition-colors"
                            />
                        </div>

                        {/* INPUT NATIVO PER DESKTOP (nascosto su mobile) */}
                        <div className="hidden md:block w-full mb-6">
                            <div className="text-white/50 text-xs mb-2 uppercase tracking-wider font-bold">Importo Manuale da Tastiera</div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/50">€</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={amount === "0" ? "" : amount.replace(',', '.')}
                                    onChange={(e) => setAmount(e.target.value.replace('.', ','))}
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-2xl text-white font-bold focus:outline-none focus:border-[#007AFF]/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* 2. TASTIERINO NUMERICO CUSTOM (GLASSMORPHISM) - VISIBILE SOLO SU MOBILE */}
                        <div className="grid grid-cols-3 gap-3 mb-6 md:hidden">
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
                            disabled={isSaving}
                            className={`w-full bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-lg py-5 rounded-2xl shadow-[0_0_20px_rgba(0,122,255,0.4)] transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? "Salvataggio..." : "Registra Spesa"}
                        </motion.button>
                    </>
                )}
            </div>
        </div>
    );
}
