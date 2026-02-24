"use client";

import { useState } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<{ nome: string, totale: number, icona: string } | null>(null);

  // Dati (Inizialmente a zero, pronti per essere popolati via DB Supabase)
  const entrateMensili = 0;
  const usciteMensili = 0;
  const nettoMensile = entrateMensili - usciteMensili;
  const uscitePercentuale = entrateMensili > 0 ? (usciteMensili / entrateMensili) * 100 : 0;

  const emoticonInfo = uscitePercentuale > 40 ? "😢" : "😀";

  const dataMensile = {
    labels: ['Entrate Nette', 'Uscite'],
    datasets: [
      {
        data: [nettoMensile > 0 ? nettoMensile : 0.1, usciteMensili > 0 ? usciteMensili : 0.1], // 0.1 evita il grafico completamente rotto se vuoto
        backgroundColor: nettoMensile === 0 && usciteMensili === 0 ? ['#e5e5ea', '#e5e5ea'] : ['#34c759', '#ff3b30'],
        borderWidth: 0,
      },
    ],
  };

  const dataAnnuale = {
    labels: ['Entrate Nette', 'Uscite'],
    datasets: [
      {
        data: [0.1, 0.1], // Vuoto Iniziale
        backgroundColor: ['rgba(229, 229, 234, 0.8)', 'rgba(229, 229, 234, 0.8)'],
        borderWidth: 0,
      },
    ],
  };

  const categorieSpesa = [
    { nome: "Alimenti", totale: 0, icona: "🛒" },
    { nome: "Salute", totale: 0, icona: "💊" },
    { nome: "Lavoro", totale: 0, icona: "💼" },
    { nome: "Viaggi", totale: 0, icona: "✈️" },
    { nome: "Tasse", totale: 0, icona: "🏦" },
    { nome: "Imprevisti", totale: 0, icona: "⚠️" },
  ];

  if (!isLoaded || !isSignedIn) {
    return null; // O caricamento
  }

  return (
    <div className="pb-20">
      <div className="flex-row-between" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2>Ciao, {user?.firstName || 'Avvocato'}! {emoticonInfo}</h2>
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: "0.9rem", marginTop: "-10px" }}>Mese Corrente</p>
        </div>

        {/* Torta Annuale (Piccola in alto a dx - 4/7 della centrale) */}
        <div style={{ width: "80px", height: "80px" }}>
          <Pie data={dataAnnuale} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {/* Torta Mensile (Grande Centrale) */}
      <div className="ios-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h3>Bilancio Mensile</h3>

        <div className="chart-container-large" style={{ margin: "1rem 0" }}>
          <Pie
            data={dataMensile}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { position: "bottom", labels: { font: { size: 14 } } }
              }
            }}
          />
        </div>

        <div className="flex-row-between" style={{ width: "100%", marginTop: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Netto</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--success)" }}>€{nettoMensile}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Uscite</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--destructive)" }}>€{usciteMensili}</div>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Spese Settoriali</h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Totale Annuo</p>

      {/* Grid Card Stile Apple Wallet */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {categorieSpesa.map((cat, idx) => (
          <div
            key={idx}
            className="ios-card"
            style={{ padding: "1rem", marginBottom: "0", cursor: "pointer" }}
            onClick={() => setSelectedCategory(cat)}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cat.icona}</div>
            <div style={{ fontSize: "1rem", fontWeight: "600" }}>{cat.nome}</div>
            <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>€{cat.totale}</div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet Modale */}
      {selectedCategory && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <button className="bottom-sheet-close" onClick={() => setSelectedCategory(null)}>&times;</button>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{selectedCategory.icona}</div>
              <h2>Dettaglio {selectedCategory.nome}</h2>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>
                Totale: €{selectedCategory.totale}
              </p>

              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--background)", borderRadius: "12px", textAlign: "left" }}>
                <p style={{ opacity: 0.6, fontSize: "0.9rem", textAlign: "center" }}>
                  Nessuna transazione recente trovata in questa categoria. Le tue spese appariranno qui man mano che scansionerai gli scontrini.
                </p>
              </div>

              <button
                className="ios-btn-large"
                style={{ marginTop: "2rem" }}
                onClick={() => setSelectedCategory(null)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
