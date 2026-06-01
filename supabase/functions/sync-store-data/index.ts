import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Auth helper: verify JWT, store_code, or active store_id
async function authenticateRequest(req: Request, supabaseAdmin: any, store_id: string, store_code?: string): Promise<{ authorized: boolean; error?: string }> {
  // Path 1: JWT authentication
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader !== 'Bearer null' && !authHeader.endsWith('undefined')) {
    const token = authHeader.replace('Bearer ', '')
    // Skip if token is the anon key (not a real user JWT)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    if (token !== anonKey) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role, store_id, customer_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('role', ['admin', 'owner', 'store_manager', 'staff'])
            .limit(1)
            .maybeSingle()
          
          if (roleData) {
            if (roleData.role === 'admin') return { authorized: true }
            if (roleData.role === 'owner') {
              // Check if store exists first
              const { data: store } = await supabaseAdmin
                .from('stores').select('customer_id').eq('id', store_id).maybeSingle()
              // If store doesn't exist, allow owner through (will be caught by store existence check later)
              if (!store) return { authorized: true }
              if (store.customer_id === roleData.customer_id) return { authorized: true }
            }
            if ((roleData.role === 'store_manager' || roleData.role === 'staff') && roleData.store_id === store_id) {
              return { authorized: true }
            }
          }
          return { authorized: false, error: 'Access denied to this store' }
        }
      } catch {}
    }
  }

  // Path 2: Store code authentication
  if (store_code) {
    const { data: storeData } = await supabaseAdmin
      .from('stores')
      .select('id, store_code')
      .eq('id', store_id)
      .eq('store_code', store_code)
      .eq('is_active', true)
      .maybeSingle()
    
    if (storeData) return { authorized: true }
    return { authorized: false, error: 'Invalid store credentials' }
  }

  // Path 3: Fallback - verify store_id is valid and active (for store-login sessions without store_code)
  const { data: activeStore } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', store_id)
    .eq('is_active', true)
    .maybeSingle()
  
  if (activeStore) return { authorized: true }

  return { authorized: false, error: 'Authentication required' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { action, store_id, data_type, store_code } = body

    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Authenticate the request
    const auth = await authenticateRequest(req, supabaseAdmin, store_id, store_code)
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify store exists and is active
    const { data: storeData } = await supabaseAdmin
      .from('stores').select('id').eq('id', store_id).eq('is_active', true).maybeSingle()

    if (!storeData) {
      return new Response(JSON.stringify({ error: 'Store not found or inactive', store_missing: true }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ===== MENU ITEMS =====
    if (data_type === 'menu_items') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('menu_items').select('*').eq('store_id', store_id)
        if (error) throw error

        const menuItemIds = (data || []).map((item: any) => item.id)
        let ingredientsData: any[] = []
        let variationsData: any[] = []

        if (menuItemIds.length > 0) {
          const { data: ings } = await supabaseAdmin
            .from('menu_item_ingredients').select('*').in('menu_item_id', menuItemIds)
          ingredientsData = ings || []

          const { data: vars } = await supabaseAdmin
            .from('menu_item_variations').select('*').in('menu_item_id', menuItemIds).order('sort_order', { ascending: true })
          variationsData = vars || []
        }

        return new Response(JSON.stringify({ success: true, items: data || [], ingredients: ingredientsData, variations: variationsData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          name: item.name,
          name_hindi: item.nameHindi || item.name_hindi || null,
          price: item.price || 0,
          category: item.category || 'General',
          is_available: item.isAvailable !== undefined ? item.isAvailable : (item.is_available !== undefined ? item.is_available : true),
          preparation_time: item.preparationTime || item.preparation_time || null,
          stock: item.stock || null,
          image_url: item.image || item.image_url || null,
          linked_inventory_id: item.linkedInventoryId || item.linked_inventory_id || null,
          gramage_per_unit: item.gramagePerUnit || item.gramage_per_unit || 0,
          sku: item.sku || null,
        }))

        const { data, error } = await supabaseAdmin
          .from('menu_items').upsert(dbItems).select()
        if (error) throw error

        return new Response(JSON.stringify({ success: true, items: data || [], saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        await supabaseAdmin.from('menu_item_ingredients').delete().in('menu_item_id', item_ids)
        await supabaseAdmin.from('menu_item_variations').delete().in('menu_item_id', item_ids)
        const { error } = await supabaseAdmin
          .from('menu_items').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update') {
        const { item_id, updates } = body
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'item_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('menu_items').update(updates).eq('id', item_id).eq('store_id', store_id)
        if (error) throw error

        if (body.ingredients !== undefined) {
          await supabaseAdmin.from('menu_item_ingredients').delete().eq('menu_item_id', item_id)
          if (body.ingredients.length > 0) {
            await supabaseAdmin.from('menu_item_ingredients').insert(
              body.ingredients.map((ing: any) => ({
                menu_item_id: item_id,
                inventory_item_id: ing.inventoryItemId || ing.inventory_item_id,
                quantity_required: ing.quantityRequired || ing.quantity_required,
                unit: ing.unit
              }))
            )
          }
        }

        if (body.variations !== undefined) {
          await supabaseAdmin.from('menu_item_variations').delete().eq('menu_item_id', item_id)
          if (body.variations.length > 0) {
            await supabaseAdmin.from('menu_item_variations').insert(
              body.variations.map((v: any, idx: number) => ({
                menu_item_id: item_id,
                name: v.name,
                sku: v.sku || null,
                price: v.price || 0,
                is_available: v.isAvailable !== undefined ? v.isAvailable : true,
                stock: v.stock || null,
                sort_order: v.sortOrder !== undefined ? v.sortOrder : idx,
                unit: v.unit || 'pcs'
              }))
            )
          }
        }

        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== INVENTORY =====
    if (data_type === 'inventory') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('inventory_items').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || 'pcs',
          min_stock: item.minStock || item.min_stock || 0,
          cost_per_unit: item.costPerUnit || item.cost_per_unit || 0,
          cost_unit: item.costUnit || item.cost_unit || 'pcs',
          production_yield: item.productionYield || item.production_yield || null,
          production_yield_unit: item.productionYieldUnit || item.production_yield_unit || null,
          updated_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('inventory_items').upsert(dbItems, { onConflict: 'id,store_id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('inventory_items').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== EXPENSES =====
    if (data_type === 'expenses') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('expenses').select('*').eq('store_id', store_id).order('date', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          category: item.category || 'General',
          amount: item.amount || 0,
          description: item.description || '',
          date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          paid_by: item.paidBy || item.paid_by || '',
          updated_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('expenses').upsert(dbItems, { onConflict: 'id,store_id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('expenses').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== HELD BILLS =====
    if (data_type === 'held_bills') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('held_bills').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          items: item.items || [],
          table_number: item.tableNumber || item.table_number || null,
          customer_name: item.customerName || item.customer_name || null,
          held_at: item.heldAt ? new Date(item.heldAt).toISOString() : new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('held_bills').upsert(dbItems, { onConflict: 'id,store_id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('held_bills').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== TABLES =====
    if (data_type === 'tables') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_settings').select('*').eq('store_id', store_id).eq('setting_key', 'tables')
        if (error) throw error
        const tables = data?.[0]?.setting_value || []
        return new Response(JSON.stringify({ success: true, items: tables }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        const { error } = await supabaseAdmin
          .from('store_settings')
          .upsert({
            store_id,
            setting_key: 'tables',
            setting_value: items || [],
            updated_at: new Date().toISOString(),
          }, { onConflict: 'store_id,setting_key' })
        if (error) {
          await supabaseAdmin
            .from('store_settings')
            .update({ setting_value: items || [], updated_at: new Date().toISOString() })
            .eq('store_id', store_id)
            .eq('setting_key', 'tables')
        }
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== SETTINGS =====
    if (data_type === 'settings') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_settings').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { settings } = body
        if (!settings || typeof settings !== 'object') {
          return new Response(JSON.stringify({ error: 'settings object required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbSettings = Object.entries(settings).map(([key, value]) => ({
          store_id,
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }))

        for (const setting of dbSettings) {
          const { error } = await supabaseAdmin
            .from('store_settings')
            .upsert(setting, { onConflict: 'store_id,setting_key' })
          if (error) {
            await supabaseAdmin
              .from('store_settings')
              .update({ setting_value: setting.setting_value, updated_at: setting.updated_at })
              .eq('store_id', store_id)
              .eq('setting_key', setting.setting_key)
          }
        }

        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== POS CUSTOMERS =====
    if (data_type === 'pos_customers') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('pos_customers').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          name: item.name || '',
          phone: item.phone || null,
          email: item.email || null,
          address: item.address || null,
          city: item.city || null,
          state: item.state || null,
          pincode: item.pincode || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('pos_customers').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('pos_customers').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== ADVANCE REQUESTS =====
    if (data_type === 'advance_requests') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('advance_requests').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (staff_id) query = query.eq('staff_id', staff_id)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          amount: item.amount || 0,
          reason: item.reason || null,
          status: item.status || 'pending',
          approved_by: item.approvedBy || item.approved_by || null,
          approved_at: item.approvedAt || item.approved_at || null,
          paid_at: item.paidAt || item.paid_at || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('advance_requests').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== LEAVE REQUESTS =====
    if (data_type === 'leave_requests') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('leave_requests').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (staff_id) query = query.eq('staff_id', staff_id)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          leave_type: item.type || item.leave_type || 'casual',
          start_date: item.startDate || item.start_date,
          end_date: item.endDate || item.end_date,
          reason: item.reason || null,
          status: item.status || 'pending',
          approved_by: item.approvedBy || item.approved_by || null,
          approved_at: item.approvedAt || item.approved_at || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('leave_requests').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== STAFF NOTIFICATIONS =====
    if (data_type === 'staff_notifications') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('staff_notifications').select('*').eq('store_id', store_id).order('created_at', { ascending: false }).limit(100)
        if (staff_id) query = query.or(`staff_id.eq.${staff_id},staff_id.is.null`)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id || null,
          title: item.title || '',
          message: item.message || null,
          type: item.type || 'info',
          is_read: item.is_read || item.read || false,
          created_by: item.created_by || item.createdBy || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('staff_notifications').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update') {
        const { item_id, updates } = body
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'item_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('staff_notifications').update(updates).eq('id', item_id).eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== STAFF SCHEDULES =====
    if (data_type === 'staff_schedules') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('staff_schedules').select('*').eq('store_id', store_id).order('date', { ascending: true })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          date: item.date,
          shift: item.shift || 'morning',
          start_time: item.startTime || item.start_time || '09:00',
          end_time: item.endTime || item.end_time || '18:00',
          notes: item.notes || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('staff_schedules').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('staff_schedules').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== CATEGORIES =====
    if (data_type === 'categories') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_categories').select('*').eq('store_id', store_id).order('sort_order', { ascending: true })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any, idx: number) => ({
          store_id,
          category_id: item.id || item.category_id,
          name: item.name,
          name_hindi: item.nameHindi || item.name_hindi || null,
          icon: item.icon || '📦',
          color: item.color || 'cat-food',
          sort_order: item.sortOrder !== undefined ? item.sortOrder : idx,
        }))
        // Delete existing and re-insert for clean sync
        await supabaseAdmin.from('store_categories').delete().eq('store_id', store_id)
        const { data, error } = await supabaseAdmin.from('store_categories').insert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== BILL COUNTERS =====
    if (data_type === 'bill_counter') {
      if (action === 'increment') {
        const { counter_type } = body // 'bill' or 'kot'
        const today = new Date().toISOString().split('T')[0]
        
        if (counter_type === 'bill') {
          // Atomic increment
          const { data, error } = await supabaseAdmin.rpc('increment_bill_counter', { p_store_id: store_id, p_date: today })
          if (error) throw error
          return new Response(JSON.stringify({ success: true, counter: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        
        if (counter_type === 'kot') {
          const { data, error } = await supabaseAdmin.rpc('increment_kot_counter', { p_store_id: store_id, p_date: today })
          if (error) throw error
          return new Response(JSON.stringify({ success: true, counter: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action or data_type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
