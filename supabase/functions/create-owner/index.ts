import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client to verify admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the caller is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can create owner accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { 
      business_name, 
      owner_name, 
      owner_email, 
      owner_password, 
      phone, 
      subscription_plan, 
      subscription_days, 
      max_stores,
      business_type,
      subscription_tier,
    } = await req.json()

    // Validate required fields
    if (!business_name || !owner_name || !owner_email || !owner_password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true,
      user_metadata: { full_name: owner_name }
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Create customer record
    const subscriptionEnd = new Date()
    subscriptionEnd.setDate(subscriptionEnd.getDate() + (subscription_days || 30))

    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        business_name,
        owner_name,
        owner_email,
        phone: phone || null,
        subscription_plan: subscription_plan || 'monthly',
        subscription_end: subscriptionEnd.toISOString().split('T')[0],
        max_stores: max_stores || 2,
        business_type: business_type || 'restaurant',
        subscription_tier: subscription_tier || 'basic',
      })
      .select()
      .single()

    if (customerError) {
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: customerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Create owner role
    const { error: roleInsertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'owner',
      customer_id: customerData.id,
      is_active: true
    })

    if (roleInsertError) {
      // Rollback: delete customer and user
      await supabaseAdmin.from('customers').delete().eq('id', customerData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer: customerData,
        message: `Owner account created for ${owner_name}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})