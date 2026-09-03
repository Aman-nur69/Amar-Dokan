import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sfhsrrmwckwefjtxjoij.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C9LiVCRDDwHEpwC7teg5LQ_3qw41Jue';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = [
  'day_closings',
  'cash_counts',
  'supplier_payments',
  'chalan_items',
  'supplier_chalans',
  'baki_transactions',
  'sale_items',
  'sales',
  'expenses',
  'customers',
  'products',
  'categories',
  'profiles',
  'stores',
];

async function main() {
  console.log('🧹 Purging all tables from live Supabase Cloud Database...');
  console.log(`Target: ${SUPABASE_URL}\n`);

  for (const table of TABLES) {
    process.stdout.write(`Purging "${table}"... `);
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.log(`⚠️  ${error.message}`);
    } else {
      console.log('✓ Cleaned');
    }
  }

  console.log('\n🎉 Complete! Database is clean and ready.');
}

main().catch(console.error);
