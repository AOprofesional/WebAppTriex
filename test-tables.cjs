const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

async function listTables() {
    try {
        console.log('Obteniendo esquema de la base de datos para listar las tablas...');
        
        // El endpoint /rest/v1/ expone la especificación OpenAPI de Supabase (PostgREST)
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // En la versión de OpenAPI de Supabase, las tablas están en 'definitions' o 'components.schemas'
        const schemas = data.definitions || (data.components && data.components.schemas) || {};
        
        const tables = Object.keys(schemas);
        
        console.log(`\n¡Se encontraron ${tables.length} tablas/vistas públicas!`);
        console.log('Listado de tablas disponibles:');
        tables.forEach((table, index) => {
            console.log(` ${index + 1}. ${table}`);
        });

    } catch (err) {
        console.error('Error al obtener las tablas:', err.message);
    }
}

listTables();
