"use client";

import { useState, useEffect, useCallback } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

ChartJS.register(ArcElement, Tooltip, Legend);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  const { session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<{ nome: string, totale: number, icona: string } | null>(null);

  const getSupabase = useCallback(() => {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: async (url, options = {}) => {
          let clerkToken;
          try {
            clerkToken = await session?.getToken({ template: 'supabase' });
          } catch {
            console.warn("Nessun template 'supabase' trovato in Clerk, uso token default");
            clerkToken = await session?.getToken(); // Fallback
          }
          const headers = new Headers(options?.headers);
          if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`);
          return fetch(url, { ...options, headers, cache: 'no-store' });
        },
      },
    });
  }, [session]);

  // Dati Dinamici
  const [entrateMensili, setEntrateMensili] = useState(0);
  const [usciteMensili, setUsciteMensili] = useState(0);
  const [tasseMensiliAccantonate, setTasseMensiliAccantonate] = useState(0);
  const [categorieSpesa, setCategorieSpesa] = useState(categorieIniziali);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transazioniMese, setTransazioniMese] = useState<any[]>([]);
  const [limiteRistorantiInfo, setLimiteRistorantiInfo] = useState<{ limite: number; speso: number; percentuale: number; superato: boolean } | null>(null);
  const [regimeCorrente, setRegimeCorrente] = useState<string | null>(null);

  const [sogliaFaccina, setSogliaFaccina] = useState(40);
  const [showGuida, setShowGuida] = useState(false);

  // Rimosso useEffect anticipato

  const caricaDatiMensili = useCallback(async () => {
    const today = new Date();
    const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    try {
      const supabase = getSupabase();

      // 0. Carica Profilo Utente (Regime, Faccina, Irpef)
      const { data: profile, error: errProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      let currentScaglione = 23;
      if (profile && !errProfile) {
        if (profile.sad_face_threshold) setSogliaFaccina(profile.sad_face_threshold);
        if (profile.expected_irpef_bracket) {
          currentScaglione = parseInt(profile.expected_irpef_bracket);
        }
      }

      // 1. Carica le Cause
      const { data: cause, error: errCause } = await supabase
        .from('cause')
        .select('*')
        .eq('user_id', user?.id)
        .gte('data_sentenza', startOfMonth);

      if (errCause) {
        console.error("Errore fetch cause mensili: ", errCause.message);
      }

      let totEntrate = 0;
      let totTasseAccantonate = 0;

      if (cause) {
        cause.forEach(c => {
          const importo = Number(c.compenso_lordo || 0);
          totEntrate += importo;
        });
      }

      // 2. Carica le Uscite (Transazioni)
      const { data: uscite, error: errUscite } = await supabase
        .from('transazioni')
        .select('id, importo, categoria, descrizione, data_transazione, created_at, importo_deducibile')
        .eq('user_id', user?.id)
        .eq('tipo', 'uscita')
        .gte('data_transazione', startOfMonth)
        .order('created_at', { ascending: false });

      if (errUscite) {
        console.error("Errore fetch uscite mensili: ", errUscite.message);
        alert("Errore nel caricamento spese: " + errUscite.message);
      }

      let totUsciteLorde = 0;
      let totUsciteDeducibili = 0;
      const nuoveCategorie = categorieIniziali.map(c => ({ ...c, totale: 0 })); // Reset

      if (uscite) {
        setTransazioniMese(uscite);
        uscite.forEach(u => {
          const importoNumerico = Number(u.importo);
          totUsciteLorde += importoNumerico;
          // Usa importo_deducibile se presente (post-aggiornamento), altrimenti usa il lordo
          totUsciteDeducibili += Number(u.importo_deducibile ?? importoNumerico);

          const catIndex = nuoveCategorie.findIndex(c => c.nome === u.categoria);
          if (catIndex !== -1) {
            nuoveCategorie[catIndex].totale += importoNumerico;
          } else {
            nuoveCategorie[nuoveCategorie.length - 1].totale += importoNumerico; // 'Altro'
          }
        });
      }

      // 3. Calcolo Finanziario Combinato (Entrate e Tasse)
      totTasseAccantonate = 0;
      if (cause) {
        cause.forEach(c => {
          const tipoFiscale = c.tipologia_fiscale || "forfettario_15";

          if (tipoFiscale === "forfettario_5" || tipoFiscale === "forfettario_15") {
            // Modello FORFETTARIO
            const compensoPuro = Number(c.compenso_base || c.compenso_lordo || 0);
            const speseGenerali = compensoPuro * 0.15;
            const redditoImponibileLordo = (compensoPuro + speseGenerali) * 0.78;

            const secchio1_cpa = c.cpa_4 ? Number(c.cpa_4) : (compensoPuro + speseGenerali) * 0.04;
            const secchio2_cassa = redditoImponibileLordo * 0.17;
            const aliquotaFisco = tipoFiscale === "forfettario_5" ? 0.05 : 0.15;
            const secchio3_imposta = redditoImponibileLordo * aliquotaFisco;

            totTasseAccantonate += (secchio1_cpa + secchio2_cassa + secchio3_imposta);

          } else if (tipoFiscale === "ordinario") {
            // Modello ORDINARIO
            const compensoPuro = Number(c.compenso_base || c.compenso_lordo || 0);
            const speseGenerali = compensoPuro * 0.15;

            // EPICA 3: Sottraggo le uscite deducibili dall'Imponibile Cassa per calcolare l' Utile Lordo reale
            const utileLordo = Math.max(0, (compensoPuro + speseGenerali) - totUsciteDeducibili);

            const secchio1_cpa = c.cpa_4 ? Number(c.cpa_4) : (compensoPuro + speseGenerali) * 0.04;
            const secchio2_iva = c.iva_22 ? Number(c.iva_22) : 0;
            const secchio3_cassa = utileLordo * 0.17;

            const percentualeIrpef = currentScaglione / 100.0;
            const baseIrpef = Math.max(0, utileLordo - secchio3_cassa);
            const secchio4_irpef = baseIrpef * percentualeIrpef;
            const secchio5_addizionali = baseIrpef * 0.03; // ~3%

            const scontoRitenuta = c.ritenuta_20 ? Number(c.ritenuta_20) : 0;

            totTasseAccantonate += (secchio1_cpa + secchio2_iva + secchio3_cassa + secchio4_irpef + secchio5_addizionali - scontoRitenuta);

            totUsciteDeducibili = 0; // Evita di ri-sottrarre le stesse spese per le successive fatture dello stesso mese

          } else if (tipoFiscale === "free") {
            totTasseAccantonate += 0;
          }
        });
      }

      // Applica un safety cap
      if (totTasseAccantonate < 0) totTasseAccantonate = 0;

      // EPICA 4: Calcolo YTD (Year-To-Date) per Limite 2% Ristoranti/Trasferte solo per Ordinario
      let isRegimeOrdinario = false;
      if (profile && profile.regime_fiscale === "ordinario") isRegimeOrdinario = true;
      else if (localStorage.getItem("regime_fiscale_generale") === "ordinario") isRegimeOrdinario = true;

      setRegimeCorrente(isRegimeOrdinario ? "ordinario" : "forfettario");

      if (isRegimeOrdinario) {
        const startOfYear = `${today.getFullYear()}-01-01`;
        const { data: allCause } = await supabase.from('cause').select('compenso_base, compenso_lordo').eq('user_id', user?.id).gte('data_sentenza', startOfYear);
        let ytdCompensi = 0;
        if (allCause) {
          allCause.forEach(c => ytdCompensi += Number(c.compenso_base || c.compenso_lordo || 0));
        }

        const { data: allUscite } = await supabase.from('transazioni').select('importo, categoria').eq('user_id', user?.id).eq('tipo', 'uscita').gte('data_transazione', startOfYear);
        let ytdRistoranti = 0;
        if (allUscite) {
          allUscite.forEach(u => {
            if (u.categoria === "Ristoranti" || u.categoria === "Ristoranti / Trasferte" || u.categoria?.toLowerCase().includes("ristorant")) {
              ytdRistoranti += Number(u.importo);
            }
          });
        }

        // La legge dice il 2% del totale compensi percepiti
        const limite = ytdCompensi * 0.02;
        const pct = limite > 0 ? (ytdRistoranti / limite) * 100 : 0;
        setLimiteRistorantiInfo({
          limite: limite,
          speso: ytdRistoranti,
          percentuale: pct,
          superato: ytdRistoranti >= limite
        });
      }

      setEntrateMensili(totEntrate);
      setTasseMensiliAccantonate(totTasseAccantonate);
      setUsciteMensili(totUsciteLorde);
      setCategorieSpesa(nuoveCategorie);

    } catch (error) {
      console.error("Errore recupero dashboard:", error);
    }
  }, [getSupabase, user]);

  useEffect(() => {
    // Si cerca prima nel local storage come fallback rapido
    const savedSoglia = localStorage.getItem("soglia_faccina");
    if (savedSoglia) setSogliaFaccina(Number(savedSoglia));

    if (isSignedIn && user) {
      caricaDatiMensili();
    }
  }, [isSignedIn, user, caricaDatiMensili]);

  const handleDeleteTransazione = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Sei sicuro di voler eliminare questa spesa?");
    if (!confirmed) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('transazioni')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await caricaDatiMensili();
      setSelectedCategory(null); // Chiude o rinfresca il modale
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("Errore nell&apos;eliminazione: " + msg);
    }
  };

  const nettoMensile = entrateMensili - usciteMensili - tasseMensiliAccantonate;
  // Per il grafico a torta, non possiamo avere valori negativi. 
  // Se le uscite superano le entrate, il "netto puro" mostrato nella torta deve essere semplicemente 0 (o un minimo per non rompere il rendering)
  const nettoPuroGrafico = Math.max(0.1, nettoMensile);

  // Percentuale allarme su Uscite rispetto alle Entrate (ma escludendo le tasse fisse dal calcolo di "sto spendendo troppo")
  const entrateVerificabili = entrateMensili > 0 ? entrateMensili : 1;
  const uscitePercentuale = (usciteMensili / entrateVerificabili) * 100;
  const emoticonInfo = uscitePercentuale > sogliaFaccina ? "😢" : "😀";

  const dataMensile = {
    labels: ['Netto Pulito', 'Spese', 'Tasse Accantonate'],
    datasets: [
      {
        data: [nettoPuroGrafico, usciteMensili > 0 ? usciteMensili : 0.1, tasseMensiliAccantonate > 0 ? tasseMensiliAccantonate : 0.1],
        backgroundColor: (nettoPuroGrafico === 0.1 && usciteMensili === 0 && tasseMensiliAccantonate === 0)
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

  // Filtra transazioni per la modale se aperta
  const transazioniDellaCategoria = selectedCategory
    ? transazioniMese.filter(t => t.categoria === selectedCategory.nome)
    : [];

  return (
    <div className="pb-20">
      <div className="flex-row-between" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>Ciao, {user?.firstName || 'Avvocato'}! {emoticonInfo}</h2>
            <button
              onClick={() => setShowGuida(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
              title="Guida Fiscale e Tutorial"
            >
              📘
            </button>
          </div>
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: "0.9rem", marginTop: "-4px" }}>Mese Corrente</p>
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

      {/* ALERT GAMIFICATION FISCALE (EPICA 4) */}
      {regimeCorrente === "ordinario" && limiteRistorantiInfo && limiteRistorantiInfo.limite > 0 && limiteRistorantiInfo.percentuale >= 75 && (
        <div className="ios-card" style={{ marginTop: "1rem", backgroundColor: limiteRistorantiInfo.superato ? "rgba(255, 59, 48, 0.1)" : "rgba(255, 149, 0, 0.1)", border: `1px solid ${limiteRistorantiInfo.superato ? "var(--destructive)" : "#ff9f0a"}`, animation: "fadeIn 0.5s" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ fontSize: "2rem" }}>{limiteRistorantiInfo.superato ? "🛑" : "⚠️"}</div>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: limiteRistorantiInfo.superato ? "var(--destructive)" : "#cc7e00" }}>
                {limiteRistorantiInfo.superato ? "Limite Ristoranti Superato" : "Attenzione: Limite Ristoranti Vicino"}
              </h4>
              <p style={{ fontSize: "0.85rem", margin: 0, opacity: 0.9 }}>
                {limiteRistorantiInfo.superato
                  ? `Hai superato il limite di legge del 2% annuo per dedurre i pasti (Speso: €${limiteRistorantiInfo.speso.toFixed(2)} / Limite: €${limiteRistorantiInfo.limite.toFixed(2)}). Le prossime fatture al ristorante non abbatteranno più le tue tasse.`
                  : `Sei al ${limiteRistorantiInfo.percentuale.toFixed(0)}% del limite annuo (2% dei compensi) per ristoranti e hotel. (Speso: €${limiteRistorantiInfo.speso.toFixed(2)} / Limite: €${limiteRistorantiInfo.limite.toFixed(2)}).`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: "2rem" }}>Spese Settoriali Mensili</h2>
      <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Dal 1° del Mese</p>

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
            <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>€{cat.totale.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet Modale */}
      {selectedCategory && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <button className="bottom-sheet-close" onClick={() => setSelectedCategory(null)}>&times;</button>

            <div style={{ textAlign: "center", marginTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{selectedCategory.icona}</div>
              <h2>{selectedCategory.nome}</h2>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>
                Totale Mese: €{selectedCategory.totale.toFixed(2)}
              </p>
            </div>

            <div style={{ padding: "0 1rem", maxHeight: "40vh", overflowY: "auto" }}>
              {transazioniDellaCategoria.length === 0 ? (
                <div style={{ textAlign: "center", opacity: 0.5, padding: "2rem" }}>
                  Nessuna transazione per questa categoria.
                </div>
              ) : (
                transazioniDellaCategoria.map((t) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "600" }}>{t.descrizione || t.categoria}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{t.data_transazione}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: "bold", color: "var(--destructive)" }}>€{Number(t.importo).toFixed(2)}</span>
                      <button
                        onClick={(e) => handleDeleteTransazione(t.id, e)}
                        style={{ background: "none", border: "none", color: "var(--destructive)", fontSize: "1.2rem", cursor: "pointer" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ textAlign: "center" }}>
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

      {/* Modale Guida e Tutorial App */}
      {showGuida && (
        <div className="bottom-sheet-overlay" onClick={() => setShowGuida(false)} style={{ zIndex: 1000 }}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{ height: '85vh', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="bottom-sheet-handle"></div>
            <button className="bottom-sheet-close" onClick={() => setShowGuida(false)}>&times;</button>

            <div style={{ padding: "0 1rem 2rem 1rem", overflowY: "auto", flex: 1 }}>
              <h2 style={{ marginBottom: "1.5rem", textAlign: "center", fontSize: "1.5rem" }}>📘 Guida & Tutorial</h2>

              <div className="ios-card" style={{ marginBottom: "1rem" }}>
                <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>Il Nuovo Motore Fiscale</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.5", opacity: 0.9, marginBottom: "0.5rem" }}>
                  <strong>1. Badge in Tempo Reale:</strong> Inserendo una spesa manualmente o scansionando uno scontrino, vedrai comparire un avviso in tempo reale con l&apos;esatto importo deducibile (es: amount * deductibilityRate) calcolato matematicamente al volo.
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.5", opacity: 0.9, marginBottom: "0.5rem" }}>
                  <strong>2. Tasse Abbattute in Diretta (Ordinario):</strong> La Dashboard &quot;sottrae&quot; automaticamente il totale delle spese legalmente deducibili dal tuo imponibile. Noterai il tuo <em>Fondo Tasse Virt.</em> abbassarsi in tempo reale all&apos;inserimento di ogni scontrino valido!
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.5", opacity: 0.9, marginBottom: "0.5rem" }}>
                  <strong>3. Tieni d&apos;occhio la Faccina:</strong> L&apos;emoticon in alto valuta la tua spesa globale per frenare il consumismo. Modificabile nelle impostazioni.
                </p>
                <p style={{ fontSize: "0.9rem", lineHeight: "1.5", opacity: 0.9 }}>
                  <strong>4. Gamification Ristoranti:</strong> La legge italiana limita le spese per Ristoranti e Hotel al 2% dei compensi annui (YTD). Se ti avvicini o sfori questo tetto, la UI rivelerà un banner di allerta arancione/rosso sotto il grafico mensile per dirti di non dedurre più!
                </p>
              </div>

              <div className="ios-card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>Tassi di Deducibilità Centralizzati</h3>
                <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1rem", background: "rgba(255,59,48,0.1)", padding: "10px", borderRadius: "8px", color: "var(--destructive)" }}>
                  <strong>Nota per i Forfettari:</strong> I bonus deducibilità spiegati sopra valgono SOLO per il <strong>Regime Ordinario</strong> (impostabile dal tuo Profilo). I forfettari hanno costi scaricati forfettizzati automaticamente al 15% per legge, indipendenti dalle spese caricate in app.
                </p>
                <ul style={{ fontSize: "0.85rem", paddingLeft: "1.2rem", lineHeight: "1.6", opacity: 0.9 }}>
                  <li style={{ marginBottom: "6px" }}><strong>100%:</strong> Cancelleria, software, formazione, spese di lavoro/ufficio esclusivo.</li>
                  <li style={{ marginBottom: "6px" }}><strong>80%:</strong> Telefonia, internet, utenze promiscue.</li>
                  <li style={{ marginBottom: "6px" }}><strong>75%:</strong> Ristoranti e Trasferte. Il motore incrocia questo rate con il tetto di &quot;plafond&quot; massimo annuo (il tuo 2% dei compensi totali incassati). Oltre questa soglia, non saranno più validi!</li>
                  <li style={{ marginBottom: "6px" }}><strong>50%:</strong> Affitto e Utenze per casa-studio (Promiscuo).</li>
                  <li><strong>20%:</strong> Auto, viaggi vari, mezzi di trasporto, carburante.</li>
                </ul>
                <p style={{ fontSize: "0.75rem", color: "var(--destructive)", marginTop: "1rem", opacity: 0.8 }}>
                  <em>Disclaimer: Le percentuali sono stimate algoritmicamente dal gestionale a titolo informativo basandosi sull&apos;attuale normativa TUIR (Ordinario Avvocati). Il commercialista valuterà caso per caso il reale principio di inerenza e competenza.</em>
                </p>
              </div>

              <button
                className="ios-btn-large"
                onClick={() => setShowGuida(false)}
                style={{ width: "100%", marginTop: "1rem" }}
              >
                Ho Capito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Legale Interno (Beta) */}
      <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", opacity: 0.6, maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" }}>
          <strong>Versione Beta Privata.</strong> Questo gestionale è fornito allo stato attuale come test non a fini commerciali (Senza Partita IVA).
          I calcoli fiscali visualizzati in questa Dashboard (Cassa Forense, IRPEF, Imposta Sostitutiva) hanno puramente valore di simulazione matematica e non costituiscono parere professionale né dato certo per le dichiarazioni fiscali obbligatorie.
          <br /><br />
          <strong>Privacy:</strong> Nessun dato biometrico o immagine di spesa viene trasmesso esternamente (elaborazione OCR su dispositivo). Vengono impiegati esclusivamente cookie tecnici per la validazione della sessione.
        </p>
      </div>

    </div>
  );
}
