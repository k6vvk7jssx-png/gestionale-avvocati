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
        if (applicaIva) {
            iva22 = totaleFatturaLordo * 0.22;
            totaleFatturaLordo += iva22;
        }
        if (applicaRitenuta) {
            // La ritenuta si applica SOLO sul compenso base puro (niente spese/cpa) in molti casi, 
            // ma fiscalmente per gli avvocati si applica su (Compenso + Spese Generali).
            // Aderiamo al prompt: "Applica Ritenuta 20% (solo sul compenso base)" come da istruzioni utente.
            ritenutaAcconto20 = compensoBase * 0.20;
        }

        nettoCalcolato = totaleFatturaLordo - ritenutaAcconto20;
    } else {
        // Forfettario (5% o 15% ai fini IRPEF, ma in fattura non hanno IVA né Ritenuta)
        iva22 = 0;
        ritenutaAcconto20 = 0;
        nettoCalcolato = totaleFatturaLordo; // Netto in fattura = Lordo in fattura, le tasse si pagano dopo
    }

    return {
        compensoBase,
        speseGenerali15,
        cpa4,
        iva22,
        ritenutaAcconto20,
        nettoCalcolato,
        totaleFatturaLordo
    };
}
