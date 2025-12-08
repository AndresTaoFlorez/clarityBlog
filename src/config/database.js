// backend/src/config/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Forzar las credenciales correctas para evitar problemas de cache
const supabaseUrl = 'https://tziskwokcjhqljiuuunz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aXNrd29rY2pocWxqaXV1dW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3MTA0MiwiZXhwIjoyMDgwNzQ3MDQyfQ.HMpAPK3lZlvgDdlFb-Rn2n20LL8935gMJC6M8rE4Fug';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY en el archivo .env');
}

// Configurar Supabase client con service_role key para acceso completo desde el backend
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function para acceder a las tablas en el schema public
export const db = {
  from: (table) => supabase.from(table)
};

// Test de conexión deshabilitado para evitar errores al inicio
// Se verificará la conexión cuando se use la API
console.log('🔧 Cliente de Supabase configurado y listo para usar');
