import os
import json
from http.server import BaseHTTPRequestHandler

# Utilizziamo la lib standard per non aggiungere peso.
# Il search agent userebbe un LLM o query SQL, ma visto i vincoli serverless Python "nudi" 
# e mancanza di lib esterne extra nel task, mettiamo un mock strutturale molto intelligente e veloce.

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            query = body.get('query', '').lower()
            
            # --- Mock NLP Engine ---
            base_risposta = "Non ho capito la richiesta. Prova con 'Spese salute agosto?'"
            cifra = 0
            
            if 'salute' in query and 'agosto' in query:
                cifra = 150.20
                base_risposta = f"Ad Agosto hai speso €{cifra} in Salute."
            elif 'tasse' in query:
                cifra = 4000
                base_risposta = f"Il carico fiscale stimato per l'anno corrente è di €{cifra}."
            elif 'entrate' in query or 'guadagnato' in query:
                cifra = 35000
                base_risposta = f"Quest'anno le tue entrate nette ammontano a €{cifra}."
            elif 'figli' in query:
                cifra = 850.50
                base_risposta = f"Hai speso €{cifra} per spese relative ai Figli."
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'text': base_risposta,
                'amount': cifra
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
