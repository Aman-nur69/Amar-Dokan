import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(supabaseUrl, supabaseKey);

const accounts = [
  {
    phone: '01700000000',
    email: '01700000000@mudidokan.internal',
    password: 'admin123',
    full_name: 'সুপার অ্যাডমিন (System Administrator)',
    role: 'super_admin',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  },
  {
    phone: '01711998877',
    email: '01711998877@mudidokan.internal',
    password: 'dokan123',
    full_name: 'মোঃ রফিকুল ইসলাম (দোকান মালিক)',
    role: 'owner',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  },
  {
    phone: '01811223344',
    email: '01811223344@mudidokan.internal',
    password: 'dokan123',
    full_name: 'আব্দুল করিম (ম্যানেজার)',
    role: 'manager',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  },
  {
    phone: '01911334455',
    email: '01911334455@mudidokan.internal',
    password: 'dokan123',
    full_name: 'তানভীর হাসান (ক্যাশিয়ার)',
    role: 'cashier',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  },
];

async function createAuthUsers() {
  console.log('Creating/registering demo accounts in Supabase Auth...');

  for (const acc of accounts) {
    try {
      // 1. Try signing up
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: acc.email,
        password: acc.password,
        options: {
          data: {
            full_name: acc.full_name,
            phone: acc.phone,
            role: acc.role,
          },
        },
      });

      let userId = signUpData?.user?.id;

      if (signUpErr) {
        // If already registered, try sign in to check credentials
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: acc.email,
          password: acc.password,
        });

        if (signInErr) {
          console.warn(`⚠️ Account ${acc.phone} (${acc.role}): ${signUpErr.message} / ${signInErr.message}`);
        } else {
          userId = signInData?.user?.id;
          console.log(`✓ Account ${acc.phone} (${acc.role}) authenticated successfully!`);
        }
      } else {
        console.log(`✅ Created Supabase Auth user for ${acc.phone} (${acc.role}) -> UID: ${userId}`);
      }

      // Upsert profile in public.profiles table
      const profileRow = {
        id: userId || `f000000${accounts.indexOf(acc)}-0000-0000-0000-00000000000${accounts.indexOf(acc)}`,
        auth_user_id: userId || null,
        store_id: acc.store_id,
        full_name: acc.full_name,
        phone: acc.phone,
        role: acc.role,
        is_active: true,
      };

      const { error: profErr } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
      if (profErr) {
        console.warn(`Note on profile upsert for ${acc.phone}:`, profErr.message);
      } else {
        console.log(`   Profile linked in public.profiles table for ${acc.phone}`);
      }
    } catch (e) {
      console.error(`Error for ${acc.phone}:`, e.message);
    }
  }

  console.log('\n🎉 Finished creating Supabase Auth demo users!');
}

createAuthUsers();
