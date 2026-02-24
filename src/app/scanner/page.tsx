"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function ScannerScontrini() {
    const { isLoaded, isSignedIn } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<{
        importo: number;
        categoria: string;
        testoEstratto: string;
    } | null>(null);

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

        // Converti l'immagine in base64
        const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });

        try {
            // Chiamata all'API Python Serverless che creeremo nell'Azione 4
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data })
            });

            const data = await response.json();

            if (response.ok) {
                setScannedData(data);
            } else {
                alert("Errore nella scansione: " + data.error);
            }
        } catch (err) {
            // Fallback Mock se l'API non è ancora pronta
            setTimeout(() => {
                setScannedData({
                    importo: 45.20,
                    categoria: "Salute",
                    testoEstratto: "Farmacia Rossi\nParacetamolo €6.50\nSciroppo €8.50\nVisita €30.20"
                });
            }, 2000);
        } finally {
            setIsScanning(false);
        }
    };

    const [mode, setMode] = useState<"scanner" | "manuale">("scanner");

    // Renderizza il modale in cima se richiamato da un'altra pagina, ma qui lo mettiamo standalone per semplicità
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

                            <button className="ios-btn-large" style={{ background: "var(--success)" }}>
                                Conferma e Salva in {scannedData.categoria}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="ios-card" style={{ animation: "fadeIn 0.3s" }}>
                    <h3 style={{ marginBottom: "1rem" }}>Inserimento Manuale</h3>

                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>Importo (€)</label>
                    <input type="number" placeholder="Es. 45.50" className="ios-input" step="0.01" />

                    <label style={{ display: "block", marginBottom: "0.5rem", marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>Categoria di Spesa</label>
                    <select className="ios-input" style={{ appearance: "none" }}>
                        <option value="Alimenti">🛒 Alimenti</option>
                        <option value="Salute">💊 Salute</option>
                        <option value="Lavoro">💼 Lavoro</option>
                        <option value="Viaggi">✈️ Viaggi</option>
                        <option value="Tasse">🏦 Tasse</option>
                        <option value="Imprevisti">⚠️ Imprevisti</option>
                    </select>

                    <label style={{ display: "block", marginBottom: "0.5rem", marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>Descrizione (Opzionale)</label>
                    <input type="text" placeholder="Es. Cena di lavoro ristorante" className="ios-input" />

                    <button className="ios-btn-large" style={{ marginTop: "1.5rem" }}>
                        Aggiungi Spesa
                    </button>
                </div>
            )}
        </div>
    );
}
