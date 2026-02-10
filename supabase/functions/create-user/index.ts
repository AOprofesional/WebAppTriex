import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserPayload {
    email: string
    full_name: string
    role: 'operator' | 'admin' | 'superadmin'
    sendInvite?: boolean
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('Request received:', req.method)

        // Debug: Check if Service Role Key is available
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!serviceRoleKey) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing')
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing Service Role Key' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with user's auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Verify user is authenticated
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            console.error('Auth check failed:', userError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid session or expierd token', details: userError }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('User authenticated:', user.id)

        // Check if user is admin or superadmin
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile check failed:', profileError)
            return new Response(
                JSON.stringify({ error: 'Could not verify user role - Profile not found' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('User role:', profile.role)

        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
            return new Response(
                JSON.stringify({ error: 'Insufficient permissions. Only admins can create users.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get the user data from request body
        const payload: CreateUserPayload = await req.json()
        console.log('Payload received for:', payload.email)

        if (!payload.email || !payload.full_name || !payload.role) {
            return new Response(
                JSON.stringify({ error: 'email, full_name, and role are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Create user using admin client
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            email_confirm: true,
            user_metadata: {
                full_name: payload.full_name
            }
        })

        if (authError) {
            console.error('Error creating user:', authError)
            throw authError
        }

        console.log('User created:', authData.user.id)

        // Update profile with role and full_name
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: payload.full_name,
                role: payload.role,
                email: payload.email
            })
            .eq('id', authData.user.id)

        if (profileUpdateError) {
            console.error('Error updating profile:', profileUpdateError)
            // Try to delete the user if profile update fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            throw profileUpdateError
        }

        // Send invitation email if requested
        if (payload.sendInvite !== false) {
            console.log('Sending invite email to:', payload.email)
            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
                payload.email,
                {
                    redirectTo: `${req.headers.get('origin') || 'http://localhost:3000'}/update-password`
                }
            )
            if (resetError) {
                console.warn('Could not send invitation email:', resetError)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: authData.user
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error in create-user function:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
