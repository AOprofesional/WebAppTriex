const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSalesTeam() {
    try {
        console.log('Verificando tabla sales_team...');
        const { data, error } = await supabase.from('sales_team').select('*');
        
        if (error) {
            console.error('Error al consultar sales_team:', error.message);
        } else {
            console.log('✅ Tabla consultada con éxito. Registros actuales:', data.length);
            console.log(data);
        }
    } catch (err) {
        console.error('Error inesperado:', err);
    }
}

testSalesTeam();
