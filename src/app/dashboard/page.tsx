"use client";

import { useState, useEffect, useCallback } from "react";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import ExportCommercialistaButton from "@/components/ExportCommercialistaButton";
import { useExpenseContext } from "@/context/ExpenseContext";

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

  // Global State (Zustand/Context come richiesto)
  const { regime: ctxRegime, expenses: ctxExpenses, removeExpense } = useExpenseContext();

  // Helper per raggruppare spese in tempo reale
  const categorieContextList = [
    { nome: "Alimenti", icona: "🛒" },
    { nome: "Ristoranti", icona: "🍽️" },
    { nome: "Salute", icona: "💊" },
    { nome: "Lavoro", icona: "💼" },
    { nome: "Cancelleria", icona: "📎" },
    { nome: "Software", icona: "💻" },
    { nome: "Auto/Trasporti", icona: "🚗" },
    { nome: "Carburante", icona: "⛽" },
    { nome: "Viaggi", icona: "✈️" },
    { nome: "Tasse", icona: "🏦" },
    { nome: "Senza Tasse", icona: "🆓" },
    { nome: "Utenze", icona: "💡" },
    { nome: "Formazione", icona: "📚" },
    { nome: "Abbigliamento", icona: "👔" },
    { nome: "Imprevisti", icona: "⚠️" },
    { nome: "Altro", icona: "📦" },
  ];

  const ctxGrouped = categorieContextList.map(cat => {
    const transazioniCat = ctxExpenses.filter(e => e.category === cat.nome);
    const totale = transazioniCat.reduce((acc, curr) => acc + curr.amount, 0);
    return { ...cat, totale, transazioni: transazioniCat };
  });

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
            const secchio2_cassa = redditoImponibileLordo * 0.17; // Contributo Soggettivo

            // BUGFIX: Deducibilità Contributo Soggettivo prima dell'imposta sostitutiva
            const baseImponibileNetta = redditoImponibileLordo - secchio2_cassa;

            const aliquotaFisco = tipoFiscale === "forfettario_5" ? 0.05 : 0.15;
            const secchio3_imposta = baseImponibileNetta * aliquotaFisco;

            totTasseAccantonate += (secchio1_cpa + secchio2_cassa + secchio3_imposta);

          } else if (tipoFiscale === "ordinario") {
            // Modello ORDINARIO
            const compensoPuro = Number(c.compenso_base || c.compenso_lordo || 0);
            const speseGenerali = compensoPuro * 0.15;
            const imponibileLordo = compensoPuro + speseGenerali;

            // EPICA 3: Sottraggo le uscite deducibili dall'Imponibile Cassa per calcolare l' Utile Lordo reale
            const utileLordo = Math.max(0, imponibileLordo - totUsciteDeducibili);

            const secchio1_cpa = c.cpa_4 ? Number(c.cpa_4) : imponibileLordo * 0.04;
            const secchio2_iva = c.iva_22 ? Number(c.iva_22) : (imponibileLordo + secchio1_cpa) * 0.22;
            const secchio3_cassa = utileLordo * 0.17; // Soggettivo

            const percentualeIrpef = currentScaglione / 100.0;
            const baseIrpef = Math.max(0, utileLordo - secchio3_cassa);
            const secchio4_irpefLorda = baseIrpef * percentualeIrpef;
            const secchio5_addizionali = baseIrpef * 0.03; // ~3%

            // BUGFIX: Ritenuta calcolata sull'imponibile lordo (compenso + spese generali)
            const scontoRitenuta = c.ritenuta_20 ? Number(c.ritenuta_20) : imponibileLordo * 0.20;
            const irpefaSaldo = Math.max(0, secchio4_irpefLorda - scontoRitenuta);

            totTasseAccantonate += (secchio1_cpa + secchio2_iva + secchio3_cassa + irpefaSaldo + secchio5_addizionali);

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

  const statusIcon = uscitePercentuale > sogliaFaccina
    ? <XCircle className="w-6 h-6 text-red-500" />
    : <CheckCircle2 className="w-6 h-6 text-green-500" />;

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
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Ciao, {user?.firstName || 'Avvocato'}! {statusIcon}
            </h2>
            <button
              onClick={() => setShowGuida(true)}
              style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
              title="Guida Fiscale e Tutorial"
            >
              📘
            </button>
          </div>
          <p style={{ color: "var(--foreground)", opacity: 0.6, fontSize: "0.9rem", marginTop: "-4px" }}>
            Mese Corrente
          </p>
        </div>

        {/* Torta Annuale (Piccola in alto a dx - La manteniamo fissa come design target per ora) */}
        <div className="md:hidden" style={{ width: "80px", height: "80px" }}>
          <Pie data={dataAnnuale} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {/* Grid Superiore: Torte e Info Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">

        {/* Torta Mensile (Grande Centrale) */}
        <div className="ios-card md:col-span-2 lg:col-span-1" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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

        {/* Card 2: Riepilogo Annuale MTD visualizzata solo su desktop per bilanciare */}
        <div className="ios-card hidden md:flex flex-col justify-between">
          <div>
            <h3 className="mb-4">Riepilogo YTD (Anno)</h3>
            <div className="chart-container-small mx-auto mb-4">
              <Pie data={dataAnnuale} options={{ plugins: { legend: { display: false } } }} />
            </div>
          </div>

          <div className="space-y-3 border-t border-black/10 dark:border-white/10 pt-4 mt-auto">
            <p className="text-sm opacity-70 text-center">I grafici annuali offrono una visione globale YTD rispetto al regime fiscale impostato.</p>
          </div>
        </div>

        <div className="hidden lg:block ios-card opacity-50 flex items-center justify-center border border-dashed border-gray-400">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm">Spazio riservato a futuri Modelli ML</p>
          </div>
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

      {/* Grid Inferiore: Categorie di Spesa (GLOBAL STATE CONTEXT) */}
      <div className="mt-8 mb-4 flex justify-between items-end">
        <div>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            Spese In Tempo Reale <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded-full">{ctxRegime}</span>
          </h2>
          <p style={{ fontSize: "0.9rem", opacity: 0.7, margin: 0 }}>
            {ctxRegime === "forfettario" ? "⚠️ Statistiche visive (Non sottratte ai ricavi)" : "Deducibili dall'imponibile"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {ctxGrouped.map((cat, idx) => (
          <div
            key={idx}
            className="ios-card hover:bg-white/5 transition-colors flex flex-col justify-between"
            style={{ padding: "1.25rem", cursor: "pointer", height: "120px" }}
            onClick={() => setSelectedCategory(cat)}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{cat.icona}</div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: "600", color: "var(--foreground)" }}>{cat.nome}</div>
              <div style={{ fontSize: "1.1rem", opacity: 0.8, color: cat.totale > 0 ? "var(--destructive)" : "inherit" }}>
                €{cat.totale.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet Modale Spese Context */}
      {selectedCategory && (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedCategory(null)} style={{ zIndex: 1000 }}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <button className="bottom-sheet-close" onClick={() => setSelectedCategory(null)}>&times;</button>

            <div style={{ textAlign: "center", marginTop: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{selectedCategory.icona}</div>
              <h2>{selectedCategory.nome}</h2>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>
                Totale Categoria: €{selectedCategory.totale.toFixed(2)}
              </p>
            </div>

            <div style={{ padding: "0 1rem", maxHeight: "40vh", overflowY: "auto" }}>
              {/* @ts-ignore */}
              {selectedCategory.transazioni?.length === 0 ? (
                <div style={{ textAlign: "center", opacity: 0.5, padding: "2rem" }}>
                  Nessuna transazione in questa categoria.
                </div>
              ) : (
                /* @ts-ignore */
                selectedCategory.transazioni?.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: "600", color: "var(--foreground)", fontSize: "1rem" }}>{t.description || t.category}</div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.5 }}>{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontWeight: "bold", color: "var(--destructive)", fontSize: "1.1rem" }}>€{Number(t.amount).toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExpense(t.id);
                          // Aggiorna istantaneamente il modale o lo chiudi se vuoto
                          // @ts-ignore
                          const prevList = selectedCategory.transazioni;
                          if (prevList.length === 1) setSelectedCategory(null);
                          else {
                            const newList = prevList.filter((tr: any) => tr.id !== t.id);
                            setSelectedCategory({
                              ...selectedCategory,
                              transazioni: newList,
                              totale: newList.reduce((acc: number, curr: any) => acc + curr.amount, 0)
                            } as any);
                          }
                        }}
                        style={{ background: "none", border: "none", color: "var(--destructive)", padding: "4px", cursor: "pointer", opacity: 0.8, transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0.8"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                className="ios-btn-large"
                style={{ marginTop: "2rem", width: "100%" }}
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
                <li>
                  <strong>3. Tieni d&apos;occhio l&apos;Indicatore di Spesa:</strong> L&apos;icona in alto (Verde/Rossa) valuta la tua spesa globale per frenare il consumismo. Modificabile nelle impostazioni.
                </li>
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

      {/* Bottone Export Excel Commercialista */}
      <div style={{ marginTop: "3rem", marginBottom: "1rem" }}>
        <ExportCommercialistaButton />
      </div>

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
