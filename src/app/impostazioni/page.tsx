"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { salvaProfiloAction, getProfiloAction } from './actions';

export default function Impostazioni() {
    const { isLoaded, isSignedIn } = useUser();

    // Stati per le impostazioni
    const [regime, setRegime] = useState<"ordinario" | "forfettario" | "free">("forfettario");
    const [aliquotaForfettario, setAliquotaForfettario] = useState<"5" | "15">("15");
    const [scaglioneIrpef, setScaglioneIrpef] = useState<"23" | "35" | "43">("23");
    const [sogliaFaccina, setSogliaFaccina] = useState<string>("40");
    const [isSaved, setIsSaved] = useState(false);
    const [, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isSignedIn) return;

        const fetchProfilo = async () => {
            try {
                const { data } = await getProfiloAction();

                if (data) {
                    if (data.regime_fiscale.includes("forfettario")) {
                        setRegime("forfettario");
                        setAliquotaForfettario(data.regime_fiscale.split("_")[1] as "5" | "15");
                    } else {
                        setRegime(data.regime_fiscale as "ordinario" | "free");
                    }
                    if (data.expected_irpef_bracket) setScaglioneIrpef(data.expected_irpef_bracket);
                    if (data.sad_face_threshold) setSogliaFaccina(data.sad_face_threshold.toString());
                }
            } catch (err) {
                console.error("Catch error fetch:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfilo();
    }, [isSignedIn]);

    const salvaImpostazioni = async () => {
        setIsLoading(true);

        let regimeDaSalvare = regime as string;
        if (regime === "forfettario") {
            regimeDaSalvare = `forfettario_${aliquotaForfettario}`;
        }

        try {
            const result = await salvaProfiloAction({
                regime_fiscale: regimeDaSalvare,
                expected_irpef_bracket: scaglioneIrpef,
                sad_face_threshold: parseInt(sogliaFaccina),
            });

            if (result.error) throw new Error(result.error);

            // Salva anche nel local storage come backup veloce per l'UI sincrona
            localStorage.setItem("regime_fiscale_generale", regimeDaSalvare);
            localStorage.setItem("soglia_faccina", sogliaFaccina);
            localStorage.setItem("scaglione_irpef", scaglioneIrpef);

            // Forza l'aggiornamento del contesto globale (stesso tab)
            window.dispatchEvent(new Event('storage'));

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Errore salvataggio profilo:", err);
            alert("Errore salvataggio: " + err.message);
        } finally {
            setIsLoading(false);
        }
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

                {regime === "ordinario" && (
                    <div style={{ marginTop: "1rem", padding: "10px", background: "rgba(255,149,0,0.05)", borderRadius: "12px", border: "1px solid var(--warning)" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Scaglione IRPEF Marginale</label>
                        <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1rem" }}>Utilizzato per stimare le tasse nella Dashboard dopo aver sottratto spese deducibili e cassa.</p>
                        <div className="ios-select-group" style={{ flexDirection: 'column', gap: '8px' }}>
                            <button
                                className={`ios-segment ${scaglioneIrpef === '23' ? 'active' : ''}`}
                                onClick={() => setScaglioneIrpef('23')}
                                style={{ textAlign: 'left', padding: '12px' }}
                            >
                                <div style={{ fontWeight: 'bold' }}>23%</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>1° Scaglione: Da 0 a 28.000 €</div>
                            </button>
                            <button
                                className={`ios-segment ${scaglioneIrpef === '35' ? 'active' : ''}`}
                                onClick={() => setScaglioneIrpef('35')}
                                style={{ textAlign: 'left', padding: '12px' }}
                            >
                                <div style={{ fontWeight: 'bold' }}>35%</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>2° Scaglione: Da 28.001 a 50.000 €</div>
                            </button>
                            <button
                                className={`ios-segment ${scaglioneIrpef === '43' ? 'active' : ''}`}
                                onClick={() => setScaglioneIrpef('43')}
                                style={{ textAlign: 'left', padding: '12px' }}
                            >
                                <div style={{ fontWeight: 'bold' }}>43%</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>3° Scaglione: Oltre i 50.000 €</div>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="ios-card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Indicatore Visivo di Spesa</h3>
                <p style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "1rem" }}>
                    Imposta la soglia massima percentuale rispetto alle entrate prima che l&apos;indicatore di Dashboard (Check Verde) diventi una X Rossa d&apos;allarme.
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
