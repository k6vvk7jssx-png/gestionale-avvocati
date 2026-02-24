"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function Cause() {
    const { isLoaded, isSignedIn } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [nuovaCausa, setNuovaCausa] = useState({ nome: "", compenso: "", data: "" });

    const causeList: any[] = []; // Partiamo da un elenco vuoto, si popolerà da DB

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

            {causeList.map((causa) => (
                <div key={causa.id} className="ios-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div>
                        <h3 style={{ marginBottom: "4px" }}>{causa.nome}</h3>
                        <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>{causa.data}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "600", color: causa.stato === "incassata" ? "var(--success)" : "var(--foreground)" }}>
                            €{causa.compenso}
                        </div>
                        <span style={{
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            background: causa.stato === "vinta" ? "rgba(52,199,89,0.1)" : "rgba(0,122,255,0.1)",
                            color: causa.stato === "vinta" ? "var(--success)" : "var(--primary)",
                            textTransform: "uppercase",
                            fontWeight: "600"
                        }}>
                            {causa.stato}
                        </span>
                    </div>
                </div>
            ))}

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
                        animation: "slideUp 0.3s ease-out"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <button style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "1.1rem", cursor: "pointer" }} onClick={() => setShowModal(false)}>Annulla</button>
                            <h3 style={{ margin: 0 }}>Nuova Causa</h3>
                            <button style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "600", fontSize: "1.1rem", cursor: "pointer" }}>Salva</button>
                        </div>

                        <input type="text" placeholder="Nome Causa / Cliente" className="ios-input" />
                        <input type="date" className="ios-input" />
                        <input type="number" placeholder="Compenso Lordo Previsto (€)" className="ios-input" />

                        <button className="ios-btn-large" style={{ marginTop: "1rem" }} onClick={() => setShowModal(false)}>
                            Aggiungi
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
