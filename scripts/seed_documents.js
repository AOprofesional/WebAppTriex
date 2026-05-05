import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables desde .env.local
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDocuments() {
    console.log('🌱 Seeding passenger documents...');

    try {
        // 1. Get the Rio Trip
        const { data: trips } = await supabase
            .from('trips')
            .select('id')
            .ilike('name', '%Rio%')
            .limit(1);

        if (!trips || trips.length === 0) throw new Error('Rio trip not found');
        const tripId = trips[0].id;

        // 2. Get Juan Perez
        const { data: passengers } = await supabase
            .from('passengers')
            .select('id')
            .eq('email', 'inteligencialaboral.ia@gmail.com')
            .limit(1);

        if (!passengers || passengers.length === 0) throw new Error('Juan Perez not found');
        const passengerId = passengers[0].id;

        // 3. Ensure Document Types exist
        const docTypes = ['Pasaporte', 'Seguro de Viaje'];
        const docTypeIds = {};

        for (const name of docTypes) {
            // Check if exists
            let { data: existing } = await supabase
                .from('document_types')
                .select('id')
                .eq('name', name)
                .single();

            if (!existing) {
                const { data: created } = await supabase
                    .from('document_types')
                    .insert({ name, is_active: true })
                    .select()
                    .single();
                existing = created;
                console.log(`✅ Created Document Type: ${name}`);
            }
            docTypeIds[name] = existing.id;
        }

        // 4. Ensure Required Documents exist for the trip
        const requiredDocIds = {};

        for (const name of docTypes) {
            const docTypeId = docTypeIds[name];

            // Check if requirement exists
            let { data: existingReq } = await supabase
                .from('required_documents')
                .select('id')
                .eq('trip_id', tripId)
                .eq('doc_type_id', docTypeId)
                .single();

            if (!existingReq) {
                const { data: createdReq } = await supabase
                    .from('required_documents')
                    .insert({
                        trip_id: tripId,
                        doc_type_id: docTypeId,
                        is_required: true,
                        description: `Copia de ${name}`
                    })
                    .select()
                    .single();
                existingReq = createdReq;
                console.log(`✅ Linked ${name} requirement to Trip`);
            }
            requiredDocIds[name] = existingReq.id;
        }

        // 5. Insert Passenger Documents
        // Pasaporte (Approved)
        const passportReqId = requiredDocIds['Pasaporte'];
        const { error: passportError } = await supabase
            .from('passenger_documents')
            .upsert({
                id: '810624bd-3481-42cb-805d-1065096570c9', // Fixed ID to avoid duplicates if re-run
                trip_id: tripId,
                passenger_id: passengerId,
                required_document_id: passportReqId,
                status: 'approved',
                uploaded_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                review_comment: 'Todo correcto',
                bucket: 'triex-documents',
                file_path: 'dummy/passport.pdf',
                format: 'pdf',
                mime_type: 'application/pdf'
            });

        if (passportError) console.error('Error inserting passport:', passportError);
        else console.log('✅ Inserted Pasaporte (Approved)');

        // Seguro de Viaje (Uploaded/Pending)
        const insuranceReqId = requiredDocIds['Seguro de Viaje'];
        const { error: insuranceError } = await supabase
            .from('passenger_documents')
            .upsert({
                id: '920624bd-3481-42cb-805d-1065096570d0',
                trip_id: tripId,
                passenger_id: passengerId,
                required_document_id: insuranceReqId,
                status: 'uploaded',
                uploaded_at: new Date().toISOString(),
                bucket: 'triex-documents',
                file_path: 'dummy/insurance.pdf',
                format: 'pdf',
                mime_type: 'application/pdf'
            });

        if (insuranceError) console.error('Error inserting insurance:', insuranceError);
        else console.log('✅ Inserted Seguro de Viaje (Uploaded)');

        console.log('✨ Document seeding completed!');

    } catch (err) {
        console.error('❌ Error seeding documents:', err);
    }
}

seedDocuments();
