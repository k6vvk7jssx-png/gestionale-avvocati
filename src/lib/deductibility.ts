import { DEDUCTIBILITY_RATES } from './taxConstants';

export type CategoriaSpesa = string;

/**
 * Ritorna la percentuale di deducibilità (0.0 a 1.0) in base alla categoria.
 * Usa il dizionario DEDUCTIBILITY_RATES per la logica Ordinario.
 */
export function getDeductibilityPercentage(categoria: CategoriaSpesa): number {
    const catLow = categoria.toLowerCase();

    // Controlla se esiste una chiave esatta o parziale nel dizionario
    for (const [key, rate] of Object.entries(DEDUCTIBILITY_RATES)) {
        if (catLow.includes(key.toLowerCase())) {
            return rate;
        }
    }

    // Fallback: 0% se non trovato o non catalogato
    return 0.0;
}
