"use client";

import { useState } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();

  // Dati Mockati (poi verranno presi da DB)
  const entrateMensili = 4500;
  const usciteMensili = 1200;
  const nettoMensile = entrateMensili - usciteMensili;
  const uscitePercentuale = (usciteMensili / entrateMensili) * 100;

  const emoticonInfo = uscitePercentuale > 40 ? "😢" : "😀";

  const dataMensile = {
    labels: ['Entrate Nette', 'Uscite'],
    datasets: [
      {
        data: [nettoMensile, usciteMensili],
        backgroundColor: ['#34c759', '#ff3b30'],
        borderWidth: 0,
      },
    ],
  };

  const dataAnnuale = {
    labels: ['Entrate Nette', 'Uscite'],
    datasets: [
      {
        data: [35000, 12000], // Mock Annuale
        backgroundColor: ['rgba(52, 199, 89, 0.8)', 'rgba(255, 59, 48, 0.8)'],
        borderWidth: 0,
      },
    ],
  };

  const categorieSpesa = [
    { nome: "Alimenti", totale: 2400, icona: "🛒" },
    { nome: "Salute", totale: 550, icona: "💊" },
    { nome: "Lavoro", totale: 1200, icona: "💼" },
    { nome: "Viaggi", totale: 800, icona: "✈️" },
    { nome: "Tasse", totale: 4000, icona: "🏦" },
    { nome: "Imprevisti", totale: 300, icona: "⚠️" },
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
          <div key={idx} className="ios-card" style={{ padding: "1rem", marginBottom: "0", cursor: "pointer" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cat.icona}</div>
            <div style={{ fontSize: "1rem", fontWeight: "600" }}>{cat.nome}</div>
            <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>€{cat.totale}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
