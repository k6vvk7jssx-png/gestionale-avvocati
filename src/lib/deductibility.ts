export type CategoriaSpesa = string;

/**
 * Ritorna la percentuale di deducibilità (0.0 a 1.0) in base alla categoria.
 * Regole Prompt: Cancelleria/Software/Lavoro (1.0), Ristoranti (0.75), Auto (0.20), Alimenti/Altro (0.0).
 */
export function getDeductibilityPercentage(categoria: CategoriaSpesa): number {
    const catLow = categoria.toLowerCase();

    if (catLow.includes("cancelleria") || catLow.includes("software") || catLow.includes("lavoro") || catLow.includes("formazione")) {
        return 1.0; // 100%
    }

    if (catLow.includes("ristorant")) {
        return 0.75; // 75%
    }

    if (catLow.includes("auto") || catLow.includes("trasporti") || catLow.includes("carburante") || catLow.includes("viaggi")) {
        return 0.20; // 20%
    }

    // Alimenti, Imprevisti, Altro ecc...
    return 0.0;
}
