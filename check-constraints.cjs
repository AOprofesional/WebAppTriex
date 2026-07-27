const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    const email = 'duplicate_test@example.com';
    
    // Clean up first
    await supabase.from('passengers').delete().eq('email', email);
    
    // Insert first
    const { data: d1, error: e1 } = await supabase.from('passengers').insert({
        first_name: 'Test1',
        last_name: 'Test1',
        email: email
    }).select();
    
    console.log('Insert 1:', e1 ? e1.message : 'Success');
    
    // Insert second with same email
    const { data: d2, error: e2 } = await supabase.from('passengers').insert({
        first_name: 'Test2',
        last_name: 'Test2',
        email: email
    }).select();
    
    console.log('Insert 2:', e2 ? e2.message : 'Success');
    
    if (e2 && e2.code === '23505') {
        console.log('Email is UNIQUE restricted!');
    }
    
    // Cleanup
    await supabase.from('passengers').delete().eq('email', email);
}

checkConstraints();
