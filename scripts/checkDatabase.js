import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
    if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = val;
  }
}

console.log('🔍 Checking Supabase Cloud Database Connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.slice(0, 16) + '...' : 'MISSING'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'stores',
  'profiles',
  'categories',
  'products',
  'customers',
  'sales',
  'sale_items',
  'baki_transactions',
  'expenses',
  'supplier_chalans',
  'chalan_items',
  'supplier_payments',
  'cash_counts',
  'day_closings'
];

async function runCheck() {
  const results = {};
  let totalErrors = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        results[table] = { status: 'ERROR', error: error.message };
        totalErrors++;
      } else {
        results[table] = {
          status: 'OK',
          count: count !== null ? count : (data ? data.length : 0),
          samples: data || []
        };
      }
    } catch (err) {
      results[table] = { status: 'EXCEPTION', error: err.message };
      totalErrors++;
    }
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('                 SUPABASE DATABASE HEALTH REPORT                 ');
  console.log('════════════════════════════════════════════════════════════════\n');

  for (const [table, res] of Object.entries(results)) {
    if (res.status === 'OK') {
      console.log(`✅ Table [${table.padEnd(18)}]: ${res.count} rows`);
    } else {
      console.log(`❌ Table [${table.padEnd(18)}]: ${res.error}`);
    }
  }

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('                     SAMPLE DATA PREVIEW                        ');
  console.log('────────────────────────────────────────────────────────────────\n');

  if (results.stores?.samples?.length > 0) {
    const s = results.stores.samples[0];
    console.log(`🏪 Active Store: ${s.name} (Proprietor: ${s.proprietor}, Phone: ${s.phone}, Status: ${s.verification_status})`);
  }

  if (results.products?.samples?.length > 0) {
    console.log(`\n📦 Products Preview (${results.products.count} total):`);
    results.products.samples.slice(0, 4).forEach((p) => {
      console.log(`   - ${p.name_bn} (${p.name_en || ''}) | Price: ৳${p.selling_price} | Stock: ${p.stock_quantity} ${p.unit}`);
    });
  }

  if (results.customers?.samples?.length > 0) {
    console.log(`\n👥 Customers Preview (${results.customers.count} total):`);
    results.customers.samples.slice(0, 3).forEach((c) => {
      console.log(`   - ${c.name} | Phone: ${c.phone} | Due Balance: ৳${c.current_balance}`);
    });
  }

  if (results.categories?.samples?.length > 0) {
    console.log(`\n🏷️ Categories (${results.categories.count} total):`);
    const catNames = results.categories.samples.map(c => c.name_bn).join(', ');
    console.log(`   ${catNames}`);
  }

  if (results.profiles?.count === 0) {
    console.log('\n⚠️  PROFILES TABLE IS EMPTY: No users/staff are currently in the profiles table.');
  } else if (results.profiles?.samples?.length > 0) {
    console.log(`\n👤 Profiles (${results.profiles.count} total):`);
    results.profiles.samples.forEach(pr => {
      console.log(`   - ${pr.full_name} (${pr.role}) | Phone: ${pr.phone}`);
    });
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  if (totalErrors === 0) {
    console.log('🎉 ALL TABLES ARE ACCESSIBLE AND HEALTHY IN SUPABASE!');
  } else {
    console.log(`⚠️  ${totalErrors} table(s) encountered errors.`);
  }
  console.log('════════════════════════════════════════════════════════════════\n');
}

runCheck();
