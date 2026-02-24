"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function Tasse() {
    const { isLoaded, isSignedIn } = useUser();
    const [lordo, setLordo] = useState<string>("");
    const [regime, setRegime] = useState<"forfettario_5" | "forfettario_15" | "ordinario">("forfettario_5");

    // Risultati Calcolo
    const [risultato, setRisultato] = useState<{
        imponibile: number;
        tasse: number;
        cassa: number;
        netto: number;
    } | null>(null);

    const calcolaTasse = () => {
        const importoLordo = parseFloat(lordo.replace(",", "."));
        if (isNaN(importoLordo) || importoLordo <= 0) return;

        let imponibile = 0, tasse = 0, cassa = 0, netto = 0;

        if (regime === "forfettario_5" || regime === "forfettario_15") {
            // Forfettario Avvocati: Imponibile al 78% del Lordo
            imponibile = importoLordo * 0.78;

            const aliquotaTasse = regime === "forfettario_5" ? 0.05 : 0.15;
            tasse = imponibile * aliquotaTasse;

            // Cassa Forense (assumiamo 17% sull'imponibile per semplificazione algoritmica, 
            // anche se storicamente varia tra 15-17%. Qui usiamo il vincolo imposto: 17%)
            cassa = imponibile * 0.17;

            netto = importoLordo - tasse - cassa;
        } else {
            // Ordinario: Trattenuta forfettaria generica del 46% (per specifiche vincolanti)
            const trattenuta = importoLordo * 0.46;
            tasse = trattenuta * 0.6; // Stima di divisione tra tasse/cassa
            cassa = trattenuta * 0.4;
            imponibile = importoLordo;
            netto = importoLordo - trattenuta;
        }

        setRisultato({ imponibile, tasse, cassa, netto });
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="pb-20">
            <h1>Calcolatore Tasse</h1>
            <p>Simula l'incasso di una fattura o del lordo per visualizzare il netto stimato.</p>

            <div className="ios-card">
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
                    Regime Fiscale
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
                </div>

                <button className="ios-btn-large" onClick={calcolaTasse}>
                    Calcola Netto
                </button>
            </div>

            {risultato && (
                <div className="ios-card" style={{ marginTop: "1rem", background: "rgba(0,122,255,0.05)", borderColor: "var(--primary)" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Risultato</h2>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                        <span>Lordo Inserito</span>
                        <span style={{ fontWeight: "600" }}>€{parseFloat(lordo).toFixed(2)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                        <span>Imponibile Tassabile</span>
                        <span style={{ fontWeight: "600" }}>€{risultato.imponibile.toFixed(2)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                        <span>Tasse (IRPEF/Sostitutiva)</span>
                        <span style={{ fontWeight: "600" }}>- €{risultato.tasse.toFixed(2)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", color: "var(--destructive)" }}>
                        <span>Cassa Forense</span>
                        <span style={{ fontWeight: "600" }}>- €{risultato.cassa.toFixed(2)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", fontSize: "1.5rem" }}>
                        <strong>Netto Stimato</strong>
                        <strong style={{ color: "var(--success)" }}>€{risultato.netto.toFixed(2)}</strong>
                    </div>

                    <button className="ios-btn-large" style={{ marginTop: "2rem", background: "var(--success)" }}>
                        Salva a Bilancio
                    </button>
                </div>
            )}
        </div>
    );
}
