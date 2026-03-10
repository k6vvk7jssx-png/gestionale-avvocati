"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExpenseContext } from "@/context/ExpenseContext";
import { motion } from "framer-motion";
import { Calculator, CheckCircle2 } from "lucide-react";

const CATEGORIE_DEDUCIBILI = [
    "Software/Abbonamenti",
    "Auto",
    "Cancelleria",
    "Corsi di Formazione",
    "Ristoranti",
    "Bollette/Utenze"
];

const CATEGORIE_ALTRE = [
    "Alimentari",
    "Salute",
    "Altro"
];

const TUTTE_CATEGORIE_ALFABETICO = [...CATEGORIE_DEDUCIBILI, ...CATEGORIE_ALTRE].sort();

export default function AggiungiSpesa() {
    const router = useRouter();
    const { regime, addExpense } = useExpenseContext();

    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(
        regime === "ordinario" ? CATEGORIE_DEDUCIBILI[0] : TUTTE_CATEGORIE_ALFABETICO[0]
    );
    const [description, setDescription] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSave = () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert("Inserisci un importo valido");
            return;
        }

        addExpense({
            amount: parseFloat(amount),
            category,
            description
        });

        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setAmount("");
            setDescription("");
            setCategory(regime === "ordinario" ? CATEGORIE_DEDUCIBILI[0] : TUTTE_CATEGORIE_ALFABETICO[0]);
            router.push("/dashboard");
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-[#f2f2f7] dark:bg-black text-black dark:text-white pb-24 px-4 pt-6">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Aggiungi Spesa</h1>
                    <div className="bg-[#007AFF]/10 text-[#007AFF] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {regime}
                    </div>
                </div>

                {isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                        <h2 className="text-xl font-semibold">Spesa Aggiunta!</h2>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Importo */}
                        <div className="ios-card bg-white dark:bg-[#1c1c1e] p-5">
                            <label className="block text-sm font-medium opacity-70 mb-2">Importo (€)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl opacity-50">€</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full bg-transparent text-4xl font-bold pl-12 py-2 outline-none"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Categoria Select - Logica Bivio Fiscale */}
                        <div className="ios-card bg-white dark:bg-[#1c1c1e] p-5">
                            <label className="block text-sm font-medium opacity-70 mb-2">Categoria Spesa</label>
                            <select
                                className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 text-lg outline-none appearance-none"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {regime === "ordinario" ? (
                                    <>
                                        <optgroup label="✓ Deducibili">
                                            {CATEGORIE_DEDUCIBILI.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Altre Spese">
                                            {CATEGORIE_ALTRE.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </optgroup>
                                    </>
                                ) : (
                                    <>
                                        {TUTTE_CATEGORIE_ALFABETICO.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Descrizione (Opzionale) */}
                        <div className="ios-card bg-white dark:bg-[#1c1c1e] p-5">
                            <label className="block text-sm font-medium opacity-70 mb-2">Descrizione (Opzionale)</label>
                            <input
                                type="text"
                                placeholder="Es: Cena cliente Rossi"
                                className="w-full bg-transparent text-lg outline-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Tasto Aggiungi in basso */}
                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                className="w-full bg-[#007AFF] text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Calculator className="w-5 h-5" />
                                Aggiungi Spesa
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
