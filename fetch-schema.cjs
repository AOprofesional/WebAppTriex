const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

async function fetchPolicies() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const data = await response.json();
        const schemas = data.definitions || (data.components && data.components.schemas) || {};
        
        console.log("Orange Points Ledger Schema:");
        console.log(JSON.stringify(schemas['orange_points_ledger'], null, 2));

        console.log("Redemption Requests Schema:");
        console.log(JSON.stringify(schemas['redemption_requests'], null, 2));
    } catch (e) {
        console.error(e);
    }
}
fetchPolicies();
