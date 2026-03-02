// Costanti per le percentuali di deducibilità fiscale in base alle categorie
// Regime Ordinario - Avvocati (Normativa Italiana)

export const DEDUCTIBILITY_RATES: Record<string, number> = {
    // 100%
    "cancelleria": 1.0,
    "software": 1.0,
    "formazione": 1.0,
    "lavoro": 1.0,           // Spese generali per il lavoro (es. affitto studio esclusivo, stampante)

    // 80%
    "telefonia": 0.80,       // Promiscuo bollette telefono cellulare/internet
    "utenze": 0.80,          // Usiamo 80% come promiscuo generale per utenze (spesso 50% o 80% a seconda dei casi, restiamo conservativi)

    // 75%
    "ristoranti": 0.75,      // Ristoranti e Alberghi (con limite del 2% sui compensi)

    // 50%
    "uso_promiscuo_casa": 0.50, // Affitto/Utenze casa-studio

    // 20%
    "auto/trasporti": 0.20,  // Auto, Trasporti, Pedaggi
    "carburante": 0.20,      // Benzina, Diesel, Ricarica Elettrica
    "viaggi": 0.20,          // Se legato all'auto (Altrimenti se trasferta pura vedi alberghi)

    // 0%
    "alimenti": 0.0,         // Spesa al supermercato non rientra
    "salute": 0.0,           // Spese mediche personali (detraibili in dichiarazione personale, non dal reddito professionale)
    "tasse": 0.0,            // Le tasse non deducono le tasse
    "senza tasse": 0.0,      // Voci escluse
    "abbigliamento": 0.0,    // Vestiti normalmente non deducibili per avvocati
    "imprevisti": 0.0,
    "altro": 0.0
};
