const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://triexwebapp-supabase-triex.gwbo3g.easypanel.host';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjemlvcnNpcXp3eGJlYnhhZmVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4MTUzMSwiZXhwIjoyMDg0NjU3NTMxfQ.k722QVgUIJL_QHk24BKST29zldTzpJ7p1_5B7bx1Mzg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    const tests = [
        { name: '1. Null both', docType: null, docNum: null },
        { name: '2. Undefined both', docType: undefined, docNum: undefined },
        { name: '3. Empty string docNum, null docType', docType: null, docNum: '' },
        { name: '4. Empty string docNum, undefined docType', docType: undefined, docNum: '' },
        { name: '5. DNI with number', docType: 'DNI', docNum: '12345678' },
        { name: '6. DNI with empty string', docType: 'DNI', docNum: '' },
        { name: '7. DNI with null', docType: 'DNI', docNum: null },
        { name: '8. null docType with number', docType: null, docNum: '12345678' },
        { name: '9. undefined docType with number', docType: undefined, docNum: '12345678' },
        { name: '10. Pasaporte with number', docType: 'Pasaporte', docNum: 'ABC12345' },
        { name: '11. PASAPORTE uppercase', docType: 'PASAPORTE', docNum: 'ABC12345' },
        { name: '12. PASSPORT', docType: 'PASSPORT', docNum: 'ABC12345' },
        { name: '13. Otro with number', docType: 'Otro', docNum: '999' },
        { name: '14. dni lowercase', docType: 'dni', docNum: '12345678' },
        { name: '15. DNI with numeric string (7-8 digits)', docType: 'DNI', docNum: '34567890' },
        { name: '16. DNI with formatted (dots)', docType: 'DNI', docNum: '34.567.890' },
        { name: '17. DNI with 9 digits', docType: 'DNI', docNum: '123456789' },
        { name: '18. DNI with letters', docType: 'DNI', docNum: 'DNI12345' },
    ];

    for (const t of tests) {
        const payload = {
            first_name: 'Test',
            last_name: 'Constraint',
            email: `test_doc_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
            passenger_type_id: 1,
            document_type: t.docType,
            document_number: t.docNum
        };
        const { data, error } = await supabase.from('passengers').insert(payload).select();
        if (error) {
            console.log(`❌ [${t.name}]: FAILED ->`, error.message);
        } else {
            console.log(`✅ [${t.name}]: SUCCESS`);
            if (data && data[0]) {
                await supabase.from('passengers').delete().eq('id', data[0].id);
            }
        }
    }
}

test();
