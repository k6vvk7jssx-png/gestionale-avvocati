# Statera-Lex

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Statera-Lex** is a financial management, legal accounting, and tax automation SaaS platform engineered specifically for Italian law firms, attorneys, and freelance legal professionals.

---

## ✨ Features

* **Forensic Tax Engine (`taxCalculator.ts`):** Full calculation compliant with Italian legal standards (Compenso Base, Spese Generali 15%, Cassa Previdenza Avvocati 4%, Ritenuta d'Acconto 20%, IVA 22%, Regime Ordinario & Forfettario).
* **Smart OCR Receipt Scanner:** Serverless OCR pipeline that extracts totals, vendor data, and deductibility categories from receipt photos.
* **Case Management & Legal Billing:** Real-time dashboard for ongoing legal proceedings, client billing, and tax projections.
* **Commercialista Export:** One-click export format tailored for Italian certified public accountants.
* **Secure Multi-Tenant Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS.
* **Backend:** Next.js Server Actions, Supabase PostgreSQL, Python Serverless Functions.
* **OCR & AI:** OCR.space API, automated regex entity extractor.

---

## 🚀 Getting Started

```bash
git clone https://github.com/k6vvk7jssx-png/Statera-lex.git
cd Statera-lex

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

---

## 📄 License
MIT License.
