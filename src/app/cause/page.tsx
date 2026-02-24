"use client";

import { useState, useEffect } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

// Inizializza Supabase Client (usiamo anon key per lato client protetto da RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function Cause() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { session } = useSession();
    const [showModal, setShowModal] = useState(false);

    const getSupabase = () => {
        return createClient(supabaseUrl, supabaseKey, {
            global: {
                fetch: async (url, options = {}) => {
                    const clerkToken = await session?.getToken({ template: 'supabase' });
                    const headers = new Headers(options?.headers);
                    if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`);
                    return fetch(url, { ...options, headers, cache: 'no-store' });
                },
            },
        });
    };
    const [causeList, setCauseList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Stato del form
    const [nuovaCausa, setNuovaCausa] = useState({
        nome: "",
        compenso: "",
        data: new Date().toISOString().split('T')[0],
        tipologia_fiscale: "forfettario_15"
    });

    useEffect(() => {
        if (isSignedIn && user) {
            loadCause();
        }
    }, [isSignedIn, user]);

    const loadCause = async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('cause')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Mappiamo i dati restituiti dal DB con le proprietà usate dal componente React
            const mappedData = (data || []).map(c => ({
                id: c.id,
                nome: c.nome_causa,
                compenso: c.compenso_lordo,
                data: c.data_sentenza,
                stato: c.stato
            }));
            setCauseList(mappedData);
        } catch (error) {
            console.error('Errore nel caricamento pratiche:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAggiungiCausa = async () => {
        if (!nuovaCausa.nome || !nuovaCausa.compenso || !nuovaCausa.data) {
            alert("Compila tutti i campi obbligatori");
            return;
        }

        setIsSaving(true);
        try {
            const compensoFloat = parseFloat(String(nuovaCausa.compenso).replace(',', '.'));

            // Payload allineato ESATTAMENTE alle colonne generate nello script SQL iniziale 
            const dataToInsert = {
                user_id: user?.id,
                nome_causa: nuovaCausa.nome,
                compenso_lordo: compensoFloat,
                data_sentenza: nuovaCausa.data,
                tipologia_fiscale: nuovaCausa.tipologia_fiscale,
                stato: "incassata"
            };

            const supabase = getSupabase();
            const { error } = await supabase
                .from('cause')
                .insert([dataToInsert]);

            if (error) throw error;

            setShowModal(false);
            setNuovaCausa({
                nome: "",
                compenso: "",
                data: new Date().toISOString().split('T')[0],
                tipologia_fiscale: "forfettario_15"
            });
            await loadCause();

        } catch (error: any) {
            console.error('Errore nel salvataggio:', error);
            alert("Errore salva file: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCausa = async (id: string, e: React.MouseEvent) => {
        // Previene l'apertura eventuale della causa se la riga intera fosse cliccabile
        e.stopPropagation();

        const confirmed = window.confirm("Sei sicuro di voler eliminare definitivamente questa registrazione?");
        if (!confirmed) return;

        setIsSaving(true);
        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('cause')
                .delete()
                .eq('id', id)
                .eq('user_id', user?.id);

            if (error) throw error;

            // Ricarica la lista per mostrare la riga rimossa
            await loadCause();
        } catch (error: any) {
            console.error('Errore nella cancellazione:', error);
            alert("Impossibile eliminare: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="pb-20 relative min-h-screen">
            <div className="flex-row-between" style={{ marginBottom: "1rem" }}>
                <h1>Gestore Cause</h1>
                <button
                    className="ios-btn-small"
                    onClick={() => setShowModal(true)}
                    style={{ padding: "8px 12px", fontSize: "1.2rem", borderRadius: "50%", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                    +
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>Caricamento archivio...</div>
            ) : causeList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚖️</div>
                    Nessun compenso registrato. Premi il "+" in alto a destra per registrare la tua prima parcella o liquidazione.
                </div>
            ) : (
                causeList.map((causa) => (
                    <div key={causa.id} className="ios-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ marginBottom: "4px" }}>{causa.nome}</h3>
                            <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>{causa.data}</span>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ fontSize: "1.1rem", fontWeight: "600", color: causa.stato === "incassata" ? "var(--success)" : "var(--foreground)" }}>
                                    €{causa.compenso}
                                </div>
                                <button
                                    onClick={(e) => handleDeleteCausa(causa.id, e)}
                                    style={{ background: "none", border: "none", color: "var(--destructive)", fontSize: "1.2rem", cursor: "pointer", padding: "5px" }}
                                    title="Elimina"
                                >
                                    🗑️
                                </button>
                            </div>
                            <span style={{
                                fontSize: "0.75rem",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                background: causa.stato === "incassata" ? "rgba(52,199,89,0.1)" : "rgba(0,122,255,0.1)",
                                color: causa.stato === "incassata" ? "var(--success)" : "var(--primary)",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                marginTop: "5px"
                            }}>
                                {causa.stato || "Registrata"}
                            </span>
                        </div>
                    </div>
                ))
            )}

            {/* Spazio Vuoto */}
            <div style={{ height: "60px" }}></div>

            {/* Bottom Sheet Modale Nuova Causa */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", zIndex: 100,
                    display: "flex", flexDirection: "column", justifyContent: "flex-end"
                }}>
                    <div style={{
                        background: "var(--background)",
                        padding: "1.5rem",
                        borderTopLeftRadius: "20px",
                        borderTopRightRadius: "20px",
                        animation: "slideUp 0.3s ease-out",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <button style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "1.1rem", cursor: "pointer" }} onClick={() => setShowModal(false)}>Annulla</button>
                            <h3 style={{ margin: 0 }}>Nuova Entrata</h3>
                            <button style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "600", fontSize: "1.1rem", cursor: "pointer" }} onClick={handleAggiungiCausa}>Salva</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Nome Causa / Cliente / Fattura"
                            className="ios-input"
                            value={nuovaCausa.nome}
                            onChange={(e) => setNuovaCausa({ ...nuovaCausa, nome: e.target.value })}
                        />
                        <input
                            type="date"
                            className="ios-input"
                            value={nuovaCausa.data}
                            onChange={(e) => setNuovaCausa({ ...nuovaCausa, data: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Importo Netto da Ricevere (€)"
                            className="ios-input"
                            value={nuovaCausa.compenso}
                            onChange={(e) => setNuovaCausa({ ...nuovaCausa, compenso: e.target.value })}
                        />

                        <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>Tipologia Fiscale</label>
                        <select
                            className="ios-input"
                            style={{ appearance: "none" }}
                            value={nuovaCausa.tipologia_fiscale}
                            onChange={(e) => setNuovaCausa({ ...nuovaCausa, tipologia_fiscale: e.target.value })}
                        >
                            <option value="forfettario_5">Forfettario 5% (Startup / Primi 5 anni)</option>
                            <option value="forfettario_15">Forfettario 15% (Standard)</option>
                            <option value="ordinario">Ordinario (IRPEF + IVA)</option>
                            <option value="free">🆓 Free / Senza Tasse (Vendita Privata, Rimborso)</option>
                        </select>

                        <button
                            className="ios-btn-large"
                            style={{ marginTop: "1rem" }}
                            onClick={handleAggiungiCausa}
                            disabled={isSaving}
                        >
                            {isSaving ? "Salvataggio in corso..." : "Aggiungi Entrata"}
                        </button>
                    </div>
                </div>
            )}

            {/* Animazione inline per il modale */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
        </div>
    );
}
