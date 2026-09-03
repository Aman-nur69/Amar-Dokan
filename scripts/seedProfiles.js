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

const demoProfiles = [
  {
    id: 'f0000000-0000-0000-0000-000000000000',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'সুপার অ্যাডমিন (System Administrator)',
    phone: '01700000000',
    role: 'super_admin',
    is_active: true
  },
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'মোঃ রফিকুল ইসলাম (দোকান মালিক)',
    phone: '01711998877',
    role: 'owner',
    is_active: true
  },
  {
    id: 'f0000002-0000-0000-0000-000000000002',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'আব্দুল করিম (ম্যানেজার)',
    phone: '01811223344',
    role: 'manager',
    is_active: true
  },
  {
    id: 'f0000003-0000-0000-0000-000000000003',
    store_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    full_name: 'তানভীর হাসান (ক্যাশিয়ার)',
    phone: '01911334455',
    role: 'cashier',
    is_active: true
  }
];

async function seedProfiles() {
  console.log('Seeding demo profiles into Supabase...');
  const { data, error } = await supabase
    .from('profiles')
    .upsert(demoProfiles, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('Error seeding profiles:', error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} demo profiles!`);
    data.forEach(p => console.log(`   - ${p.full_name} (${p.role}) -> Phone: ${p.phone}`));
  }
}

seedProfiles();
