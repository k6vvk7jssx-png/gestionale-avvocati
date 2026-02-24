"use client";

import { useState, useEffect } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

ChartJS.register(ArcElement, Tooltip, Legend);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definisco le categorie fuori dal componente per non ricrearle
const categorieIniziali = [
  { nome: "Alimenti", totale: 0, icona: "🛒" },
  { nome: "Ristoranti", totale: 0, icona: "🍽️" },
  { nome: "Salute", totale: 0, icona: "💊" },
  { nome: "Lavoro", totale: 0, icona: "💼" },
  { nome: "Cancelleria", totale: 0, icona: "📎" },
  { nome: "Software", totale: 0, icona: "💻" },
  { nome: "Auto/Trasporti", totale: 0, icona: "🚗" },
  { nome: "Carburante", totale: 0, icona: "⛽" },
  { nome: "Viaggi", totale: 0, icona: "✈️" },
  { nome: "Tasse", totale: 0, icona: "🏦" },
  { nome: "Senza Tasse", totale: 0, icona: "🆓" },
  { nome: "Utenze", totale: 0, icona: "💡" },
  { nome: "Formazione", totale: 0, icona: "📚" },
  { nome: "Abbigliamento", totale: 0, icona: "👔" },
  { nome: "Imprevisti", totale: 0, icona: "⚠️" },
  { nome: "Altro", totale: 0, icona: "📦" },
];

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<{ nome: string, totale: number, icona: string } | null>(null);

  // Dati Dinamici
  const [entrateMensili, setEntrateMensili] = useState(0);
  const [usciteMensili, setUsciteMensili] = useState(0);
  const [tasseMensiliAccantonate, setTasseMensiliAccantonate] = useState(0);
  const [categorieSpesa, setCategorieSpesa] = useState(categorieIniziali);

  useEffect(() => {
    if (isSignedIn && user) {
      caricaDatiMensili();
    }
  }, [isSignedIn, user]);

  const caricaDatiMensili = async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    // Lte a now per sicurezza

    try {
      // 1. Carica le Cause
      const { data: cause } = await supabase
        .from('cause')
        .select('compenso, tipologia_fiscale')
        .eq('user_id', user?.id)
        .gte('data', startOfMonth.split('T')[0]);

      let totEntrate = 0;
      let totTasseAccantonate = 0;

      if (cause) {
        cause.forEach(c => {
          const importo = Number(c.compenso);
          totEntrate += importo;

          // Calcolo rapido per mostrare quante tasse virtuali si stanno generando questo mese
          if (c.tipologia_fiscale === "forfettario_5") {
            totTasseAccantonate += (importo * 0.78 * 0.05) + (importo * 0.78 * 0.17); // Irpef + Cassa
          } else if (c.tipologia_fiscale === "forfettario_15") {
            totTasseAccantonate += (importo * 0.78 * 0.15) + (importo * 0.78 * 0.17);
          } else if (c.tipologia_fiscale === "ordinario") {
            totTasseAccantonate += importo * 0.46; // Trattenuta media fissa usata nel tool
          }
        });
      }

      // 2. Carica le Uscite (Transazioni)
      const { data: uscite } = await supabase
        .from('transazioni')
        .select('importo, categoria')
        .eq('user_id', user?.id)
        .eq('tipo', 'uscita')
        .gte('data', startOfMonth);

      let totUscite = 0;
      const nuoveCategorie = categorieIniziali.map(c => ({ ...c, totale: 0 })); // Reset

      if (uscite) {
        uscite.forEach(u => {
          totUscite += Number(u.importo);
          const catIndex = nuoveCategorie.findIndex(c => c.nome === u.categoria);
          if (catIndex !== -1) {
            nuoveCategorie[catIndex].totale += Number(u.importo);
          } else {
            nuoveCategorie[nuoveCategorie.length - 1].totale += Number(u.importo); // 'Altro'
          }
        });
      }

      setEntrateMensili(totEntrate);
      setTasseMensiliAccantonate(totTasseAccantonate);
      setUsciteMensili(totUscite);
      setCategorieSpesa(nuoveCategorie);

    } catch (error) {
      console.error("Errore recupero dashboard:", error);
    }
  };

  const nettoMensile = entrateMensili - usciteMensili - tasseMensiliAccantonate;
  const nettoPuro = nettoMensile > 0 ? nettoMensile : 0.1;

  // Percentuale allarme su Uscite rispetto alle Entrate (ma escludendo le tasse fisse dal calcolo di "sto spendendo troppo")
  const entrateVerificabili = entrateMensili > 0 ? entrateMensili : 1;
  const uscitePercentuale = (usciteMensili / entrateVerificabili) * 100;
  const emoticonInfo = uscitePercentuale > 40 ? "😢" : "😀";

  const dataMensile = {
    labels: ['Netto Pulito', 'Spese', 'Tasse Accantonate'],
    datasets: [
      {
        data: [nettoPuro, usciteMensili > 0 ? usciteMensili : 0.1, tasseMensiliAccantonate > 0 ? tasseMensiliAccantonate : 0.1],
        backgroundColor: (nettoPuro === 0.1 && usciteMensili === 0 && tasseMensiliAccantonate === 0)
          ? ['#e5e5ea', '#e5e5ea', '#e5e5ea']
          : ['#34c759', '#ff3b30', '#ff9f0a'],
        borderWidth: 0,
      },
    ],
  };

  // La torta annuale per ora la lasciamo vuota/placeholder fino al prossimo upgrade
  const dataAnnuale = {
    labels: ['Entrate Nette', 'Uscite'],
    datasets: [
      {
        data: [0.1, 0.1],
        backgroundColor: ['rgba(229, 229, 234, 0.8)', 'rgba(229, 229, 234, 0.8)'],
        borderWidth: 0,
      },
    ],
  };

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

        {/* Torta Annuale (Piccola in alto a dx - La manteniamo fissa come design target per ora) */}
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

        <div className="flex-row-between" style={{ width: "100%", marginTop: "1rem", flexWrap: "wrap", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>In Tasca</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--success)" }}>€{nettoMensile.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Lordo Inc.</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--foreground)" }}>€{entrateMensili.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Spese Voc.</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--destructive)" }}>€{usciteMensili.toFixed(2)}</div>
          </div>
        </div>
        <div style={{ width: "100%", textAlign: "center", marginTop: "0.5rem", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", opacity: 0.7, marginRight: "10px" }}>Fondo Tasse Virt.:</span>
          <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#ff9f0a" }}>€{tasseMensiliAccantonate.toFixed(2)}</span>
        </div>
      </div>

      <h2 style={{ marginTop: "2rem" }}>Spese Settoriali Mensili</h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Dal 1° del Mese</p>

      {/* Grid Card Stile Apple Wallet */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {categorieSpesa.filter(cat => cat.totale > 0).length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", opacity: 0.5, padding: "2rem" }}>
            Nessuna spesa registrata per questo mese.
          </div>
        ) : (
          categorieSpesa.filter(cat => cat.totale > 0).map((cat, idx) => (
            <div
              key={idx}
              className="ios-card"
              style={{ padding: "1rem", marginBottom: "0", cursor: "pointer" }}
              onClick={() => setSelectedCategory(cat)}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cat.icona}</div>
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>{cat.nome}</div>
              <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>€{cat.totale.toFixed(2)}</div>
            </div>
          ))
        )}
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
                Totale Mese: €{selectedCategory.totale.toFixed(2)}
              </p>

              <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--background)", borderRadius: "12px", textAlign: "left" }}>
                <p style={{ opacity: 0.6, fontSize: "0.9rem", textAlign: "center" }}>
                  Al momento non è possibile esplodere le singole transazioni da questa scorciatoia rapida. Verificabile solo il totale aggregato parziale.
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
