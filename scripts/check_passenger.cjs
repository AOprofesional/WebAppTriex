
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gcziorsiqzwxbebxafeo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MTUzMSwiZXhwIjoyMDg0NjU3NTMxfQ.k722QVgUIJL_QHk24BKST29zldTzpJ7p1_5B7bx1Mzg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'agueromiily28@gmail.com';

async function checkPassenger() {
  console.log(`Checking passenger with email: ${email}`);

  // 1. Get Passenger Profile
  const { data: passengers, error: pError } = await supabase
    .from('passengers')
    .select('*')
    .eq('email', email);

  if (pError) {
    console.error('Error fetching passenger:', pError);
    return;
  }

  if (passengers.length === 0) {
    console.log('No passenger found with this email in "passengers" table.');
    
    // Check Profiles table just in case
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
      
    if (profiles && profiles.length > 0) {
        console.log('Found in "profiles" table but not in "passengers":', profiles);
    } else {
        console.log('No profile found either.');
    }
    return;
  }

  const passenger = passengers[0];
  console.log('Passenger found:', JSON.stringify(passenger, null, 2));

  // 2. Check Auth Status (if possible)
  if (passenger.profile_id) {
    console.log(`Passenger has profile_id: ${passenger.profile_id}. Checking auth...`);
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(passenger.profile_id);
    if (authError) {
      console.error('Error fetching auth user:', authError);
    } else {
      console.log('Auth user details:', JSON.stringify(authUser, null, 2));
    }
  } else {
    console.log('Passenger does NOT have a profile_id (not registered/logged in yet).');
  }

  // 3. Check Trips
  const { data: tripPassengers, error: tpError } = await supabase
    .from('trip_passengers')
    .select('*, trips(*)')
    .eq('passenger_id', passenger.id);

  if (tpError) {
    console.error('Error fetching trips:', tpError);
  } else {
    console.log('Trips associated:', JSON.stringify(tripPassengers, null, 2));
  }

  // 4. Check Documents
  const { data: documents, error: dError } = await supabase
    .from('passenger_documents')
    .select('*, required_documents(*)')
    .eq('passenger_id', passenger.id);

  if (dError) {
    console.error('Error fetching documents:', dError);
  } else {
    console.log('Documents uploaded:', JSON.stringify(documents, null, 2));
  }
}

checkPassenger();
