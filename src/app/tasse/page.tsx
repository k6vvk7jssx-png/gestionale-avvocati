"use client";

import { useState, useEffect } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function Tasse() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { session } = useSession();

    const getSupabase = () => {
        return createClient(supabaseUrl, supabaseKey, {
            global: {
                fetch: async (url, options = {}) => {
                    let clerkToken;
                    try {
                        clerkToken = await session?.getToken({ template: 'supabase' });
                    } catch (e) {
                        console.warn("Nessun template 'supabase' trovato in Clerk, uso token default");
                        clerkToken = await session?.getToken();
                    }
                    const headers = new Headers(options?.headers);
                    if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`);
                    return fetch(url, { ...options, headers, cache: 'no-store' });
                },
            },
        });
    };
    const [mod, setMod] = useState<"auto" | "manual">("auto");

    // Stati per Calcolatore Manuale
    const [lordo, setLordo] = useState<string>("");
    const [regime, setRegime] = useState<"forfettario_5" | "forfettario_15" | "ordinario" | "free">("forfettario_15");
    const [risultatoManuale, setRisultatoManuale] = useState<any>(null);

    // Dati dal Database
    const [datiAnnuali, setDatiAnnuali] = useState({
        incassatoLordo: 0,
        tasseDaPagare: 0,
        cassaDaPagare: 0,
        nettoTasche: 0,
        speseDeducibili: 0
    });
    const [isLoadingDati, setIsLoadingDati] = useState(true);

    useEffect(() => {
        if (isSignedIn && user && mod === "auto") {
            calcolaTasseAnnualiReali();
        }
    }, [isSignedIn, user, mod]);

    const calcolaTasseAnnualiReali = async () => {
        setIsLoadingDati(true);
        try {
            const supabase = getSupabase();
            // 1. Prendi tutte le Cause dell'anno corrente
            const currentYear = new Date().getFullYear();
            const startOfYear = `${currentYear}-01-01`;
            const endOfYear = `${currentYear}-12-31`;

            const { data: cause, error: errCause } = await supabase
                .from('cause')
                .select('*')
                .eq('user_id', user?.id)
                .gte('data_sentenza', startOfYear)
                .lte('data_sentenza', endOfYear);

            if (errCause) {
                console.error("Errore fetch cause annue:", errCause);
            }

            // 2. Prendi tutte le Spese dell'anno corrente
            const { data: spese } = await supabase
                .from('transazioni')
                .select('importo, importo_deducibile, categoria')
                .eq('user_id', user?.id)
                .eq('tipo', 'uscita')
                .gte('data_transazione', startOfYear)
                .lte('data_transazione', endOfYear);

            const speseTotaliDeducibili = (spese || []).reduce((acc, curr) => acc + Number(curr.importo_deducibile ?? curr.importo), 0);

            let totLordo = 0;
            let totTasse = 0;
            let totCassa = 0;
            let totNetto = 0;

            let imponibileOrdinarioAnnuo = 0;
            let totCpaOrdinario = 0;
            let totIvaOrdinario = 0;
            let totRitenutaOrdinario = 0;

            if (cause) {
                cause.forEach(c => {
                    const compensoBase = Number(c.compenso_base || c.compenso_lordo || 0);
                    const r = c.tipologia_fiscale || "forfettario_15";

                    if (r === "forfettario_5" || r === "forfettario_15") {
                        const speseGenerali = compensoBase * 0.15;
                        const redditoImponibileLordo = (compensoBase + speseGenerali) * 0.78;

                        const cassaSoggettiva = redditoImponibileLordo * 0.17;
                        const cpa = c.cpa_4 ? Number(c.cpa_4) : (compensoBase + speseGenerali) * 0.04;
                        const cassaForenseTotale = cassaSoggettiva + cpa;

                        const aliquota = r === "forfettario_5" ? 0.05 : 0.15;
                        const tasse = redditoImponibileLordo * aliquota;

                        // Per forfettario volume d'affari è Compenso base + 15% spese + CPA in fattura (esente IVA)
                        const volumeAffari = c.compenso_lordo ? Number(c.compenso_lordo) : (compensoBase + speseGenerali + cpa);

                        totLordo += volumeAffari;
                        totTasse += tasse;
                        totCassa += cassaForenseTotale;

                    } else if (r === "ordinario") {
                        const speseGenerali = compensoBase * 0.15;
                        imponibileOrdinarioAnnuo += (compensoBase + speseGenerali);

                        const cpa = c.cpa_4 ? Number(c.cpa_4) : (compensoBase + speseGenerali) * 0.04;
                        const iva = c.iva_22 ? Number(c.iva_22) : (compensoBase + speseGenerali + cpa) * 0.22;

                        totCpaOrdinario += cpa;
                        totIvaOrdinario += iva;
                        totRitenutaOrdinario += c.ritenuta_20 ? Number(c.ritenuta_20) : 0;

                        const volumeAffari = c.compenso_lordo ? Number(c.compenso_lordo) : (compensoBase + speseGenerali + cpa + iva);
                        totLordo += volumeAffari;
                    }
                });
            }

            if (imponibileOrdinarioAnnuo > 0) {
                // Sottraiamo le spese deducibili dall'imponibile di cassa ordinario
                let imponibileCassa = imponibileOrdinarioAnnuo - speseTotaliDeducibili;
                if (imponibileCassa < 0) imponibileCassa = 0;

                const cassaSoggettiva = imponibileCassa * 0.17;
                const cassaForenseTotale = cassaSoggettiva + totCpaOrdinario;

                const imponibileIrpef = imponibileCassa - cassaSoggettiva;
                // Calcolo IRPEF medio (stima a 33% e 3% addizionali)
                const irpef = imponibileIrpef * 0.33;
                const addizionali = imponibileIrpef * 0.03;

                const fiscoTotale = totIvaOrdinario + irpef + addizionali - totRitenutaOrdinario;

                totTasse += fiscoTotale;
                totCassa += cassaForenseTotale;
            }

            totNetto = totLordo - totTasse - totCassa;

            setDatiAnnuali({
                incassatoLordo: totLordo,
                tasseDaPagare: totTasse,
                cassaDaPagare: totCassa,
                nettoTasche: totNetto,
                speseDeducibili: speseTotaliDeducibili
            });

        } catch (error) {
            console.error("Errore nel calcolo tasse reali", error);
        } finally {
            setIsLoadingDati(false);
        }
    };

    const calcolaManuale = () => {
        const importoLordo = parseFloat(lordo.replace(",", "."));
        if (isNaN(importoLordo) || importoLordo <= 0) return;

        let imponibile = 0, tasse = 0, cassa = 0, netto = 0, volumeAffariLordo = 0;

        if (regime === "forfettario_5" || regime === "forfettario_15") {
            const compensoBase = importoLordo;
            const speseGenerali = compensoBase * 0.15;
            const redditoImponibileLordo = (compensoBase + speseGenerali) * 0.78;

            const cassaSoggettiva = redditoImponibileLordo * 0.17;
            const cpa = (compensoBase + speseGenerali) * 0.04;
            cassa = cassaSoggettiva + cpa;

            const aliquotaTasse = regime === "forfettario_5" ? 0.05 : 0.15;
            tasse = redditoImponibileLordo * aliquotaTasse;

            volumeAffariLordo = compensoBase + speseGenerali + cpa;
            imponibile = redditoImponibileLordo;
            netto = volumeAffariLordo - tasse - cassa;
        } else if (regime === "ordinario") {
            const compensoBase = importoLordo;
            const speseGenerali = compensoBase * 0.15;
            const speseDeducibili = 0; // Simulazione manuale non ha spese caricate

            const imponibileCassa = (compensoBase + speseGenerali) - speseDeducibili;
            const cassaSoggettiva = imponibileCassa * 0.17;
            const cpa = (compensoBase + speseGenerali) * 0.04;
            cassa = cassaSoggettiva + cpa;

            const ivaDaVersare = (compensoBase + speseGenerali + cpa) * 0.22;

            const imponibileIrpef = imponibileCassa - cassaSoggettiva;
            const irpef = imponibileIrpef * 0.43; // Simulazione su scaglione 43%
            const addizionali = imponibileIrpef * 0.03;
            tasse = ivaDaVersare + irpef + addizionali;

            volumeAffariLordo = compensoBase + speseGenerali + cpa + ivaDaVersare;
            imponibile = imponibileIrpef;
            netto = volumeAffariLordo - tasse - cassa;
        } else {
            // Free
            imponibile = 0; tasse = 0; cassa = 0; netto = importoLordo; volumeAffariLordo = importoLordo;
        }

        setRisultatoManuale({ imponibile, tasse, cassa, netto, volumeAffariLordo });
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="pb-20">
            <h1>Cassetto Fiscale {new Date().getFullYear()}</h1>

            {/* Segmented Control per passare da DB a Simulatore */}
            <div className="ios-select-group" style={{ marginBottom: "2rem" }}>
                <button
                    className={`ios-segment ${mod === "auto" ? "active" : ""}`}
                    onClick={() => setMod("auto")}
                >
                    📊 Bilancio Reale
                </button>
                <button
                    className={`ios-segment ${mod === "manual" ? "active" : ""}`}
                    onClick={() => setMod("manual")}
                >
                    🧮 Simulatore
                </button>
            </div>

            {mod === "auto" && (
                <>
                    {isLoadingDati ? (
                        <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>Calcolo bilanci in corso...</div>
                    ) : datiAnnuali.incassatoLordo === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.6 }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏛️</div>
                            Ancora nessuna fattura o incasso registrato nel {new Date().getFullYear()}. Le tasse appariranno qui automaticamente appena registrerai una causa!
                        </div>
                    ) : (
                        <div className="ios-card" style={{ animation: "slideUp 0.3s ease-out" }}>
                            <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Quadro Riassuntivo Annuo</h2>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                                <span style={{ opacity: 0.8 }}>Volume d'Affari Lordo</span>
                                <span style={{ fontWeight: "600", color: "var(--foreground)" }}>€{datiAnnuali.incassatoLordo.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                                <span>Fisco (IRPEF/Sostitutiva) da pagare</span>
                                <span style={{ fontWeight: "bold" }}>- €{datiAnnuali.tasseDaPagare.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                                <span>Cassa Forense stimata</span>
                                <span style={{ fontWeight: "bold" }}>- €{datiAnnuali.cassaDaPagare.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--primary)" }}>
                                <span>Spese / Costi affrontati</span>
                                <span style={{ fontWeight: "600" }}>- €{datiAnnuali.speseDeducibili.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", fontSize: "1.3rem" }}>
                                <strong>Netto in Tasca (Stimato)</strong>
                                <strong style={{ color: "var(--success)" }}>€{datiAnnuali.nettoTasche.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}
                </>
            )}

            {mod === "manual" && (
                <>
                    <p>Simula l'incasso di una fattura o del lordo per visualizzare il netto stimato ad personam.</p>
                    <div className="ios-card" style={{ animation: "slideUp 0.3s ease-out" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                            Incasso Lordo (€)
                        </label>
                        <input
                            type="number"
                            value={lordo}
                            onChange={(e) => setLordo(e.target.value)}
                            placeholder="Es: 1500"
                            className="ios-input"
                        />

                        <label style={{ display: "block", marginTop: "1rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                            Regime Fiscale del singolo compenso
                        </label>

                        <div className="ios-select-group" style={{ flexDirection: "column" }}>
                            <button
                                className={`ios-segment ${regime === 'forfettario_5' ? 'active' : ''}`}
                                onClick={() => setRegime('forfettario_5')}
                            >
                                Forfettario (5%)
                            </button>
                            <button
                                className={`ios-segment ${regime === 'forfettario_15' ? 'active' : ''}`}
                                onClick={() => setRegime('forfettario_15')}
                            >
                                Forfettario (15%)
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
                                Esente / Senza Tasse
                            </button>
                        </div>

                        <button className="ios-btn-large" onClick={calcolaManuale}>
                            Calcola Netto
                        </button>
                    </div>

                    {risultatoManuale && (
                        <div className="ios-card" style={{ marginTop: "1rem", background: "rgba(0,122,255,0.05)", borderColor: "var(--primary)" }}>
                            <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Risultato Simulato</h2>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                                <span>Volume d'Affari Lordo</span>
                                <span style={{ fontWeight: "600", color: "var(--foreground)" }}>€{risultatoManuale.volumeAffariLordo.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                                <span style={{ opacity: 0.8 }}>Compenso Base Inserito</span>
                                <span style={{ fontWeight: "600" }}>€{parseFloat(lordo).toFixed(2)}</span>
                            </div>

                            {regime !== 'free' && (
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                                    <span style={{ opacity: 0.8 }}>Imponibile Tassabile (Cassa Dedotta)</span>
                                    <span style={{ fontWeight: "600" }}>€{risultatoManuale.imponibile.toFixed(2)}</span>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                                <span>Tasse (IRPEF/Sostitutiva)</span>
                                <span style={{ fontWeight: "600" }}>- €{risultatoManuale.tasse.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                                <span>Cassa Forense</span>
                                <span style={{ fontWeight: "600" }}>- €{risultatoManuale.cassa.toFixed(2)}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", fontSize: "1.5rem" }}>
                                <strong>Netto Stimato</strong>
                                <strong style={{ color: "var(--success)" }}>€{risultatoManuale.netto.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}
                </>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
        </div>
    );
}
