import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATION_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { financialData } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Sei un assistente fiscale esperto per avvocati italiani. 
      Analizza i seguenti dati finanziari mensili e fornisci 3 consigli rapidi e professionali per ottimizzare le tasse o gestire meglio le spese.
      Usa un tono professionale ma amichevole (stile iOS/Premium).
      
      Dati Finanziari:
      - Entrate: €${financialData.entrate}
      - Uscite: €${financialData.uscite}
      - Tasse Accantonate: €${financialData.tasse}
      - Regime: ${financialData.regime}
      
      Rispondi in formato JSON con la seguente struttura:
      {
        "insights": ["consiglio 1", "consiglio 2", "consiglio 3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Pulisci il testo se Gemini aggiunge markdown backticks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Analyze Error:", error);
    return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 });
  }
}
