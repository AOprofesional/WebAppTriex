const { createClient } = require('@supabase/supabase-js');

// Utilizamos la conexión al proyecto de desarrollo (obtenida de test-referral-rpc.cjs)
const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MTUzMSwiZXhwIjoyMDg0NjU3NTMxfQ.k722QVgUIJL_QHk24BKST29zldTzpJ7p1_5B7bx1Mzg';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUniqueEmail() {
    const testEmail = `test_unique_${Date.now()}@example.com`;

    console.log("==========================================");
    console.log(`Iniciando prueba con email: ${testEmail}`);
    console.log("==========================================\n");

    try {
        // 1. Crear pasajero principal
        console.log("1. Creando pasajero PRINCIPAL...");
        const { data: primaryPassenger, error: error1 } = await supabase
            .from('passengers')
            .insert({
                first_name: 'Titular',
                last_name: 'Prueba',
                email: testEmail,
                passenger_type_id: 1 // required by DB
            })
            .select()
            .single();

        if (error1) {
            console.error("❌ Falló la creación del pasajero principal:", error1.message);
            return;
        }
        console.log("✅ Pasajero principal creado con ID:", primaryPassenger.id);

        // 2. Intentar crear OTRO pasajero principal con EL MISMO EMAIL
        console.log("\n2. Intentando crear OTRO pasajero PRINCIPAL con el MISMO email...");
        const { data: duplicatePrimary, error: error2 } = await supabase
            .from('passengers')
            .insert({
                first_name: 'Titular Falso',
                last_name: 'Prueba',
                email: testEmail,
                passenger_type_id: 1
            })
            .select();

        if (error2) {
            console.log("✅ Correcto: La base de datos BLOQUEÓ la creación del segundo titular (Error:", error2.message, ")");
        } else {
            console.warn("❌ Advertencia: La base de datos PERMITIÓ la creación. (Asegúrate de haber ejecutado la nueva migración)");
        }

        // 3. Crear ACOMPAÑANTE con EL MISMO EMAIL
        console.log("\n3. Intentando crear ACOMPAÑANTE con el MISMO email...");
        const { data: companion, error: error3 } = await supabase
            .from('passengers')
            .insert({
                first_name: 'Acompañante',
                last_name: 'Prueba',
                email: testEmail,
                parent_passenger_id: primaryPassenger.id, // Es acompañante
                passenger_type_id: 1
            })
            .select()
            .single();

        if (error3) {
            console.error("❌ Falló la creación del acompañante:", error3.message);
        } else {
            console.log("✅ Correcto: Se PERMITIÓ crear al acompañante usando el email de su titular. ID:", companion.id);
        }

    } catch (e) {
        console.error("Error durante el test:", e);
    }
}

testUniqueEmail();
