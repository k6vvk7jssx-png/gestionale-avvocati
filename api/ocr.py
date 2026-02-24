import os
import json
import re
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler

# Chiave API per OCR.space (inserita in Vercel / .env)
OCR_API_KEY = os.getenv("OCR_SPACE_API_KEY", "")

def processa_testo_ocr(testo):
    """
    Usa Regex basilari per trovare l'importo più alto e indovinare la categoria
    senza usare librerie pesanti come spacy/nltk (limite Vercel 50MB).
    """
    # Trova tutti i numeri formattati come valuta (es. 12.50, 1.200,00, 45,20)
    # Cerchiamo pattern tipo \d+[,.]\d{2}
    importi = []
    matches = re.findall(r'\b\d+[.,]\d{2}\b', testo)
    
    for match in matches:
        # Convertiamo la virgola in punto se è il separatore decimale
        pulito = match.replace(',', '.')
        try:
            importi.append(float(pulito))
        except ValueError:
            pass

    # L'importo totale solitamente è il numero più alto sullo scontrino (assunzione grossolana ma efficace)
    totale = max(importi) if importi else 0.0

    # Categorizzazione basica con parole chiave
    testo_lower = testo.lower()
    categoria = "Imprevisti"
    
    keyword_map = {
        "Salute": ["farmacia", "paracetamolo", "medico", "visita", "ospedale", "salute", "ticket"],
        "Alimenti": ["supermercato", "conad", "coop", "esselunga", "alimentari", "pane", "latte", "ristorante", "pizzeria"],
        "Lavoro": ["carta", "cancelleria", "computer", "software", "abbonamento", "internet", "hosting", "treno", "taxi"],
        "Vizi": ["tabacchi", "sigarette", "bar", "caffè", "birra", "pub", "gratta e vinci"],
        "Viaggi": ["hotel", "volo", "ryanair", "easyjet", "booking", "autostrada", "pedaggio", "carburante", "eni", "q8", "benzina"],
        "Sport": ["palestra", "piscina", "decathlon", "sport", "tennis"],
        "Figli": ["scuola", "asilo", "giocattoli", "libri scolastici", "pannolini"]
    }

    for cat, parole in keyword_map.items():
        if any(parola in testo_lower for parola in parole):
            categoria = cat
            break

    return totale, categoria

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            base64_image = body.get('imageBase64')
            
            if not base64_image:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Nessuna immagine fornita'}).encode())
                return

            if not OCR_API_KEY:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Chiave API OCR non configurata'}).encode())
                return

            # Prepara la richiesta per OCR.space (accetta base64 con prefisso)
            # URL encode dei parametri POST
            data = urllib.parse.urlencode({
                'base64Image': f"data:image/jpeg;base64,{base64_image}",
                'language': 'ita',
                'isOverlayRequired': 'false'
            }).encode('utf-8')

            req = urllib.request.Request(
                'https://api.ocr.space/parse/image', 
                data=data,
                headers={'apikey': OCR_API_KEY}
            )

            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())

            if result.get('IsErroredOnProcessing'):
                raise Exception(result.get('ErrorMessage', ['Errore sconosciuto OCR'])[0])

            # Estrai il testo
            testo_estratto = ""
            parsed_results = result.get('ParsedResults', [])
            if parsed_results:
                testo_estratto = parsed_results[0].get('ParsedText', '')

            if not testo_estratto:
                raise Exception("Nessun testo trovato nell'immagine")

            # Analizza il testo per estrarre importo e categoria
            totale, categoria = processa_testo_ocr(testo_estratto)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'importo': totale,
                'categoria': categoria,
                'testoEstratto': testo_estratto
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
