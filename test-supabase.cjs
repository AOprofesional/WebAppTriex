const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Probando conexión a Supabase...');
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        
        if (error) {
            console.error('Error al conectar:', error.message);
        } else {
            console.log('✅ Conexión exitosa. Datos recibidos:', data);
        }
    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

testConnection();
