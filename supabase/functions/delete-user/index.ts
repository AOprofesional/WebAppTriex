import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserPayload {
    userId?: string   // auth user UUID (profile_id) — preferred
    email?: string    // fallback: look up by email in auth.users
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify caller is authenticated
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check admin/superadmin role
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return new Response(
                JSON.stringify({ error: 'Could not verify user role' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. Only admins can delete users.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const payload: DeleteUserPayload = await req.json()

        if (!payload.userId && !payload.email) {
            return new Response(
                JSON.stringify({ error: 'userId or email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Resolve the auth user ID to delete
        let targetUserId = payload.userId

        // If no userId provided (profile_id was null), look up by email
        if (!targetUserId && payload.email) {
            console.log(`Resolving auth user by email: ${payload.email}`)

            // listUsers doesn't filter by email directly so we use the admin API
            const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            })

            if (listError) {
                console.error('Error listing users:', listError)
                throw listError
            }

            const found = listData.users.find(u => u.email?.toLowerCase() === payload.email!.toLowerCase())

            if (!found) {
                // No auth user for this email — nothing to delete, that's fine
                console.log(`No auth user found for email ${payload.email} — skipping auth deletion`)
                return new Response(
                    JSON.stringify({ success: true, message: 'No auth user found for this email, skipped' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            targetUserId = found.id
            console.log(`Resolved email ${payload.email} to auth user ID: ${targetUserId}`)
        }

        // Safety: prevent self-deletion
        if (targetUserId === user.id) {
            return new Response(
                JSON.stringify({ error: 'You cannot delete your own account' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Delete the auth user (cascades to profiles via DB trigger)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId!)

        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            throw deleteError
        }

        return new Response(
            JSON.stringify({ success: true, message: 'User deleted successfully', deletedId: targetUserId }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in delete-user function:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
