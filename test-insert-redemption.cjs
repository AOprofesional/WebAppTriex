const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    try {
        const { data, error } = await supabase
        .from('redemption_requests')
        .insert({
          passenger_id: '00000000-0000-0000-0000-000000000000', // random fake id
          type: 'NEXT_TRIP',
          points_amount: 10,
          comment: 'test',
          status: 'PENDING'
        });
        
        console.log("Insert result:", { data, error });
    } catch (e) {
        console.error(e);
    }
}
testInsert();
