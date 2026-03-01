"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ScannerScontrini() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { session } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseImporto = (val: string | number) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        // Se l'utente scrive 1.500,50 rimuove i punti e la virgola diventa punto
        let cleaned = val.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

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

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<{
        importo: number;
        categoria: string;
        testoEstratto: string;
    } | null>(null);

    // Stato form manuale
    const [spesaManuale, setSpesaManuale] = useState({ importo: "", categoria: "Altro", descrizione: "" });
    const [isSaving, setIsSaving] = useState(false);

    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
            setScannedData(null);
        }
    };

    const scansionaImmagine = async () => {
        if (!file) return;
        setIsScanning(true);

        const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.onload = () => {
                    let MAX_DIM = 1000;
                    let quality = 0.7;
                    let dataUrl = "";
                    let pass = 0;

                    do {
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_DIM) {
                                height = Math.round((height * MAX_DIM) / width);
                                width = MAX_DIM;
                            }
                        } else {
                            if (height > MAX_DIM) {
                                width = Math.round((width * MAX_DIM) / height);
                                height = MAX_DIM;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');

                        if (ctx) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, width, height);
                            ctx.drawImage(img, 0, 0, width, height);
                        }

                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                        MAX_DIM -= 200;
                        quality -= 0.15;
                        pass++;

                    } while (dataUrl.length > 1300000 && pass < 5);

                    resolve(dataUrl);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });

        try {
            // Utilizzo di Tesseract OCR locale via client-browser (no api payload a pagamento)
            const Tesseract = await import('tesseract.js');
            const result = await Tesseract.recognize(base64Data, 'ita', {
                logger: m => console.log(m)
            });

            const text = result.data.text;
            const testoLows = text.toLowerCase();

            // Estrazione Importo
            let importoEstratto = 0;
            const regexTotale = /(?:totale|importo|pagato|eur|euro|€)\s*[:.-]?\s*(\d{1,4}[.,]\d{2})/ig;
            let match;
            let massimi = [];

            while ((match = regexTotale.exec(testoLows)) !== null) {
                const pulito = match[1].replace(',', '.');
                const num = parseFloat(pulito);
                if (!isNaN(num)) massimi.push(num);
            }

            if (massimi.length > 0) {
                importoEstratto = Math.max(...massimi);
            } else {
                const regexNumeriValuta = /(\d{1,4}[.,]\d{2})/g;
                const matchesArr = Array.from(testoLows.matchAll(regexNumeriValuta)) as RegExpMatchArray[];
                if (matchesArr.length > 0) {
                    const ultimoElemento = matchesArr[matchesArr.length - 1];
                    if (ultimoElemento && ultimoElemento[1]) {
                        const lastMatch = ultimoElemento[1].replace(',', '.');
                        importoEstratto = parseFloat(lastMatch);
                    }
                }
            }

            // Categorizzazione
            let categoriaSuggerita = "Altro";
            if (testoLows.match(/ristorant|pizzer|trattoria|bar |osteria|caff/)) categoriaSuggerita = "Ristoranti";
            else if (testoLows.match(/farmacia|medic|visita|sanit|dott.ssa|dott./)) categoriaSuggerita = "Salute";
            else if (testoLows.match(/carburant|benzi|eni|q8|agip|tamoil|ip |diesel|verde|gasolio/)) categoriaSuggerita = "Carburante";
            else if (testoLows.match(/conad|coop|esselunga|pam|lidl|eurospin|despar|supermercat/)) categoriaSuggerita = "Alimenti";
            else if (testoLows.match(/treno|italo|trenitalia|taxi|bus|metropolitana/)) categoriaSuggerita = "Auto/Trasporti";
            else if (testoLows.match(/cartoleria|buffetti|carta|penna/)) categoriaSuggerita = "Cancelleria";
            else if (testoLows.match(/amazon|software|abbonament/)) categoriaSuggerita = "Software";

            setScannedData({
                importo: importoEstratto,
                categoria: categoriaSuggerita,
                testoEstratto: text.substring(0, 300) + (text.length > 300 ? "..." : "")
            });

        } catch (err) {
            console.error(err);
            alert("Errore nella scansione locale con Tesseract: " + (err as Error).message);
        } finally {
            setIsScanning(false);
        }
    };

    const salvaSpesaManuale = async () => {
        if (!spesaManuale.importo) {
            alert("Inserisci l'importo della spesa."); return;
        }

        setIsSaving(true);
        try {
            const supabase = getSupabase();
            const now = new Date();
            const data_transazione = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const importoCorretto = parseImporto(spesaManuale.importo);
            const regimeGenerale = localStorage.getItem("regime_fiscale_generale");
            let percentualeDeducibilita = 0;
            if (regimeGenerale === "ordinario") {
                const { getDeductibilityPercentage } = await import('@/lib/deductibility');
                percentualeDeducibilita = getDeductibilityPercentage(spesaManuale.categoria);
            }
            const importoDeducibile = importoCorretto * percentualeDeducibilita;

            const { error } = await supabase.from('transazioni').insert({
                user_id: user?.id,
                tipo: 'uscita',
                importo: importoCorretto,
                categoria: spesaManuale.categoria,
                descrizione: spesaManuale.descrizione,
                data_transazione: data_transazione,
                percentuale_deducibilita: percentualeDeducibilita,
                importo_deducibile: importoDeducibile
            });

            if (error) throw error;

            const deducMsg = regimeGenerale === "ordinario" ? ` (Deducibile al ${percentualeDeducibilita * 100}%)` : ` (Nessuna deduzione in Forfettario)`;
            alert(`Spesa registrata!${deducMsg}`);
            setSpesaManuale({ importo: "", categoria: "Altro", descrizione: "" });
            router.refresh();
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            alert("Si è verificato un errore nel salvataggio. Controlla i permessi o le policy: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const salvaScanner = async () => {
        if (!scannedData) return;
        setIsSaving(true);
        try {
            const supabase = getSupabase();
            const now = new Date();
            const data_transazione = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const importoCorretto = parseImporto(scannedData.importo);
            const regimeGenerale = localStorage.getItem("regime_fiscale_generale");
            let percentualeDeducibilita = 0;
            if (regimeGenerale === "ordinario") {
                const { getDeductibilityPercentage } = await import('@/lib/deductibility');
                percentualeDeducibilita = getDeductibilityPercentage(scannedData.categoria);
            }
            const importoDeducibile = importoCorretto * percentualeDeducibilita;

            const { error } = await supabase.from('transazioni').insert({
                user_id: user?.id,
                tipo: 'uscita',
                importo: importoCorretto,
                categoria: scannedData.categoria,
                descrizione: "Auto-Scansione AI (Locale)",
                data_transazione: data_transazione,
                percentuale_deducibilita: percentualeDeducibilita,
                importo_deducibile: importoDeducibile
            });

            if (error) throw error;

            const deducMsg = regimeGenerale === "ordinario" ? ` (Deducibile al ${percentualeDeducibilita * 100}%)` : ` (Nessuna deduzione in Forfettario)`;
            alert(`Scontrino AI registrato!${deducMsg}`);
            setFile(null);
            setPreview(null);
            setScannedData(null);
            router.refresh();
            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            alert("Si è verificato un errore nel salvataggio scanner. " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const [mode, setMode] = useState<"scanner" | "manuale">("scanner");

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="pb-20">
            <h1>Aggiungi Spesa</h1>

            <div className="ios-select-group" style={{ marginBottom: "2rem" }}>
                <button
                    className={`ios-segment ${mode === 'scanner' ? 'active' : ''}`}
                    onClick={() => setMode('scanner')}
                >
                    📸 Scanner AI
                </button>
                <button
                    className={`ios-segment ${mode === 'manuale' ? 'active' : ''}`}
                    onClick={() => setMode('manuale')}
                >
                    ✍️ Manuale
                </button>
            </div>

            {mode === 'scanner' ? (
                <>
                    <p>Scatta una foto a scontrini o fatture di spesa. L'AI estrarrà l'importo e proporrà una categoria.</p>
                    <div className="ios-card" style={{ textAlign: "center" }}>
                        {preview ? (
                            <div style={{ marginBottom: "1.5rem" }}>
                                <img
                                    src={preview}
                                    alt="Anteprima Scontrino"
                                    style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "12px" }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: "200px",
                                    background: "var(--background)",
                                    borderRadius: "12px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginBottom: "1.5rem",
                                    border: "2px dashed var(--border)"
                                }}
                            >
                                <span style={{ fontSize: "3rem", opacity: 0.5 }}>📸</span>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Forza la fotocamera posteriore su iOS
                            ref={fileInputRef}
                            onChange={handleCapture}
                            style={{ display: "none" }}
                        />

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                className="ios-btn-small"
                                style={{ flex: 1, padding: "12px", background: "var(--foreground)", color: "var(--background)" }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {preview ? "Scatta di Nuovo" : "Apri Fotocamera"}
                            </button>

                            {preview && (
                                <button
                                    className="ios-btn-small"
                                    style={{ flex: 1, padding: "12px" }}
                                    onClick={scansionaImmagine}
                                    disabled={isScanning}
                                >
                                    {isScanning ? "Scansione..." : "Scansiona AI"}
                                </button>
                            )}
                        </div>
                    </div>

                    {scannedData && (
                        <div className="ios-card" style={{ marginTop: "1rem", animation: "slideUp 0.3s" }}>
                            <h3 style={{ marginBottom: "1rem" }}>Risultato Scansione</h3>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                <span style={{ opacity: 0.7 }}>Importo Estratto</span>
                                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--destructive)" }}>
                                    €{scannedData.importo.toFixed(2)}
                                </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <span style={{ opacity: 0.7 }}>Categoria Suggerita</span>
                                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)" }}>
                                    {scannedData.categoria}
                                </span>
                            </div>

                            <div style={{ background: "var(--background)", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", opacity: 0.8, maxHeight: "100px", overflowY: "auto", marginBottom: "1.5rem" }}>
                                {scannedData.testoEstratto}
                            </div>

                            <button className="ios-btn-large" style={{ background: "var(--success)" }} onClick={salvaScanner} disabled={isSaving}>
                                {isSaving ? "Salvataggio..." : `Conferma e Salva in ${scannedData.categoria}`}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="ios-card" style={{ animation: "fadeIn 0.3s" }}>
                    <h3 style={{ marginBottom: "1rem" }}>Inserimento Manuale</h3>

                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>Importo (€)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Es. 45.50"
                        className="ios-input"
                        value={spesaManuale.importo}
                        onChange={(e) => setSpesaManuale({ ...spesaManuale, importo: e.target.value })}
                    />

                    <label style={{ display: "block", marginBottom: "0.5rem", marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>Categoria di Spesa</label>
                    <select
                        className="ios-input"
                        style={{ appearance: "none" }}
                        value={spesaManuale.categoria}
                        onChange={(e) => setSpesaManuale({ ...spesaManuale, categoria: e.target.value })}
                    >
                        <option value="Alimenti">🛒 Alimenti</option>
                        <option value="Ristoranti">🍽️ Ristoranti</option>
                        <option value="Salute">💊 Salute</option>
                        <option value="Lavoro">💼 Lavoro</option>
                        <option value="Cancelleria">📎 Cancelleria</option>
                        <option value="Software">💻 Software</option>
                        <option value="Auto/Trasporti">🚗 Auto/Trasporti</option>
                        <option value="Carburante">⛽ Carburante</option>
                        <option value="Viaggi">✈️ Viaggi</option>
                        <option value="Tasse">🏦 Tasse</option>
                        <option value="Senza Tasse">🆓 Senza Tasse</option>
                        <option value="Utenze">💡 Utenze</option>
                        <option value="Formazione">📚 Formazione</option>
                        <option value="Abbigliamento">👔 Abbigliamento</option>
                        <option value="Imprevisti">⚠️ Imprevisti</option>
                        <option value="Altro">📦 Altro</option>
                    </select>

                    <label style={{ display: "block", marginBottom: "0.5rem", marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>Descrizione (Opzionale)</label>
                    <input
                        type="text"
                        placeholder="Es. Cena di lavoro ristorante"
                        className="ios-input"
                        value={spesaManuale.descrizione}
                        onChange={(e) => setSpesaManuale({ ...spesaManuale, descrizione: e.target.value })}
                    />

                    <button
                        className="ios-btn-large"
                        style={{ marginTop: "1.5rem" }}
                        onClick={salvaSpesaManuale}
                        disabled={isSaving}
                    >
                        {isSaving ? "Salvataggio..." : "Aggiungi Spesa"}
                    </button>
                </div>
            )}
        </div>
    );
}
