"use client";

import { useState, useEffect } from "react";
import { useUser, useSession } from "@clerk/nextjs";

export default function Impostazioni() {
    const { isLoaded, isSignedIn, user } = useUser();

    // Stati per le impostazioni
    const [regime, setRegime] = useState<"ordinario" | "forfettario" | "free">("forfettario");
    const [aliquotaForfettario, setAliquotaForfettario] = useState<"5" | "15">("15");
    const [sogliaFaccina, setSogliaFaccina] = useState<string>("40");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Carica le impostazioni salvate all'avvio
        const savedRegime = localStorage.getItem("regime_fiscale_generale");
        if (savedRegime) {
            if (savedRegime.includes("forfettario")) {
                setRegime("forfettario");
                setAliquotaForfettario(savedRegime.split("_")[1] as "5" | "15");
            } else {
                setRegime(savedRegime as "ordinario" | "free");
            }
        }

        const savedSoglia = localStorage.getItem("soglia_faccina");
        if (savedSoglia) {
            setSogliaFaccina(savedSoglia);
        }
    }, []);

    const salvaImpostazioni = () => {
        let regimeDaSalvare = regime;
        if (regime === "forfettario") {
            regimeDaSalvare = `forfettario_${aliquotaForfettario}` as any;
        }

        localStorage.setItem("regime_fiscale_generale", regimeDaSalvare);
        localStorage.setItem("soglia_faccina", sogliaFaccina);

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="pb-20">
            <h1>Impostazioni Profilo</h1>
            <p style={{ opacity: 0.7, marginBottom: "2rem" }}>Configura il tuo gestionale per personalizzare calcoli e avvisi.</p>

            <div className="ios-card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Regime Fiscale Predefinito</h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
                    Questa scelta verrà usata come default per le nuove entrate e per decidere se calcolare la deducibilità delle spese (valida solo per Ordinario).
                </p>

                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Tipologia Regime</label>
                <div className="ios-select-group" style={{ marginBottom: "1rem" }}>
                    <button
                        className={`ios-segment ${regime === 'forfettario' ? 'active' : ''}`}
                        onClick={() => setRegime('forfettario')}
                    >
                        Forfettario
                    </button>
                    <button
                        className={`ios-segment ${regime === 'ordinario' ? 'active' : ''}`}
                        onClick={() => setRegime('ordinario')}
                    >
                        Ordinario
                    </button>
                    <button
                        className={`ios-segment ${regime === 'free' ? 'active' : ''}`}
                        onClick={() => setRegime('free')}
                    >
                        Esente
                    </button>
                </div>

                {regime === "forfettario" && (
                    <div style={{ marginTop: "1rem", padding: "10px", background: "rgba(0,122,255,0.05)", borderRadius: "12px", border: "1px solid var(--primary)" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Aliquota Sostitutiva (Forfettario)</label>
                        <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1rem" }}>Entrambe le opzioni includono il Modello Redditi standard (Coefficiente 78%) e la Cassa Avvocati.</p>
                        <div className="ios-select-group">
                            <button
                                className={`ios-segment ${aliquotaForfettario === '5' ? 'active' : ''}`}
                                onClick={() => setAliquotaForfettario('5')}
                            >
                                5% (Start-up)
                            </button>
                            <button
                                className={`ios-segment ${aliquotaForfettario === '15' ? 'active' : ''}`}
                                onClick={() => setAliquotaForfettario('15')}
                            >
                                15% (Standard)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="ios-card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Avvisi Dashboard (Faccina)</h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
                    Imposta la soglia di spesa massima rispetto alle entrate prima che l'emoticon in Dashboard diventi triste 😢.
                </p>

                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Soglia di Spesa (%)</label>
                <select
                    className="ios-input"
                    style={{ appearance: "none" }}
                    value={sogliaFaccina}
                    onChange={(e) => setSogliaFaccina(e.target.value)}
                >
                    <option value="20">20% - Molto Cauto</option>
                    <option value="30">30% - Moderato</option>
                    <option value="40">40% - Standard</option>
                    <option value="50">50% - Flessibile</option>
                    <option value="60">60% - Rilassato</option>
                    <option value="70">70% - Alto</option>
                    <option value="80">80% - Molto Alto</option>
                    <option value="90">90% - Limite Estremo</option>
                </select>
            </div>

            <button className="ios-btn-large" onClick={salvaImpostazioni}>
                {isSaved ? "Salvato! ✔️" : "Salva Impostazioni"}
            </button>
        </div>
    );
}
