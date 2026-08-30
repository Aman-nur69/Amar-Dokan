# MudiDokan (মুদিদোকান) — Offline-First Retail OS & Digital Bakir Khata

**মুদিদোকান (MudiDokan)** is a hyper-localized retail operating system and digital credit ledger (*Bakir Khata*) engineered specifically for grocery store shopkeepers (*mudi dokandars*) in Bangladesh. 

Designed for **zero cognitive load**, **unstable mobile network conditions (2G/3G/4G drops)**, **fast multi-modal checkout**, and **bulletproof financial consistency**.

---

## 🌟 Key Features

### 1. 🛒 Frictionless Quick-POS
- **1-Tap Unbarcoded Bulk Grid:** High-frequency goods (খোলা সয়াবিন তেল, চিনি, মসুর ডাল, ফার্মের ডিম, গোল আলু, পেঁয়াজ, চাল, রসুন) with visual icons and 1-tap cart additions.
- **Bulk Weight Converter:** Instant quantity presets (২৫০ গ্রাম, ৫০০ গ্রাম, ১ কেজি, ২ কেজি, ৫ কেজি) with automatic BDT price calculation.
- **Hardware Barcode Scanner Support:** Automated stream listener detects high-speed scanner keystrokes ($\le 50\text{ms}$) ending with Enter.
- **Bilingual Phonetic Search:** Search goods typing either Bengali (`চিনি`, `তেল`) or English phonetics (`chini`, `tel`).
- **Split & Multi-Modal Payments:** 1-tap **ক্যাশ বিক্রি** (Full Cash), **বাকিতে বিক্রি** (Full Due to Customer), or **আংশিক ও ডিজিটাল পেমেন্ট** (Cash + bKash/Nagad + Due).

### 2. 🧾 Native 58mm & 80mm ESC/POS Thermal Receipts
- Pure CSS printable thermal receipt formatted precisely for standard 58mm and 80mm roll widths.
- Displays store branding, Bengali invoice numbers, itemized quantities, customer previous balance, and total cumulative dues.
- **1-Click WhatsApp & SMS Reminders:** Instant link generators with pre-filled Bengali messages containing pending balance and bKash numbers.

### 3. 📖 Digital Bakir Khata (Credit Ledger)
- **11-Digit Mobile Number Validation:** Validates Bangladeshi phone numbers (`^01[3-9]\d{8}$`).
- **High-Contrast Semantic Balances:**
  - 🔴 **Crimson Red:** Customer owes money to shopkeeper (বকেয়া দেনা).
  - 🟢 **Emerald Green:** Cleared / zero balance (হিসাব পরিশোধিত).
- **বাকি আদায় (Collect Due) Modal:** Fast repayment recording with instant trigger rebalancing.
- **Audit-Trail Ledger:** Immutable chronological transaction history per customer.

### 4. 📦 Stock Management & Daily Profit Engine
- **Visual Stock Status Monitors:**
  - 🟢 **পর্যাপ্ত (In Stock)**
  - 🟡 **কম স্টক (Low Stock $\le$ alert threshold)**
  - 🔴 **স্টক শেষ (Out of Stock / 0 units)**
- **Daily Hisab-Kitab Analytics:**
  - **মোট বিক্রি** (Total Sales Revenue)
  - **ক্যাশবাক্সে নগদ জমা** (Cash Collected in Drawer)
  - **নতুন বাকি** (New Credit Extended)
  - **বাকি আদায়** (Past Due Recovered)
  - **দৈনিক দোকান খরচ** (Overheads: Rent, Power, Tea, Transport)
  - **নিট লাভ (Estimated Net Profit = Revenue - [COGS + Expenses])**

### 5. ⚡ Offline-First Architecture & FIFO Mutation Sync
- Runs **100% offline out-of-the-box** using Dexie.js (IndexedDB).
- Automatically intercepts checkout mutations and credit transactions in offline queue (`sync_queue`).
- Background FIFO listener automatically syncs mutations to Supabase PostgreSQL when internet connectivity returns.
- Interactive **"অফলাইন টেস্ট"** switch to test connectivity drops on demand.

---

## 🏗️ System Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Client Core** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v3 + Hind Siliguri (Bengali Typography) |
| **Icons** | Lucide React |
| **State Management** | Zustand (POS Cart & UI states) |
| **Local Database** | Dexie.js (IndexedDB offline database & sync queue) |
| **Backend & Cloud** | Supabase Edge + PostgreSQL 15+ (Multi-Tenant RLS & Triggers) |
| **Receipt Output** | Web Print API (58mm / 80mm ESC/POS) + WhatsApp URL Scheme |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase PostgreSQL Setup (Optional for Cloud Sync)

To connect with a live Supabase instance:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run the SQL schema and seed migrations in the Supabase SQL Editor:
   - [supabase/migrations/20260830000001_core_schema.sql](supabase/migrations/20260830000001_core_schema.sql)
   - [supabase/seed.sql](supabase/seed.sql)

---

## 🔒 Security & Access

- **Cashier PIN Protection:** Click the lock icon in the top header to lock the register. Default PIN: `1234`.
- **Tenant Isolation:** In Supabase, Row-Level Security ensures stores can only read and modify records tagged with their authenticated `store_id`.
