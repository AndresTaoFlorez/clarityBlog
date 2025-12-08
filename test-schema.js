// Test script to verify which schema has the data
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Buscando usuarios en diferentes schemas...\n');

// Test 1: Buscar en schema public
console.log('1. Buscando en schema PUBLIC:');
try {
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' });

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Encontrados: ${count} usuarios`);
    if (data && data.length > 0) {
      console.log('   📋 Usuarios:', data.map(u => ({ id: u.id, name: u.name, email: u.email })));
    }
  }
} catch (err) {
  console.log('   ❌ Error:', err.message);
}

console.log('\n2. Intentando acceder a schema PROJECT1:');
try {
  const { data, error, count } = await supabase
    .schema('project1')
    .from('users')
    .select('*', { count: 'exact' });

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log(`   ✅ Encontrados: ${count} usuarios`);
    if (data && data.length > 0) {
      console.log('   📋 Usuarios:', data.map(u => ({ id: u.id, name: u.name, email: u.email })));
    }
  }
} catch (err) {
  console.log('   ❌ Error:', err.message);
}

process.exit(0);
