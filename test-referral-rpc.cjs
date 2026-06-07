const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MTUzMSwiZXhwIjoyMDg0NjU3NTMxfQ.k722QVgUIJL_QHk24BKST29zldTzpJ7p1_5B7bx1Mzg';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTripCategories() {
    try {
        console.log("Checking trips...");
        const { data: trips, error } = await supabase.from('trips').select('id, name, trip_category, purchase_confirmed').limit(10);
        console.log("Trips:", trips);
        
        console.log("Checking passengers with referral...");
        const { data: passengers, error: pError } = await supabase.from('passengers').select('id, first_name, referred_by_passenger_id').not('referred_by_passenger_id', 'is', null).limit(5);
        console.log("Passengers with referral:", passengers);
        
    } catch (e) {
        console.error(e);
    }
}
checkTripCategories();
