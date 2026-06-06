const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPolicies() {
    console.log("Checking pg_policies via RPC (if exists) or we can just fetch via REST...");
    // Let's try to query points ledger as anon
    const { data, error } = await supabase.from('orange_points_ledger').select('*').limit(1);
    console.log("Anon ledger:", { data, error });

    const { data: reqData, error: reqErr } = await supabase.from('redemption_requests').select('*').limit(1);
    console.log("Anon requests:", { data: reqData, error: reqErr });
}

testPolicies();
