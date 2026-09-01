# MudiDokan (মুদিদোকান) — Offline-First Retail OS & Digital Bakir Khata

**মুদিদোকান (MudiDokan)** is a hyper-localized retail operating system and digital credit ledger (*Bakir Khata*) engineered specifically for grocery store shopkeepers (*mudi dokandars*) in Bangladesh. 

Designed for **zero cognitive load**, **unstable mobile network conditions (2G/3G/4G drops)**, **fast multi-modal checkout**, and **bulletproof financial consistency**.

---

## 🌟 Key Features

### 1. 🛒 Frictionless Quick-POS
- **1-Tap Unbarcoded Bulk Grid:** High-frequency goods (খোলা সয়াবিন তেল, চিনি, মসুর ডাল, ফার্মের ডিম, গোল আলু, পেঁয়াজ, চাল, রসুন) with visual icons and 1-tap cart additions.
- **Bulk Weight Converter:** Instant quantity presets (২৫০ গ্রাম, ৫০০ গ্রাম, ১ কেজি, ২ কেজি, ৫ কেজি) with automatic BDT price calculation.
- **Hardware Barcode Scanner Support:** Automated stream listener detects high-speed scanner keystrokes ($\le 50\text{ms}$) ending with Enter.
<<<<<<< HEAD
- **Bilingual Phonetic Search:** Search goods typing either Bengali (`চিনি`, `তেল`) or English phonetics (`chini`, `tel`).
=======
- **Bilingual Phonetic Search:** Search goods typing Bengali (`চিনি`, `তেল`), English (`sugar`), English phonetics (`chini`, `tel`, `dal`), or a barcode in either digit set. Implemented in `src/lib/phoneticSearch.ts`.
>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
- Runs **100% offline out-of-the-box** using Dexie.js (IndexedDB).
- Automatically intercepts checkout mutations and credit transactions in offline queue (`sync_queue`).
- Background FIFO listener automatically syncs mutations to Supabase PostgreSQL when internet connectivity returns.
=======
- Runs **100% offline out-of-the-box** using Dexie.js (IndexedDB), and installs as a **PWA** — a service worker precaches the app shell, so the till opens with no network at all, not just in an already-open tab.
- Automatically intercepts checkout mutations and credit transactions in offline queue (`sync_queue`).
- Background FIFO listener automatically syncs mutations to Supabase PostgreSQL when internet connectivity returns, in foreign-key order, with exponential backoff and a visible "আটকে আছে" counter for rows that could not be delivered.
- **One queue row = one table row.** Server-side triggers own the derived values (stock depletion, khata rebalancing), so the client never syncs `stock_quantity` or `current_balance` from a sale — that would apply the change twice.
>>>>>>> c18622f (Bug Fix)
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
<<<<<<< HEAD
3. Run the SQL schema and seed migrations in the Supabase SQL Editor:
=======
3. Run the SQL schema and seed migrations in the Supabase SQL Editor. The schema is generated from `src/@types/database.types.ts` and must stay in step with it:
>>>>>>> c18622f (Bug Fix)
   - [supabase/migrations/20260830000001_core_schema.sql](supabase/migrations/20260830000001_core_schema.sql)
   - [supabase/seed.sql](supabase/seed.sql)

---

## 🔒 Security & Access

<<<<<<< HEAD
- **Cashier PIN Protection:** Click the lock icon in the top header to lock the register. Default PIN: `1234`.
- **Tenant Isolation:** In Supabase, Row-Level Security ensures stores can only read and modify records tagged with their authenticated `store_id`.
=======
- **Cashier PIN Protection:** Tap the lock icon in the header to lock the register. Unlocking needs the staff member's 4-digit PIN, and the lock survives a page reload.
- **No secret is ever stored or displayed in the clear.** Passwords and PINs are kept as salted SHA-256 digests (`src/lib/secureHash.ts`); legacy plaintext records are upgraded on first login. The staff screen shows "পাসওয়ার্ড সুরক্ষিত" and offers a reset — never the value.
- **Demo logins are development-only.** The one-tap role buttons are compiled out of production builds (`DEMO_LOGINS_ENABLED`).
- **Tenant Isolation:** Every local query is scoped by `store_id`, and in Supabase, Row-Level Security restricts each store to its own rows. `is_super_admin()` is the only escape hatch.

### Demo credentials (development builds only)

| Role | Phone | Password |
| :--- | :--- | :--- |
| সুপার অ্যাডমিন | `01700000000` | `admin123` |
| দোকান মালিক | `01711998877` | `dokan123` |
| ম্যানেজার | `01811223344` | `dokan123` |
| ক্যাশিয়ার | `01911334455` | `dokan123` |

---

## 🧭 Business rules worth knowing

- **The business day is Asia/Dhaka, not UTC.** A sale at ৫:৩০ সকাল belongs to that day's হিসাব. Every date filter goes through `src/lib/dateUtils.ts`; never compare ISO strings directly.
- **Stock may go negative on purpose.** A dokandar is never blocked from selling goods that are physically on the shelf; the shortfall is surfaced as a warning and in the out-of-stock filter instead of being silently clamped to zero.
- **Credit limits are enforced.** A baki sale that would push a customer past their limit is blocked, and only an owner or manager can override it.
- **Stock is always held in the product's base unit.** Anything that touches stock — checkout, chalan replenishment, adjustments — converts through `src/lib/units.ts`.
- **Cash counts and day closings are persisted**, and yesterday's counted cash becomes today's opening float.

---

## ✅ Quality gates

```bash
npm run typecheck   # tsc -b --noEmit (strict mode is on)
npm run lint        # oxlint
npm run test        # vitest — money paths, units, Dhaka dates, credentials
npm run verify      # all of the above, then a production build
```

CI runs the same four steps on every push and pull request (`.github/workflows/ci.yml`).
>>>>>>> c18622f (Bug Fix)
