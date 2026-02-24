import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "Nessuna immagine fornita" }, { status: 400 });
        }

        const ocrApiKey = process.env.OCR_API_KEY;
        if (!ocrApiKey) {
            console.error("OCR_API_KEY non configurata");
            return NextResponse.json({ error: "Chiave API OCR mancante lato server" }, { status: 500 });
        }

        // Chiamata all'API di OCR.space
        // Trasmettiamo come base64Image appendendo il prefisso corretto se mancante
        const base64Payload = imageBase64.startsWith('data:image')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

        const formData = new FormData();
        formData.append('base64image', base64Payload);
        formData.append('language', 'ita');
        formData.append('isOverlayRequired', 'false');

        // Optional: Table recognition o receipt logic
        formData.append('isTable', 'true');
        formData.append('scale', 'true');

        const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': ocrApiKey,
            },
            body: formData,
        });

        const ocrResult = await ocrResponse.json();

        if (ocrResult.IsErroredOnProcessing) {
            console.error("Errore OCR:", ocrResult.ErrorMessage);
            return NextResponse.json({ error: ocrResult.ErrorMessage?.[0] || 'Errore elaborazione OCR' }, { status: 500 });
        }

        // Estrai il testo puro
        const testoSgrezzo = ocrResult.ParsedResults?.[0]?.ParsedText || "";

        // 1. Estrazione Importo (Euristica semplificata ma potente)
        // Cerca pattern come "TOTALE € 15,50", "Eur 20.00", o semplicemente il numero più grande/in fondo
        let importoEstratto = 0;
        const testoLows = testoSgrezzo.toLowerCase();

        // Tenta un match diretto post "totale" o "documento"
        // Supporta le virgole italiane o i punti decimali americani
        const regexTotale = /(?:totale|importo|pagato|eur|euro|€)\s*[:.-]?\s*(\d{1,4}[.,]\d{2})/ig;
        let match;
        let massimi = [];

        while ((match = regexTotale.exec(testoLows)) !== null) {
            // Sostituisce virgole con punti
            const pulito = match[1].replace(',', '.');
            const num = parseFloat(pulito);
            if (!isNaN(num)) massimi.push(num);
        }

        if (massimi.length > 0) {
            importoEstratto = Math.max(...massimi); // Prende il numero logico più grande tra quelli "totale"
        } else {
            // Se non trova "totale", cerca il primo numero formattato come valuta a 2 decimali vicino alla fine
            const regexNumeriValuta = /(\d{1,4}[.,]\d{2})/g;
            const matchesArr = Array.from(testoLows.matchAll(regexNumeriValuta)) as RegExpMatchArray[];
            if (matchesArr.length > 0) {
                // Spesso il totale è l'ultimo numero dello scontrino
                const ultimoElemento = matchesArr[matchesArr.length - 1];
                if (ultimoElemento && ultimoElemento[1]) {
                    const lastMatch = ultimoElemento[1].replace(',', '.');
                    importoEstratto = parseFloat(lastMatch);
                }
            }
        }

        // 2. Classificazione IA finta "Rule-Based" veloce e senza LLM a pagamento
        // Usa keyword matching basico
        let categoriaSuggerita = "Altro";
        if (testoLows.match(/ristorant|pizzer|trattoria|bar |osteria|caff/)) categoriaSuggerita = "Ristoranti";
        else if (testoLows.match(/farmacia|medic|visita|sanit|dott.ssa|dott./)) categoriaSuggerita = "Salute";
        else if (testoLows.match(/carburant|benzi|eni|q8|agip|tamoil|ip |diesel|verde|gasolio/)) categoriaSuggerita = "Carburante";
        else if (testoLows.match(/conad|coop|esselunga|pam|lidl|eurospin|despar|supermercat/)) categoriaSuggerita = "Alimenti";
        else if (testoLows.match(/treno|italo|trenitalia|taxi|bus|metropolitana/)) categoriaSuggerita = "Auto/Trasporti";
        else if (testoLows.match(/cartoleria|buffetti|carta|penna/)) categoriaSuggerita = "Cancelleria";

        return NextResponse.json({
            importo: importoEstratto,
            categoria: categoriaSuggerita,
            testoEstratto: testoSgrezzo.substring(0, 300) + (testoSgrezzo.length > 300 ? "..." : "") // Manda solo un pezzo come debug per la UI
        }, { status: 200 });

    } catch (error: any) {
        console.error("Catch Exception in API OCR:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
