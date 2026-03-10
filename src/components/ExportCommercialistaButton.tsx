"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Download, Loader2 } from "lucide-react";

export default function ExportCommercialistaButton() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Simuliamo un ritardo di rete/elaborazione dati dal DB
            await new Promise(resolve => setTimeout(resolve, 1500));

            // --- FOGLIO 1: SPESE (MOCK DATA) ---
            const speseData = [
                {
                    "Data Spesa": "2026-03-01",
                    "Descrizione / Fornitore": "Cena Ristorante Da Mario",
                    "Categoria Fiscale": "Ristoranti",
                    "Importo Lordo Speso (€)": 150.00,
                    "% di Deducibilità Legale": "75%",
                    "Importo Deducibile Calcolato (€)": 112.50
                },
                {
                    "Data Spesa": "2026-03-05",
                    "Descrizione / Fornitore": "Cancelleria Buffetti",
                    "Categoria Fiscale": "Cancelleria",
                    "Importo Lordo Speso (€)": 45.00,
                    "% di Deducibilità Legale": "100%",
                    "Importo Deducibile Calcolato (€)": 45.00
                },
                {
                    "Data Spesa": "2026-03-10",
                    "Descrizione / Fornitore": "Pieno Benzina IP",
                    "Categoria Fiscale": "Auto",
                    "Importo Lordo Speso (€)": 60.00,
                    "% di Deducibilità Legale": "20%",
                    "Importo Deducibile Calcolato (€)": 12.00
                },
                {
                    "Data Spesa": "2026-03-12",
                    "Descrizione / Fornitore": "Bolletta TIM Fibra Studio",
                    "Categoria Fiscale": "Utenze/Tel",
                    "Importo Lordo Speso (€)": 50.00,
                    "% di Deducibilità Legale": "80%",
                    "Importo Deducibile Calcolato (€)": 40.00
                }
            ];

            // --- FOGLIO 2: FATTURE EMESSE (MOCK DATA) ---
            const fattureData = [
                {
                    "Data Incasso": "2026-03-02",
                    "Cliente / Pratica": "Rossi c. Bianchi",
                    "Compenso Lordo (€)": 2000.00,
                    "Cassa Forense 4% (€)": 80.00,
                    "Totale Imponibile (€)": 2080.00
                },
                {
                    "Data Incasso": "2026-03-08",
                    "Cliente / Pratica": "Azienda Alfa Spa",
                    "Compenso Lordo (€)": 4500.00,
                    "Cassa Forense 4% (€)": 180.00,
                    "Totale Imponibile (€)": 4680.00
                },
                {
                    "Data Incasso": "2026-03-09",
                    "Cliente / Pratica": "Consulenza Verdi",
                    "Compenso Lordo (€)": 800.00,
                    "Cassa Forense 4% (€)": 32.00,
                    "Totale Imponibile (€)": 832.00
                }
            ];

            // 1. Crea in memoria un nuovo Workbook Excel
            const wb = XLSX.utils.book_new();

            // 2. Converte l'array di oggetti in un formato foglio gestibile da Sheets
            const wsSpese = XLSX.utils.json_to_sheet(speseData);
            const wsFatture = XLSX.utils.json_to_sheet(fattureData);

            // Larghezze colonne ottimizzate (approx. caratteri)
            wsSpese['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 22 }, { wch: 25 }, { wch: 30 }];
            wsFatture['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 22 }, { wch: 22 }];

            // 3. Aggiunge i fogli creati al Workbook con i nomi richiesti
            XLSX.utils.book_append_sheet(wb, wsSpese, "Spese_Trimestre");
            XLSX.utils.book_append_sheet(wb, wsFatture, "Fatture_Emesse");

            // 4. Salva il file forzando il download sul browser del cliente
            // Formattiamo il nome del file con data corrente
            const today = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Export_Commercialista_${today}.xlsx`);

        } catch (error) {
            console.error("Errore durante l'export in Excel:", error);
            alert("Si è verificato un errore durante la generazione dell'Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full max-w-sm mx-auto flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-[17px] tracking-tight transition-all duration-300 shadow-md ${isExporting
                    ? "bg-stone-800 text-stone-400 cursor-not-allowed scale-95 opacity-80"
                    : "bg-[#1C1C1E] text-white hover:bg-[#2C2C2E] hover:scale-[0.98] border border-white/5 active:bg-[#3C3C3E]"
                }`}
            style={{
                backdropFilter: "blur(10px)" // Tocco iOS
            }}
        >
            {isExporting ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generazione file...</span>
                </>
            ) : (
                <>
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <span>Esporta per Commercialista</span>
                    <Download className="w-4 h-4 ml-1 opacity-60" />
                </>
            )}
        </button>
    );
}
