export type RegimeFiscale = 'forfettario_5' | 'forfettario_15' | 'ordinario' | 'free';

export interface FiscalCalculationResult {
    compensoBase: number;
    speseGenerali15: number;
    cpa4: number;
    iva22: number;
    ritenutaAcconto20: number;
    nettoCalcolato: number;
    totaleFatturaLordo: number;
}

/**
 * Calcola le voci della fattura in base al regime italiano per Avvocati.
 * @param compensoBase Il "Compenso Lordo Concordato" (onorario puro)
 * @param regime Il regime fiscale selezionato
 * @param applicaIva Se applicare o no l'IVA (solo Ordinario)
 * @param applicaRitenuta Se detrarre o no la Ritenuta d'Acconto (solo Ordinario)
 */
export function calculateInvoice(
    compensoBase: number,
    regime: RegimeFiscale,
    applicaIva: boolean = false,
    applicaRitenuta: boolean = false
): FiscalCalculationResult {
    const speseGenerali15 = compensoBase * 0.15;
    const imponibileCassa = compensoBase + speseGenerali15;
    const cpa4 = imponibileCassa * 0.04;

    let iva22 = 0;
    let ritenutaAcconto20 = 0;

    // Totale Fattura Lordo = Compenso + Spese 15% + CPA 4% (+ eventuale IVA)
    let totaleFatturaLordo = compensoBase + speseGenerali15 + cpa4;
    let nettoCalcolato = totaleFatturaLordo;

    if (regime === 'free') {
        return {
            compensoBase,
            speseGenerali15: 0,
            cpa4: 0,
            iva22: 0,
            ritenutaAcconto20: 0,
            nettoCalcolato: compensoBase,
            totaleFatturaLordo: compensoBase
        }
    }

    if (regime === 'ordinario') {
        const imponibileLordo = compensoBase + speseGenerali15;
        const cpa4 = imponibileLordo * 0.04;

        if (applicaIva) {
            iva22 = (imponibileLordo + cpa4) * 0.22;
        }

        totaleFatturaLordo = imponibileLordo + cpa4 + iva22;

        if (applicaRitenuta) {
            // Regola 2026 Utente: La ritenuta d'acconto 20% si calcola su Imponibile Lordo (Compenso + Spese Generali 15%)
            ritenutaAcconto20 = imponibileLordo * 0.20;
        }

        // Netto in tasca = Lordo Totale (inclusa iva) - Ritenuta
        nettoCalcolato = totaleFatturaLordo - ritenutaAcconto20;
    } else {
        // Forfettario (5% o 15% ai fini IRPEF)
        // In fattura NON hanno IVA e NON hanno Ritenuta.
        iva22 = 0;
        ritenutaAcconto20 = 0;
        nettoCalcolato = totaleFatturaLordo; // Il cliente paga tutto il lordo (no trattenute alla fonte)
    }

    return {
        compensoBase,
        speseGenerali15,
        cpa4: regime === 'ordinario' ? ((compensoBase + speseGenerali15) * 0.04) : cpa4,
        iva22,
        ritenutaAcconto20,
        nettoCalcolato,
        totaleFatturaLordo
    };
}
