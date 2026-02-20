// Script to generate VAPID keys for Web Push
// Run this once: node utils/generateVapidKeys.js
// Then copy the keys to your Supabase system_settings table

import { generateKeyPairSync } from 'crypto';

function generateVapidKeys() {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: {
            type: 'spki',
            format: 'der'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'der'
        }
    });

    const publicKeyBase64 = publicKey.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const privateKeyBase64 = privateKey.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64
    };
}

const keys = generateVapidKeys();

console.log('\n🔑 VAPID Keys Generated Successfully!\n');
console.log('Public Key:');
console.log(keys.publicKey);
console.log('\nPrivate Key:');
console.log(keys.privateKey);
console.log('\n💾 Save these keys to your Supabase system_settings table:');
console.log(`
UPDATE system_settings
SET value = '${JSON.stringify(keys)}'::jsonb
WHERE category = 'push_notifications' AND key = 'vapid_keys';
`);
console.log('\n⚠️  IMPORTANT: Keep the private key secret!\n');
